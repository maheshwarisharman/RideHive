package com.example.ridehive.ui.pool;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.ApiClient;
import com.example.ridehive.network.models.CancelRideRequest;
import com.example.ridehive.network.models.MessageResponse;
import com.example.ridehive.network.models.PoolDetails;
import com.example.ridehive.network.models.RideRequestItem;
import com.example.ridehive.ui.home.HomeActivity;
import com.example.ridehive.util.UiUtil;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class FindingPoolActivity extends AppCompatActivity implements OnMapReadyCallback {

    public static final String EXTRA_DESTINATION = "extra_destination";
    public static final String EXTRA_LUGGAGE_COUNT = "extra_luggage_count";
    public static final String EXTRA_DEST_LAT = "extra_dest_lat";
    public static final String EXTRA_DEST_LNG = "extra_dest_lng";
    public static final String EXTRA_REQUEST_ID = "extra_request_id";
    public static final String EXTRA_POOL_ID = "extra_pool_id";

    private GoogleMap googleMap;
    private Marker destinationMarker;
    private LatLng pendingLatLng;
    private String pendingLabel;

    private PoolMembersAdapter poolMembersAdapter;
    private int requestId;
    private int luggageCount;
    private ProgressBar progressBar;
    private TextView percentView;
    private TextView matchedCountView;
    private TextView waitTimeView;
    private TextView destinationView;
    private int currentPoolId = -1;
    private MaterialButton startRideButton;
    private final Handler refreshHandler = new Handler(Looper.getMainLooper());
    private final Runnable refreshRunnable = new Runnable() {
        @Override
        public void run() {
            if (currentPoolId > 0) {
                loadCurrentPoolDetails(currentPoolId);
            } else {
                pollForPoolId();
            }
            refreshHandler.postDelayed(this, 8000);
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_finding_pool);

        ImageView back = findViewById(R.id.iv_back);
        ImageView more = findViewById(R.id.iv_more);
        destinationView = findViewById(R.id.tv_destination_value);
        matchedCountView = findViewById(R.id.tv_matched_count);
        progressBar = findViewById(R.id.progress);
        percentView = findViewById(R.id.tv_percent);
        waitTimeView = findViewById(R.id.tv_wait_time);
        RecyclerView list = findViewById(R.id.rv_matched_partners);
        startRideButton = findViewById(R.id.btn_start_ride);
        ImageView zoomIn = findViewById(R.id.btn_zoom_in);
        ImageView zoomOut = findViewById(R.id.btn_zoom_out);

        String dest = getIntent() != null ? getIntent().getStringExtra(EXTRA_DESTINATION) : "";
        luggageCount = getIntent() != null ? getIntent().getIntExtra(EXTRA_LUGGAGE_COUNT, 0) : 0;
        double lat = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LAT, Double.NaN) : Double.NaN;
        double lng = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LNG, Double.NaN) : Double.NaN;
        requestId = getIntent() != null ? getIntent().getIntExtra(EXTRA_REQUEST_ID, 0) : 0;
        int poolIdFromJoin = getIntent() != null ? getIntent().getIntExtra(EXTRA_POOL_ID, -1) : -1;

        destinationView.setText(dest == null ? "" : dest);
        if (poolIdFromJoin > 0 && (dest == null || dest.trim().isEmpty())) {
            destinationView.setText("Loading...");
        }

        if (!Double.isNaN(lat) && !Double.isNaN(lng)) {
            pendingLatLng = new LatLng(lat, lng);
            pendingLabel = dest;
        }

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.finding_map_fragment);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }

        list.setLayoutManager(new LinearLayoutManager(this));
        poolMembersAdapter = new PoolMembersAdapter();
        list.setAdapter(poolMembersAdapter);

        matchedCountView.setText("Loading...");
        updateMatchingProgress(0);
        if (poolIdFromJoin > 0) {
            currentPoolId = poolIdFromJoin;
            loadCurrentPoolDetails(poolIdFromJoin);
        } else {
            pollForPoolId();
        }

        startRideButton.setEnabled(currentPoolId > 0);
        startRideButton.setOnClickListener(v -> {
            if (currentPoolId <= 0) {
                Toast.makeText(FindingPoolActivity.this, "Waiting for a partner to join...", Toast.LENGTH_SHORT).show();
                return;
            }
            startRideButton.setEnabled(false);
            ApiClient.api(this).startPool(currentPoolId).enqueue(new retrofit2.Callback<MessageResponse>() {
                @Override
                public void onResponse(retrofit2.Call<MessageResponse> call, retrofit2.Response<MessageResponse> response) {
                    startRideButton.setEnabled(true);
                    if (response.isSuccessful()) {
                        Toast.makeText(FindingPoolActivity.this, "Ride started!", Toast.LENGTH_LONG).show();
                        // Navigate to a "Ride In Progress" screen or just stay here with a "Started" state
                        startRideButton.setText("RIDE IN PROGRESS");
                        startRideButton.setEnabled(false);
                    } else {
                        Toast.makeText(FindingPoolActivity.this, com.example.ridehive.util.UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(retrofit2.Call<MessageResponse> call, Throwable t) {
                    startRideButton.setEnabled(true);
                    Toast.makeText(FindingPoolActivity.this, "Connection error", Toast.LENGTH_SHORT).show();
                }
            });
        });

        back.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        more.setOnClickListener(v -> performCancelMatching());

        zoomIn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (googleMap != null) googleMap.animateCamera(CameraUpdateFactory.zoomIn());
            }
        });
        zoomOut.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (googleMap != null) googleMap.animateCamera(CameraUpdateFactory.zoomOut());
            }
        });

        // Cab capacity: 4 people, 3 suitcases (enforced server-side later).
    }

    @Override
    protected void onStart() {
        super.onStart();
        refreshHandler.postDelayed(refreshRunnable, 8000);
    }

    @Override
    protected void onStop() {
        refreshHandler.removeCallbacks(refreshRunnable);
        super.onStop();
    }

    @Override
    public void onMapReady(@NonNull GoogleMap map) {
        googleMap = map;
        googleMap.getUiSettings().setMapToolbarEnabled(false);
        googleMap.getUiSettings().setZoomControlsEnabled(false);
        googleMap.getUiSettings().setMyLocationButtonEnabled(false);
        googleMap.setMapType(GoogleMap.MAP_TYPE_NORMAL);

        LatLng bmu = new LatLng(28.2469, 76.8142);
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(bmu, 12.5f));

        if (pendingLatLng != null) {
            showDestinationOnMap(pendingLatLng, pendingLabel);
            pendingLatLng = null;
            pendingLabel = null;
        }
    }

    private void showDestinationOnMap(@NonNull LatLng latLng, String label) {
        if (googleMap == null) return;
        if (destinationMarker != null) destinationMarker.remove();
        destinationMarker = googleMap.addMarker(new MarkerOptions().position(latLng).title(label));
        googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 14.5f));
    }

    private void pollForPoolId() {
        if (requestId <= 0) {
            matchedCountView.setText("Waiting...");
            waitTimeView.setText("Waiting for partner to join...");
            return;
        }
        ApiClient.api(this)
                .rides()
                .enqueue(new retrofit2.Callback<List<RideRequestItem>>() {
                    @Override
                    public void onResponse(retrofit2.Call<List<RideRequestItem>> call, retrofit2.Response<List<RideRequestItem>> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            return;
                        }
                        for (RideRequestItem item : response.body()) {
                            if (item.request_id == requestId && item.pool_id != null && item.pool_id > 0) {
                                currentPoolId = item.pool_id;
                                loadCurrentPoolDetails(currentPoolId);
                                return;
                            }
                        }
                        matchedCountView.setText("Waiting...");
                        waitTimeView.setText("Waiting for partner to join...");
                    }

                    @Override
                    public void onFailure(retrofit2.Call<List<RideRequestItem>> call, Throwable t) {
                        // ignore; next poll will retry
                    }
                });
    }

    private void loadCurrentPoolDetails(int poolId) {
        ApiClient.api(this)
                .poolDetails(poolId)
                .enqueue(new retrofit2.Callback<PoolDetails>() {
                    @Override
                    public void onResponse(retrofit2.Call<PoolDetails> call, retrofit2.Response<PoolDetails> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            matchedCountView.setText("Pool unavailable");
                            Toast.makeText(FindingPoolActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                            return;
                        }
                        bindCurrentPool(response.body());
                    }

                    @Override
                    public void onFailure(retrofit2.Call<PoolDetails> call, Throwable t) {
                        matchedCountView.setText("Pool unavailable");
                        Toast.makeText(FindingPoolActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void bindCurrentPool(@NonNull PoolDetails details) {
        poolMembersAdapter.setItems(details.members == null ? new ArrayList<>() : details.members);

        // DO NOT overwrite destinationView with pool-wide location. 
        // Keep the one from the Intent which represents the user's personal choice.

        if (googleMap != null) {
            googleMap.clear(); // Clear old markers

            // Show MY destination on the map (passed via intent)
            double myLat = getIntent().getDoubleExtra(EXTRA_DEST_LAT, Double.NaN);
            double myLng = getIntent().getDoubleExtra(EXTRA_DEST_LNG, Double.NaN);
            String myDestName = getIntent().getStringExtra(EXTRA_DESTINATION);

            if (!Double.isNaN(myLat) && !Double.isNaN(myLng)) {
                LatLng myDest = new LatLng(myLat, myLng);
                googleMap.addMarker(new MarkerOptions()
                        .position(myDest)
                        .title("My Destination")
                        .snippet(myDestName));
                
                googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(myDest, 14.5f));
            }
        }

        int totalMembers = details.members == null ? 0 : details.members.size();
        matchedCountView.setText(totalMembers + " In Cab");
        
        if (details.scheduled_time != null && !details.scheduled_time.isEmpty()) {
            waitTimeView.setText(formatScheduledTime(details.scheduled_time));
            // For scheduled rides, progress is fixed to indicate it's a future ride
            progressBar.setProgress(100);
            percentView.setText("READY");
        } else {
            updateMatchingProgress(totalMembers, details.capacity_people);
        }
        
        startRideButton.setEnabled(true);
    }

    private String formatScheduledTime(String raw) {
        if (raw == null || raw.isEmpty()) return "";
        try {
            // raw format: "YYYY-MM-DD HH:MM:SS"
            String[] parts = raw.split(" ");
            if (parts.length >= 2) {
                String date = parts[0];
                String time = parts[1].substring(0, 5); // Just HH:mm
                return "Scheduled for: " + date + " @ " + time;
            }
            return "Scheduled for: " + raw;
        } catch (Exception e) {
            return "Scheduled Ride";
        }
    }

    private void updateMatchingProgress(int matchedUsers) {
        int clampedUsers = Math.max(matchedUsers, 0);
        int percent = Math.min(100, clampedUsers * 25);
        progressBar.setProgress(percent);
        percentView.setText(String.format(Locale.getDefault(), "%d%%", percent));

        int estimatedMinutes = Math.max(1, 8 - (percent / 15));
        if (percent >= 100) {
            waitTimeView.setText("Matched. Finalizing pool...");
        } else {
            waitTimeView.setText(String.format(Locale.getDefault(), "Estimated wait time: ~%d mins", estimatedMinutes));
        }
    }

    private void updateMatchingProgress(int members, int capacityPeople) {
        int safeCapacity = Math.max(capacityPeople, 1);
        int safeMembers = Math.max(members, 0);
        int percent = Math.min(100, (safeMembers * 100) / safeCapacity);
        progressBar.setProgress(percent);
        percentView.setText(String.format(Locale.getDefault(), "%d%%", percent));

        if (percent >= 100) {
            waitTimeView.setText("Pool is full");
        } else {
            int remaining = Math.max(0, safeCapacity - safeMembers);
            waitTimeView.setText(String.format(Locale.getDefault(), "Waiting for %d more rider(s)", remaining));
        }
    }

    private void performCancelMatching() {
        if (requestId <= 0) {
            resetPoolUiState();
            navigateHome();
            return;
        }
        ApiClient.api(this)
                .cancelRide(new CancelRideRequest(requestId))
                .enqueue(new retrofit2.Callback<MessageResponse>() {
                    @Override
                    public void onResponse(retrofit2.Call<MessageResponse> call,
                                           retrofit2.Response<MessageResponse> response) {
                        if (!response.isSuccessful()) {
                            Toast.makeText(FindingPoolActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                            return;
                        }
                        resetPoolUiState();
                        navigateHome();
                    }

                    @Override
                    public void onFailure(retrofit2.Call<MessageResponse> call, Throwable t) {
                        Toast.makeText(FindingPoolActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void resetPoolUiState() {
        refreshHandler.removeCallbacks(refreshRunnable);
        currentPoolId = -1;
        if (poolMembersAdapter != null) poolMembersAdapter.setItems(new ArrayList<>());
        if (progressBar != null) progressBar.setProgress(0);
        if (percentView != null) percentView.setText("0%");
        if (matchedCountView != null) matchedCountView.setText("0 Available");
        if (waitTimeView != null) waitTimeView.setText("Matching stopped");
        if (startRideButton != null) startRideButton.setEnabled(false);
    }

    private static double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) return Double.NaN;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return Double.NaN;
        }
    }

    private void navigateHome() {
        Toast.makeText(this, "Matching cancelled", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(this, HomeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}

