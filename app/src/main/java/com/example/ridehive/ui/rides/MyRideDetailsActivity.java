package com.example.ridehive.ui.rides;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.ApiClient;
import com.example.ridehive.network.models.PoolSummary;
import com.example.ridehive.network.models.RidePassenger;
import com.example.ridehive.network.models.RideRequestItem;
import com.example.ridehive.util.UiUtil;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MyRideDetailsActivity extends AppCompatActivity {
    private RidePassengersAdapter passengersAdapter;
    private TextView passengersState;


    private static final String EXTRA_REQUEST_ID = "extra_request_id";
    private static final String EXTRA_TYPE = "extra_type";
    private static final String EXTRA_LUGGAGE = "extra_luggage";
    private static final String EXTRA_REQUEST_STATUS = "extra_request_status";
    private static final String EXTRA_CREATED_AT = "extra_created_at";
    private static final String EXTRA_PLACE = "extra_place";
    private static final String EXTRA_ADDRESS = "extra_address";
    private static final String EXTRA_LAT = "extra_lat";
    private static final String EXTRA_LNG = "extra_lng";
    private static final String EXTRA_SCHEDULED = "extra_scheduled";
    private static final String EXTRA_POOL_ID = "extra_pool_id";
    private static final String EXTRA_POOL_STATUS = "extra_pool_status";

    public static Intent newIntent(@NonNull Context context, @NonNull RideRequestItem ride) {
        Intent intent = new Intent(context, MyRideDetailsActivity.class);
        intent.putExtra(EXTRA_REQUEST_ID, ride.request_id);
        intent.putExtra(EXTRA_TYPE, ride.type);
        intent.putExtra(EXTRA_LUGGAGE, ride.luggage_count);
        intent.putExtra(EXTRA_REQUEST_STATUS, ride.request_status);
        intent.putExtra(EXTRA_CREATED_AT, ride.created_at);
        intent.putExtra(EXTRA_PLACE, ride.place_name);
        intent.putExtra(EXTRA_ADDRESS, ride.address);
        intent.putExtra(EXTRA_LAT, ride.latitude);
        intent.putExtra(EXTRA_LNG, ride.longitude);
        intent.putExtra(EXTRA_SCHEDULED, ride.scheduled_datetime);
        intent.putExtra(EXTRA_POOL_ID, ride.pool_id == null ? -1 : ride.pool_id);
        intent.putExtra(EXTRA_POOL_STATUS, ride.pool_status);
        return intent;
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_my_ride_details);

        ImageView back = findViewById(R.id.iv_back);
        TextView requestId = findViewById(R.id.tv_request_id);
        TextView place = findViewById(R.id.tv_place);
        TextView address = findViewById(R.id.tv_address);
        TextView status = findViewById(R.id.tv_status);
        TextView type = findViewById(R.id.tv_type);
        TextView luggage = findViewById(R.id.tv_luggage);
        TextView created = findViewById(R.id.tv_created);
        TextView scheduled = findViewById(R.id.tv_scheduled);
        TextView coordinates = findViewById(R.id.tv_coordinates);
        TextView poolId = findViewById(R.id.tv_pool_id);
        TextView poolStatus = findViewById(R.id.tv_pool_status);
        TextView cabMembers = findViewById(R.id.tv_cab_members);
        TextView cabSeats = findViewById(R.id.tv_cab_seats);
        TextView cabLuggage = findViewById(R.id.tv_cab_luggage);
        RecyclerView passengersList = findViewById(R.id.rv_passengers);
        passengersState = findViewById(R.id.tv_passengers_state);

        passengersList.setLayoutManager(new LinearLayoutManager(this));
        passengersAdapter = new RidePassengersAdapter();
        passengersList.setAdapter(passengersAdapter);

        back.setOnClickListener(v -> finish());

        Intent intent = getIntent();
        int reqId = intent.getIntExtra(EXTRA_REQUEST_ID, 0);
        int luggageCount = intent.getIntExtra(EXTRA_LUGGAGE, 0);
        int pool = intent.getIntExtra(EXTRA_POOL_ID, -1);

        requestId.setText("#" + reqId);
        place.setText(nonNull(intent.getStringExtra(EXTRA_PLACE), "--"));
        address.setText(nonNull(intent.getStringExtra(EXTRA_ADDRESS), "--"));
        status.setText(nonNull(intent.getStringExtra(EXTRA_REQUEST_STATUS), "--"));
        type.setText(nonNull(intent.getStringExtra(EXTRA_TYPE), "--"));
        luggage.setText(String.valueOf(Math.max(0, luggageCount)));
        created.setText(formatIso(intent.getStringExtra(EXTRA_CREATED_AT)));
        scheduled.setText(formatIso(intent.getStringExtra(EXTRA_SCHEDULED)));

        String lat = nonNull(intent.getStringExtra(EXTRA_LAT), "");
        String lng = nonNull(intent.getStringExtra(EXTRA_LNG), "");
        coordinates.setText((lat.isEmpty() || lng.isEmpty()) ? "--" : (lat + ", " + lng));

        if (pool > 0) {
            poolId.setText(String.valueOf(pool));
            poolStatus.setText(nonNull(intent.getStringExtra(EXTRA_POOL_STATUS), "--"));
            loadPoolContext(pool, cabMembers, cabSeats, cabLuggage);
        } else {
            poolId.setText("--");
            poolStatus.setText(nonNull(intent.getStringExtra(EXTRA_POOL_STATUS), "Not assigned"));
            cabMembers.setText("Waiting for match");
            cabSeats.setText("--");
            cabLuggage.setText("--");
        }

        loadPassengers(reqId);
    }

    private void loadPoolContext(
            int poolId,
            @NonNull TextView cabMembers,
            @NonNull TextView cabSeats,
            @NonNull TextView cabLuggage
    ) {
        ApiClient.api(this).pools().enqueue(new Callback<List<PoolSummary>>() {
            @Override
            public void onResponse(@NonNull Call<List<PoolSummary>> call, @NonNull Response<List<PoolSummary>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    cabMembers.setText("Unavailable");
                    cabSeats.setText("Unavailable");
                    cabLuggage.setText("Unavailable");
                    return;
                }

                PoolSummary matchedPool = null;
                for (PoolSummary item : response.body()) {
                    if (item.pool_id == poolId) {
                        matchedPool = item;
                        break;
                    }
                }

                if (matchedPool == null) {
                    cabMembers.setText("Pool info unavailable");
                    cabSeats.setText("Pool info unavailable");
                    cabLuggage.setText("Pool info unavailable");
                    return;
                }

                int members = Math.max(0, matchedPool.total_members);
                int others = Math.max(0, members - 1);
                cabMembers.setText(members + " total (" + others + " other riders)");
                cabSeats.setText(String.valueOf(Math.max(0, matchedPool.remaining_seats)));
                cabLuggage.setText(String.valueOf(Math.max(0, matchedPool.remaining_suitcases)));
            }

            @Override
            public void onFailure(@NonNull Call<List<PoolSummary>> call, @NonNull Throwable t) {
                cabMembers.setText("Unavailable");
                cabSeats.setText("Unavailable");
                cabLuggage.setText("Unavailable");
                Toast.makeText(MyRideDetailsActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loadPassengers(int requestId) {
        if (requestId <= 0) {
            passengersState.setText("Passenger info unavailable");
            return;
        }
        passengersState.setText("Loading passengers...");
        ApiClient.api(this).ridePassengers(requestId).enqueue(new Callback<List<RidePassenger>>() {
            @Override
            public void onResponse(@NonNull Call<List<RidePassenger>> call, @NonNull Response<List<RidePassenger>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    passengersState.setText("Failed to load passengers");
                    return;
                }
                List<RidePassenger> passengers = response.body();
                passengersAdapter.setItems(passengers);
                if (passengers.isEmpty()) {
                    passengersState.setText("No co-passengers yet");
                } else {
                    passengersState.setText(passengers.size() + " co-passenger(s)");
                }
            }

            @Override
            public void onFailure(@NonNull Call<List<RidePassenger>> call, @NonNull Throwable t) {
                passengersState.setText("Failed to load passengers");
                Toast.makeText(MyRideDetailsActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @NonNull
    private static String nonNull(@Nullable String value, @NonNull String fallback) {
        if (value == null) return fallback;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    @NonNull
    private static String formatIso(@Nullable String iso) {
        if (iso == null || iso.trim().isEmpty()) return "--";
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US);
            parser.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date parsed = parser.parse(iso);
            if (parsed == null) return iso;
            SimpleDateFormat output = new SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault());
            output.setTimeZone(TimeZone.getDefault());
            return output.format(parsed);
        } catch (Exception ignored) {
            return iso;
        }
    }
}
