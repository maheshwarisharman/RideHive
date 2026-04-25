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

    private GoogleMap googleMap;
    private Marker destinationMarker;
    private LatLng pendingLatLng;
    private String pendingLabel;

    private PoolsAdapter poolsAdapter;
    private int requestId;
    private int luggageCount;
    private ProgressBar progressBar;
    private TextView percentView;
    private TextView matchedCountView;
    private TextView waitTimeView;
    private final Handler refreshHandler = new Handler(Looper.getMainLooper());
    private final Runnable refreshRunnable = new Runnable() {
        @Override
        public void run() {
            loadPools();
            refreshHandler.postDelayed(this, 8000);
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_finding_pool);

        ImageView back = findViewById(R.id.iv_back);
        ImageView more = findViewById(R.id.iv_more);
        TextView destination = findViewById(R.id.tv_destination_value);
        matchedCountView = findViewById(R.id.tv_matched_count);
        progressBar = findViewById(R.id.progress);
        percentView = findViewById(R.id.tv_percent);
        waitTimeView = findViewById(R.id.tv_wait_time);
        RecyclerView list = findViewById(R.id.rv_matched_partners);
        MaterialButton cancel = findViewById(R.id.btn_cancel_matching);
        ImageView zoomIn = findViewById(R.id.btn_zoom_in);
        ImageView zoomOut = findViewById(R.id.btn_zoom_out);

        String dest = getIntent() != null ? getIntent().getStringExtra(EXTRA_DESTINATION) : "";
        luggageCount = getIntent() != null ? getIntent().getIntExtra(EXTRA_LUGGAGE_COUNT, 0) : 0;
        double lat = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LAT, Double.NaN) : Double.NaN;
        double lng = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LNG, Double.NaN) : Double.NaN;
        requestId = getIntent() != null ? getIntent().getIntExtra(EXTRA_REQUEST_ID, 0) : 0;

        destination.setText(dest == null ? "" : dest);

        if (!Double.isNaN(lat) && !Double.isNaN(lng)) {
            pendingLatLng = new LatLng(lat, lng);
            pendingLabel = dest;
        }

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.finding_map_fragment);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }

        list.setLayoutManager(new LinearLayoutManager(this));
        poolsAdapter = new PoolsAdapter(new PoolsAdapter.Listener() {
            @Override
            public void onJoinClicked(int poolId) {
                joinPool(poolId);
            }
        });
        list.setAdapter(poolsAdapter);
        matchedCountView.setText("Loading...");
        updateMatchingProgress(0);
        loadPools();

        back.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        more.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(FindingPoolActivity.this, "Coming soon", Toast.LENGTH_SHORT).show();
            }
        });
        cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                performCancelMatching();
            }
        });

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

    private void loadPools() {
        com.example.ridehive.network.ApiClient.api(this)
                .pools()
                .enqueue(new retrofit2.Callback<java.util.List<com.example.ridehive.network.models.PoolSummary>>() {
                    @Override
                    public void onResponse(retrofit2.Call<java.util.List<com.example.ridehive.network.models.PoolSummary>> call,
                                           retrofit2.Response<java.util.List<com.example.ridehive.network.models.PoolSummary>> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            matchedCountView.setText("Failed");
                            android.widget.Toast.makeText(FindingPoolActivity.this,
                                    com.example.ridehive.util.UiUtil.errorMessage(response),
                                    android.widget.Toast.LENGTH_SHORT).show();
                            return;
                        }
                        java.util.List<com.example.ridehive.network.models.PoolSummary> pools = response.body();
                        poolsAdapter.setItems(pools);
                        matchedCountView.setText(pools.size() + " Available");
                        updateMatchingProgress(pools);
                    }

                    @Override
                    public void onFailure(retrofit2.Call<java.util.List<com.example.ridehive.network.models.PoolSummary>> call, Throwable t) {
                        matchedCountView.setText("Failed");
                        updateMatchingProgress(0);
                        android.widget.Toast.makeText(FindingPoolActivity.this,
                                com.example.ridehive.util.UiUtil.errorMessage(t),
                                android.widget.Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void updateMatchingProgress(@NonNull List<com.example.ridehive.network.models.PoolSummary> pools) {
        int totalMatchedUsers = 0;
        for (com.example.ridehive.network.models.PoolSummary pool : pools) {
            totalMatchedUsers += Math.max(pool.total_members, 0);
        }
        updateMatchingProgress(totalMatchedUsers);
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

    private void joinPool(int poolId) {
        if (requestId <= 0) {
            android.widget.Toast.makeText(this, "Missing request id. Try again.", android.widget.Toast.LENGTH_SHORT).show();
            return;
        }
        com.example.ridehive.network.ApiClient.api(this)
                .joinPool(new com.example.ridehive.network.models.JoinPoolRequest(poolId, requestId, luggageCount))
                .enqueue(new retrofit2.Callback<com.example.ridehive.network.models.MessageResponse>() {
                    @Override
                    public void onResponse(retrofit2.Call<com.example.ridehive.network.models.MessageResponse> call,
                                           retrofit2.Response<com.example.ridehive.network.models.MessageResponse> response) {
                        if (!response.isSuccessful()) {
                            android.widget.Toast.makeText(FindingPoolActivity.this,
                                    com.example.ridehive.util.UiUtil.errorMessage(response),
                                    android.widget.Toast.LENGTH_SHORT).show();
                            return;
                        }
                        android.widget.Toast.makeText(FindingPoolActivity.this, "Joined pool", android.widget.Toast.LENGTH_SHORT).show();
                    }

                    @Override
                    public void onFailure(retrofit2.Call<com.example.ridehive.network.models.MessageResponse> call, Throwable t) {
                        android.widget.Toast.makeText(FindingPoolActivity.this,
                                com.example.ridehive.util.UiUtil.errorMessage(t),
                                android.widget.Toast.LENGTH_SHORT).show();
                    }
                });
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
        if (poolsAdapter != null) poolsAdapter.clear();
        if (progressBar != null) progressBar.setProgress(0);
        if (percentView != null) percentView.setText("0%");
        if (matchedCountView != null) matchedCountView.setText("0 Available");
        if (waitTimeView != null) waitTimeView.setText("Matching stopped");
    }

    private void navigateHome() {
        Toast.makeText(this, "Matching cancelled", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(this, HomeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}

