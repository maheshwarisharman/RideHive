const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "ridehive_secret"; // change in production

// DB CONNECTION
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "ridehive",
});

// 🔐 AUTH MIDDLEWARE
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

//////////////////////////////////////////////////////////////
// 🔐 AUTH APIs
//////////////////////////////////////////////////////////////

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name, email, hash]
    );

    res.json({ message: "User created", user_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = users[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET);

    await db.query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.user_id, token]
    );

    await db.query(
      `INSERT INTO login_logs (user_id, login_status)
       VALUES (?, 'SUCCESS')`,
      [user.user_id]
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT
app.post("/logout", authMiddleware, async (req, res) => {
  await db.query(
    `DELETE FROM user_sessions WHERE session_token = ?`,
    [req.headers.authorization.split(" ")[1]]
  );

  res.json({ message: "Logged out" });
});

//////////////////////////////////////////////////////////////
// 📍 LOCATION
//////////////////////////////////////////////////////////////

app.post("/location", authMiddleware, async (req, res) => {
  const { place_name, address, lat, lng } = req.body;

  const [result] = await db.query(
    `INSERT INTO locations (place_name, address, latitude, longitude)
     VALUES (?, ?, ?, ?)`,
    [place_name, address, lat, lng]
  );

  res.json({ location_id: result.insertId });
});

//////////////////////////////////////////////////////////////
// 🚗 CREATE RIDE REQUEST
//////////////////////////////////////////////////////////////

app.post("/ride/request", authMiddleware, async (req, res) => {
  const { location_id, type, luggage_count } = req.body;

  try {
    // 1. Create ride request (status defaults to 'SEARCHING')
    const [result] = await db.query(
      `INSERT INTO ride_requests 
       (user_id, location_id, type, luggage_count)
       VALUES (?, ?, ?, ?)`,
      [req.user.user_id, location_id, type, luggage_count]
    );

    res.json({ request_id: result.insertId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//////////////////////////////////////////////////////////////
// ⏰ SCHEDULE RIDE
//////////////////////////////////////////////////////////////

app.post("/ride/schedule", authMiddleware, async (req, res) => {
  const { request_id, datetime } = req.body;

  await db.query(
    `INSERT INTO scheduled_rides (request_id, scheduled_datetime)
     VALUES (?, ?)`,
    [request_id, datetime]
  );

  res.json({ message: "Ride scheduled" });
});

//////////////////////////////////////////////////////////////
// 🔍 FIND POOLS
//////////////////////////////////////////////////////////////

app.get("/pools", authMiddleware, async (req, res) => {
  const [rows] = await db.query(`SELECT * FROM pool_summary`);
  res.json(rows);
});

app.get("/pool/:pool_id", authMiddleware, async (req, res) => {
  try {
    const { pool_id } = req.params;

    // 1. Get pool details and location
    const [pools] = await db.query(
      `SELECT rp.*, l.place_name, l.address, l.latitude, l.longitude
       FROM ride_pools rp
       JOIN locations l ON rp.location_id = l.location_id
       WHERE rp.pool_id = ?`,
      [pool_id]
    );

    if (pools.length === 0) {
      return res.status(404).json({ error: "Pool not found" });
    }

    const pool = pools[0];

    // 2. Get members
    const [members] = await db.query(
      `SELECT u.user_id, u.name, u.rating, pm.luggage_count, pm.joined_at
       FROM pool_members pm
       JOIN users u ON pm.user_id = u.user_id
       WHERE pm.pool_id = ?`,
      [pool_id]
    );

    pool.members = members;
    res.json(pool);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//////////////////////////////////////////////////////////////
// 🔍 FIND SEARCHING RIDERS
//////////////////////////////////////////////////////////////

app.get("/rides/searching", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          r.request_id,
          r.user_id,
          u.name as user_name,
          r.type,
          r.luggage_count,
          l.place_name,
          l.address,
          r.created_at
       FROM ride_requests r
       JOIN users u ON r.user_id = u.user_id
       JOIN locations l ON r.location_id = l.location_id
       WHERE r.status = 'SEARCHING'
       AND r.user_id != ?`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//////////////////////////////////////////////////////////////
// 🚗 USER RIDES
//////////////////////////////////////////////////////////////

app.get("/rides", authMiddleware, async (req, res) => {
  try {
    const [rides] = await db.query(
      `SELECT 
          r.request_id,
          r.type,
          r.luggage_count,
          r.status as request_status,
          r.created_at,
          l.place_name,
          l.address,
          l.latitude,
          l.longitude,
          sr.scheduled_datetime,
          pm.pool_id,
          p.status as pool_status
       FROM ride_requests r
       LEFT JOIN locations l ON r.location_id = l.location_id
       LEFT JOIN scheduled_rides sr ON r.request_id = sr.request_id
       LEFT JOIN pool_members pm ON r.request_id = pm.request_id
       LEFT JOIN ride_pools p ON pm.pool_id = p.pool_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.user_id]
    );

    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//////////////////////////////////////////////////////////////
// 👥 CO-PASSENGERS
//////////////////////////////////////////////////////////////

app.get("/ride/:request_id/passengers", authMiddleware, async (req, res) => {
  try {
    const { request_id } = req.params;

    const [passengers] = await db.query(
      `SELECT 
          u.user_id,
          u.name,
          u.rating,
          l.place_name as destination_name,
          l.address as destination_address,
          pm.luggage_count
       FROM pool_members pm
       JOIN users u ON pm.user_id = u.user_id
       JOIN ride_requests rr ON pm.request_id = rr.request_id
       JOIN locations l ON rr.location_id = l.location_id
       WHERE pm.pool_id = (
           SELECT pool_id FROM pool_members WHERE request_id = ?
       )
       AND pm.request_id != ?`,
      [request_id, request_id]
    );

    res.json(passengers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/ride/cancel", authMiddleware, async (req, res) => {
  const { request_id } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Get request details
    const [requests] = await conn.query(
      `SELECT * FROM ride_requests WHERE request_id = ? AND user_id = ?`,
      [request_id, req.user.user_id]
    );

    if (requests.length === 0) {
      throw new Error("Request not found or unauthorized");
    }

    const request = requests[0];

    // 2. Find pool membership
    const [members] = await conn.query(
      `SELECT * FROM pool_members WHERE request_id = ?`,
      [request_id]
    );

    if (members.length > 0) {
      const member = members[0];
      const pool_id = member.pool_id;

      // 3. Restore pool capacity
      await conn.query(
        `UPDATE ride_pools
         SET 
           remaining_seats = remaining_seats + 1,
           remaining_suitcases = remaining_suitcases + ?
         WHERE pool_id = ?`,
        [member.luggage_count, pool_id]
      );

      // 4. Remove user from pool
      await conn.query(
        `DELETE FROM pool_members WHERE request_id = ?`,
        [request_id]
      );

      // 5. Check if pool is empty
      const [remainingMembers] = await conn.query(
        `SELECT COUNT(*) as count FROM pool_members WHERE pool_id = ?`,
        [pool_id]
      );

      if (remainingMembers[0].count === 0) {
        // delete pool if empty
        await conn.query(
          `DELETE FROM ride_pools WHERE pool_id = ?`,
          [pool_id]
        );
      }
    }

    // 6. Update request status
    await conn.query(
      `UPDATE ride_requests
       SET status = 'CANCELLED'
       WHERE request_id = ?`,
      [request_id]
    );

    await conn.commit();

    res.json({ message: "Matching cancelled successfully" });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

//////////////////////////////////////////////////////////////
// 🚘 CREATE CAB POOL (Manual)
//////////////////////////////////////////////////////////////

app.post("/pool/create", async (req, res) => {
  const { location_id } = req.body;

  const [result] = await db.query(
    `INSERT INTO ride_pools (location_id)
     VALUES (?)`,
    [location_id]
  );

  res.json({ pool_id: result.insertId });
});

//////////////////////////////////////////////////////////////
// 👥 JOIN POOL
//////////////////////////////////////////////////////////////

app.post("/pool/join", authMiddleware, async (req, res) => {
  const { pool_id, request_id, luggage_count } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.query(
      `INSERT INTO pool_members 
       (pool_id, user_id, request_id, luggage_count)
       VALUES (?, ?, ?, ?)`,
      [pool_id, req.user.user_id, request_id, luggage_count]
    );

    await conn.query(
      `UPDATE ride_requests
       SET status = 'MATCHED'
       WHERE request_id = ?`,
      [request_id]
    );

    await conn.commit();
    res.json({ message: "Joined pool" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

//////////////////////////////////////////////////////////////
// 🪄 MAGIC JOIN (One-Click Matching)
//////////////////////////////////////////////////////////////

app.post("/ride/:partner_request_id/join", authMiddleware, async (req, res) => {
  const { partner_request_id } = req.params;
  const my_user_id = req.user.user_id;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Get the partner's request details
    const [partnerRequests] = await conn.query(
      `SELECT * FROM ride_requests WHERE request_id = ?`,
      [partner_request_id]
    );

    if (partnerRequests.length === 0) throw new Error("Partner request not found");
    const partnerRequest = partnerRequests[0];

    // 2. Get the current user's latest 'SEARCHING' request
    let [myRequests] = await conn.query(
      `SELECT * FROM ride_requests WHERE user_id = ? AND status = 'SEARCHING' ORDER BY created_at DESC LIMIT 1`,
      [my_user_id]
    );

    let myRequest;
    if (myRequests.length === 0) {
      // Create a request for the current user on the fly so they can be matched
      const [insertResult] = await conn.query(
        `INSERT INTO ride_requests (user_id, location_id, type, luggage_count, status)
         VALUES (?, ?, ?, 0, 'SEARCHING')`,
        [my_user_id, partnerRequest.location_id, partnerRequest.type]
      );
      
      const [newRequests] = await conn.query(`SELECT * FROM ride_requests WHERE request_id = ?`, [insertResult.insertId]);
      myRequest = newRequests[0];
    } else {
      myRequest = myRequests[0];
    }

    // 3. Create a new pool for the location
    const [poolResult] = await conn.query(
      `INSERT INTO ride_pools (location_id) VALUES (?)`,
      [partnerRequest.location_id]
    );
    const pool_id = poolResult.insertId;

    // 4. Add BOTH users to the pool
    await conn.query(
      `INSERT INTO pool_members (pool_id, user_id, request_id, luggage_count) VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
      [
        pool_id, partnerRequest.user_id, partnerRequest.request_id, partnerRequest.luggage_count,
        pool_id, my_user_id, myRequest.request_id, myRequest.luggage_count
      ]
    );

    // 5. Mark both requests as MATCHED
    await conn.query(
      `UPDATE ride_requests SET status = 'MATCHED' WHERE request_id IN (?, ?)`,
      [partner_request_id, myRequest.request_id]
    );

    await conn.commit();
    res.json({ message: "Successfully matched!", pool_id });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

//////////////////////////////////////////////////////////////
// 💬 CHAT
//////////////////////////////////////////////////////////////

app.post("/chat/send", authMiddleware, async (req, res) => {
  const { pool_id, message } = req.body;

  await db.query(
    `INSERT INTO messages (pool_id, sender_id, message)
     VALUES (?, ?, ?)`,
    [pool_id, req.user.user_id, message]
  );

  res.json({ message: "Sent" });
});

app.get("/chat/:pool_id", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT m.*, u.name 
     FROM messages m
     JOIN users u ON m.sender_id = u.user_id
     WHERE pool_id = ?
     ORDER BY created_at ASC`,
    [req.params.pool_id]
  );

  res.json(rows);
});

//////////////////////////////////////////////////////////////
// 👤 USER PROFILE
//////////////////////////////////////////////////////////////

app.get("/me", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT user_id, name, email, rating, rides_count
     FROM users WHERE user_id = ?`,
    [req.user.user_id]
  );

  res.json(rows[0]);
});

//////////////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////////////

app.listen(4000, () => {
  console.log("🚀 RideHive server running on port 4000");
});