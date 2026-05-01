package com.example.ridehive.ui.home;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.ApiClient;
import com.example.ridehive.network.models.CreateLocationRequest;
import com.example.ridehive.network.models.CreateLocationResponse;
import com.example.ridehive.network.models.CreateRideRequestRequest;
import com.example.ridehive.network.models.CreateRideRequestResponse;
import com.example.ridehive.network.models.JoinPartnerRideResponse;
import com.example.ridehive.network.models.SearchingRide;
import com.example.ridehive.ui.pool.LuggageActivity;
import com.example.ridehive.ui.pool.FindingPoolActivity;
import com.example.ridehive.ui.pool.ScheduleRideActivity;
import com.example.ridehive.ui.profile.ProfileActivity;
import com.example.ridehive.ui.rides.MyRidesActivity;
import com.example.ridehive.util.UiUtil;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.libraries.places.api.Places;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.widget.Autocomplete;
import com.google.android.libraries.places.widget.AutocompleteActivity;
import com.google.android.libraries.places.widget.model.AutocompleteActivityMode;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeActivity extends AppCompatActivity implements OnMapReadyCallback {

    private EditText destinationEditText;
    private GoogleMap googleMap;
    private Marker destinationMarker;
    private LatLng pendingDestinationLatLng;
    private String pendingDestinationLabel;
    private LatLng selectedDestinationLatLng;
    private String selectedDestinationLabel;
    private String selectedDestinationAddress;
    private NearbyRidersAdapter nearbyRidersAdapter;
    private int pendingPartnerRequestId = 0;

    private final ActivityResultLauncher<Intent> luggageLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(),
                    new ActivityResultCallback<ActivityResult>() {
                        @Override
                        public void onActivityResult(ActivityResult result) {
                            if (result.getResultCode() != RESULT_OK || result.getData() == null) return;
                            String dest = result.getData().getStringExtra(LuggageActivity.RESULT_DESTINATION);
                            int luggage = result.getData().getIntExtra(LuggageActivity.RESULT_LUGGAGE_COUNT, 0);
                            double lat = result.getData().getDoubleExtra(LuggageActivity.RESULT_DEST_LAT, Double.NaN);
                            double lng = result.getData().getDoubleExtra(LuggageActivity.RESULT_DEST_LNG, Double.NaN);
                            if (TextUtils.isEmpty(dest)) return;

                            final int partnerId = pendingPartnerRequestId;
                            pendingPartnerRequestId = 0;

                            createRideRequest(dest, selectedDestinationAddress, lat, lng, luggage, new RequestCreatedListener() {
                                @Override
                                public void onCreated(int requestId, double finalLat, double finalLng) {
                                    if (partnerId > 0) {
                                        joinPartnerRide(partnerId, requestId, dest, finalLat, finalLng, luggage);
                                    } else {
                                        openFindingPoolForRequester(requestId, dest, finalLat, finalLng, luggage);
                                    }
                                }
                            });
                        }
                    });

    private final ActivityResultLauncher<Intent> autocompleteLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(),
                    new ActivityResultCallback<ActivityResult>() {
                        @Override
                        public void onActivityResult(ActivityResult result) {
                            if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                                Place place = Autocomplete.getPlaceFromIntent(result.getData());
                                onPlaceSelected(place);
                                return;
                            }
                            if (result.getResultCode() == AutocompleteActivity.RESULT_ERROR && result.getData() != null) {
                                Toast.makeText(HomeActivity.this, "Couldn't fetch location. Try again.", Toast.LENGTH_SHORT).show();
                            }
                        }
                    });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        destinationEditText = findViewById(R.id.et_destination);
        MaterialButton poolNowButton = findViewById(R.id.btn_pool_now);
        MaterialButton scheduleLaterButton = findViewById(R.id.btn_schedule_later);
        RecyclerView ridersRecyclerView = findViewById(R.id.rv_nearby_riders);
        BottomNavigationView bottomNav = findViewById(R.id.bottom_nav);
        ImageView zoomIn = findViewById(R.id.btn_zoom_in);
        ImageView zoomOut = findViewById(R.id.btn_zoom_out);

        if (!Places.isInitialized()) {
            // Uses the same API key as Maps SDK (from @string/google_maps_key)
            Places.initialize(getApplicationContext(), getString(R.string.google_maps_key));
        }

        ridersRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        nearbyRidersAdapter = new NearbyRidersAdapter(new ArrayList<>(), new NearbyRidersAdapter.Listener() {
            @Override
            public void onJoinClicked(@NonNull NearbyRider rider) {
                String dest = destinationEditText.getText() == null ? "" : destinationEditText.getText().toString().trim();
                if (TextUtils.isEmpty(dest) || selectedDestinationLatLng == null) {
                    Toast.makeText(HomeActivity.this, "Select your destination first", Toast.LENGTH_SHORT).show();
                    return;
                }
                pendingPartnerRequestId = rider.getPoolId();
                startLuggageFlow(dest, selectedDestinationLatLng);
            }
        });
        ridersRecyclerView.setAdapter(nearbyRidersAdapter);
        loadNearbySearchingRides();

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map_fragment);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }

        destinationEditText.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openPlacesSearch();
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

        poolNowButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String dest = destinationEditText.getText() == null ? "" : destinationEditText.getText().toString().trim();
                if (TextUtils.isEmpty(dest)) {
                    Toast.makeText(HomeActivity.this, "Enter your destination to start pooling", Toast.LENGTH_SHORT).show();
                    return;
                }
                startLuggageFlow(dest, selectedDestinationLatLng);
            }
        });

        scheduleLaterButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String dest = destinationEditText.getText() == null ? "" : destinationEditText.getText().toString().trim();
                if (TextUtils.isEmpty(dest)) {
                    Toast.makeText(HomeActivity.this, "Select a destination to schedule a ride", Toast.LENGTH_SHORT).show();
                    return;
                }
                Intent intent = new Intent(HomeActivity.this, ScheduleRideActivity.class);
                intent.putExtra(ScheduleRideActivity.EXTRA_DESTINATION, dest);
                if (selectedDestinationLatLng != null) {
                    intent.putExtra(ScheduleRideActivity.EXTRA_DEST_LAT, selectedDestinationLatLng.latitude);
                    intent.putExtra(ScheduleRideActivity.EXTRA_DEST_LNG, selectedDestinationLatLng.longitude);
                }
                startActivity(intent);
            }
        });

        bottomNav.setSelectedItemId(R.id.nav_home);
        bottomNav.setOnItemSelectedListener(new BottomNavigationView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                if (item.getItemId() == R.id.nav_home) {
                    return true;
                }
                if (item.getItemId() == R.id.nav_rides) {
                    startActivity(new Intent(HomeActivity.this, MyRidesActivity.class));
                    return true;
                }
                if (item.getItemId() == R.id.nav_profile) {
                    startActivity(new Intent(HomeActivity.this, ProfileActivity.class));
                    finish();
                    return true;
                }
                Toast.makeText(HomeActivity.this, "Coming soon", Toast.LENGTH_SHORT).show();
                return true;
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadNearbySearchingRides();
    }

    @Override
    public void onMapReady(@NonNull GoogleMap map) {
        googleMap = map;
        googleMap.getUiSettings().setMapToolbarEnabled(false);
        googleMap.getUiSettings().setZoomControlsEnabled(false); // we use custom +/-
        googleMap.getUiSettings().setMyLocationButtonEnabled(false);
        googleMap.setMapType(GoogleMap.MAP_TYPE_NORMAL);

        // Default camera: BML Munjal University, Gurgaon (campus-focused)
        LatLng bmu = new LatLng(28.2469, 76.8142);
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(bmu, 14.5f));

        // If user selected a place before map finished initializing, apply it now.
        if (pendingDestinationLatLng != null) {
            showDestinationOnMap(pendingDestinationLatLng, pendingDestinationLabel);
            pendingDestinationLatLng = null;
            pendingDestinationLabel = null;
        }
    }

    private void openPlacesSearch() {
        List<Place.Field> fields = Arrays.asList(
                Place.Field.ID,
                Place.Field.NAME,
                Place.Field.ADDRESS,
                Place.Field.LAT_LNG
        );
        Intent intent = new Autocomplete.IntentBuilder(AutocompleteActivityMode.OVERLAY, fields)
                .build(this);
        autocompleteLauncher.launch(intent);
    }

    private void onPlaceSelected(@NonNull Place place) {
        String label = place.getName();
        String address = place.getAddress();
        if (TextUtils.isEmpty(label)) label = address;
        if (!TextUtils.isEmpty(label)) {
            destinationEditText.setText(label);
        }

        LatLng latLng = place.getLatLng();
        if (latLng == null) return;

        if (googleMap == null) {
            pendingDestinationLatLng = latLng;
            pendingDestinationLabel = label;
        } else {
            showDestinationOnMap(latLng, label);
        }

        selectedDestinationLatLng = latLng;
        selectedDestinationLabel = label;
        selectedDestinationAddress = address;

        // UX change: do not auto-navigate after selecting destination.
    }

    private void showDestinationOnMap(@NonNull LatLng latLng, String label) {
        if (googleMap == null) return;
        if (destinationMarker != null) destinationMarker.remove();
        destinationMarker = googleMap.addMarker(new MarkerOptions().position(latLng).title(label));
        googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 16f));
    }

    private void startLuggageFlow(@NonNull String destination) {
        startLuggageFlow(destination, null);
    }

    private void startLuggageFlow(@NonNull String destination, LatLng latLng) {
        Intent intent = new Intent(this, LuggageActivity.class);
        intent.putExtra(LuggageActivity.EXTRA_DESTINATION, destination);
        if (latLng != null) {
            intent.putExtra(LuggageActivity.EXTRA_DEST_LAT, latLng.latitude);
            intent.putExtra(LuggageActivity.EXTRA_DEST_LNG, latLng.longitude);
        }
        luggageLauncher.launch(intent);
    }

    private interface RequestCreatedListener {
        void onCreated(int requestId, double finalLat, double finalLng);
    }

    private void createRideRequest(
            @NonNull String placeName,
            String address,
            double lat,
            double lng,
            int luggageCount
            , @NonNull RequestCreatedListener listener
    ) {
        // Join-from-home flow may not have exact coordinates from Places.
        // Fallback to campus coordinates so request creation can proceed.
        if (Double.isNaN(lat) || Double.isNaN(lng)) {
            lat = 28.2469;
            lng = 76.8142;
        }
        final double finalLat = lat;
        final double finalLng = lng;

        String safeAddress = TextUtils.isEmpty(address) ? placeName : address;

        ApiClient.api(this)
                .createLocation(new CreateLocationRequest(placeName, safeAddress, finalLat, finalLng))
                .enqueue(new Callback<CreateLocationResponse>() {
                    @Override
                    public void onResponse(Call<CreateLocationResponse> call, Response<CreateLocationResponse> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            Toast.makeText(HomeActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                            return;
                        }

                        int locationId = response.body().location_id;
                        ApiClient.api(HomeActivity.this)
                                .createRideRequest(new CreateRideRequestRequest(locationId, "NOW", luggageCount))
                                .enqueue(new Callback<CreateRideRequestResponse>() {
                                    @Override
                                    public void onResponse(Call<CreateRideRequestResponse> call, Response<CreateRideRequestResponse> response) {
                                        if (!response.isSuccessful() || response.body() == null) {
                                            Toast.makeText(HomeActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                                            return;
                                        }

                                        listener.onCreated(response.body().request_id, finalLat, finalLng);
                                    }

                                    @Override
                                    public void onFailure(Call<CreateRideRequestResponse> call, Throwable t) {
                                        Toast.makeText(HomeActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                                    }
                                });
                    }

                    @Override
                    public void onFailure(Call<CreateLocationResponse> call, Throwable t) {
                        Toast.makeText(HomeActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void loadNearbySearchingRides() {
        ApiClient.api(this).searchingRides().enqueue(new Callback<List<SearchingRide>>() {
            @Override
            public void onResponse(Call<List<SearchingRide>> call, Response<List<SearchingRide>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    Toast.makeText(HomeActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                    return;
                }
                List<NearbyRider> mapped = new ArrayList<>();
                for (SearchingRide ride : response.body()) {
                    String riderName = TextUtils.isEmpty(ride.user_name) ? "Nearby rider" : ride.user_name;
                    String destination = TextUtils.isEmpty(ride.place_name) ? "Unknown destination" : ride.place_name;
                    mapped.add(new NearbyRider(ride.request_id, riderName, destination, ride.scheduled_time, Math.max(1, ride.current_members)));
                }
                nearbyRidersAdapter.setItems(mapped);
            }

            @Override
            public void onFailure(Call<List<SearchingRide>> call, Throwable t) {
                Toast.makeText(HomeActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openFindingPoolForRequester(int requestId, @NonNull String dest, double lat, double lng, int luggageCount) {
        Intent intent = new Intent(HomeActivity.this, FindingPoolActivity.class);
        intent.putExtra(FindingPoolActivity.EXTRA_DESTINATION, dest);
        intent.putExtra(FindingPoolActivity.EXTRA_LUGGAGE_COUNT, luggageCount);
        intent.putExtra(FindingPoolActivity.EXTRA_DEST_LAT, lat);
        intent.putExtra(FindingPoolActivity.EXTRA_DEST_LNG, lng);
        intent.putExtra(FindingPoolActivity.EXTRA_REQUEST_ID, requestId);
        startActivity(intent);
    }

    private void joinPartnerRide(int partnerRequestId, int myRequestId, @NonNull String myDest, double myLat, double myLng, int luggageCount) {
        ApiClient.api(this)
                .joinPartnerRide(partnerRequestId)
                .enqueue(new Callback<JoinPartnerRideResponse>() {
                    @Override
                    public void onResponse(Call<JoinPartnerRideResponse> call, Response<JoinPartnerRideResponse> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            Toast.makeText(HomeActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                            return;
                        }
                        int poolId = response.body().pool_id;
                        if (poolId <= 0) {
                            Toast.makeText(HomeActivity.this, "Match failed. Try again.", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        Intent intent = new Intent(HomeActivity.this, FindingPoolActivity.class);
                        intent.putExtra(FindingPoolActivity.EXTRA_POOL_ID, poolId);
                        intent.putExtra(FindingPoolActivity.EXTRA_REQUEST_ID, myRequestId);
                        intent.putExtra(FindingPoolActivity.EXTRA_DESTINATION, myDest);
                        intent.putExtra(FindingPoolActivity.EXTRA_DEST_LAT, myLat);
                        intent.putExtra(FindingPoolActivity.EXTRA_DEST_LNG, myLng);
                        intent.putExtra(FindingPoolActivity.EXTRA_LUGGAGE_COUNT, luggageCount);
                        startActivity(intent);
                    }

                    @Override
                    public void onFailure(Call<JoinPartnerRideResponse> call, Throwable t) {
                        Toast.makeText(HomeActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                    }
                });
    }
}

