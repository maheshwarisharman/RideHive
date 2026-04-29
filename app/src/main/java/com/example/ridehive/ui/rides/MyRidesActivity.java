package com.example.ridehive.ui.rides;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
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
import com.example.ridehive.network.models.RideRequestItem;
import com.example.ridehive.ui.home.HomeActivity;
import com.example.ridehive.util.UiUtil;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MyRidesActivity extends AppCompatActivity {

    private RidesAdapter activeAdapter;
    private RidesAdapter completedAdapter;
    private TextView emptyText;
    private TextView activeTitle;
    private TextView completedTitle;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_my_rides);

        ImageView back = findViewById(R.id.iv_back);
        RecyclerView activeList = findViewById(R.id.rv_active_rides);
        RecyclerView completedList = findViewById(R.id.rv_completed_rides);
        emptyText = findViewById(R.id.tv_empty);
        activeTitle = findViewById(R.id.tv_active_title);
        completedTitle = findViewById(R.id.tv_completed_title);
        BottomNavigationView bottomNav = findViewById(R.id.bottom_nav);

        activeList.setLayoutManager(new LinearLayoutManager(this));
        completedList.setLayoutManager(new LinearLayoutManager(this));

        activeAdapter = new RidesAdapter(new RidesAdapter.Listener() {
            @Override
            public void onRideClicked(@NonNull RideRequestItem ride) {
                startActivity(MyRideDetailsActivity.newIntent(MyRidesActivity.this, ride));
            }
        });
        completedAdapter = new RidesAdapter(new RidesAdapter.Listener() {
            @Override
            public void onRideClicked(@NonNull RideRequestItem ride) {
                startActivity(MyRideDetailsActivity.newIntent(MyRidesActivity.this, ride));
            }
        });
        activeList.setAdapter(activeAdapter);
        completedList.setAdapter(completedAdapter);

        back.setOnClickListener(v -> finish());

        bottomNav.setSelectedItemId(R.id.nav_rides);
        bottomNav.setOnItemSelectedListener(new BottomNavigationView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                int id = item.getItemId();
                if (id == R.id.nav_rides) return true;
                if (id == R.id.nav_home) {
                    startActivity(new Intent(MyRidesActivity.this, HomeActivity.class));
                    finish();
                    return true;
                }
                Toast.makeText(MyRidesActivity.this, "Coming soon", Toast.LENGTH_SHORT).show();
                return true;
            }
        });

        showLoadingState();
        loadRides();
    }

    private void showLoadingState() {
        emptyText.setVisibility(View.VISIBLE);
        emptyText.setText("Loading rides...");
    }

    private void loadRides() {
        ApiClient.api(this).rides().enqueue(new Callback<List<RideRequestItem>>() {
            @Override
            public void onResponse(@NonNull Call<List<RideRequestItem>> call, @NonNull Response<List<RideRequestItem>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    emptyText.setVisibility(View.VISIBLE);
                    emptyText.setText("Failed to load rides");
                    Toast.makeText(MyRidesActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                    return;
                }
                renderRides(response.body());
            }

            @Override
            public void onFailure(@NonNull Call<List<RideRequestItem>> call, @NonNull Throwable t) {
                emptyText.setVisibility(View.VISIBLE);
                emptyText.setText("Failed to load rides");
                Toast.makeText(MyRidesActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void renderRides(@NonNull List<RideRequestItem> rides) {
        List<RideRequestItem> activeAndUpcoming = new ArrayList<>();
        List<RideRequestItem> completed = new ArrayList<>();

        for (RideRequestItem ride : rides) {
            if ("COMPLETED".equalsIgnoreCase(safe(ride.pool_status))) {
                completed.add(ride);
            } else {
                activeAndUpcoming.add(ride);
            }
        }

        activeAdapter.setItems(activeAndUpcoming);
        completedAdapter.setItems(completed);

        activeTitle.setVisibility(activeAndUpcoming.isEmpty() ? View.GONE : View.VISIBLE);
        completedTitle.setVisibility(completed.isEmpty() ? View.GONE : View.VISIBLE);

        if (activeAndUpcoming.isEmpty() && completed.isEmpty()) {
            emptyText.setVisibility(View.VISIBLE);
            emptyText.setText("No rides yet");
        } else {
            emptyText.setVisibility(View.GONE);
        }
    }

    @NonNull
    private static String safe(@Nullable String value) {
        return value == null ? "" : value;
    }
}
