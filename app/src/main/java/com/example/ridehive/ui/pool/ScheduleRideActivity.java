package com.example.ridehive.ui.pool;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ridehive.R;
import com.example.ridehive.network.ApiClient;
import com.example.ridehive.network.models.CreateLocationRequest;
import com.example.ridehive.network.models.CreateLocationResponse;
import com.example.ridehive.network.models.CreateRideRequestRequest;
import com.example.ridehive.network.models.CreateRideRequestResponse;
import com.example.ridehive.network.models.MessageResponse;
import com.example.ridehive.network.models.ScheduleRideRequest;
import com.example.ridehive.util.UiUtil;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.material.button.MaterialButton;

import java.util.Calendar;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ScheduleRideActivity extends AppCompatActivity implements OnMapReadyCallback {

    public static final String EXTRA_DESTINATION = "extra_destination";
    public static final String EXTRA_DEST_LAT = "extra_dest_lat";
    public static final String EXTRA_DEST_LNG = "extra_dest_lng";

    private int luggageCount = 0; // 0..3

    private final Calendar selectedDateTime = Calendar.getInstance();
    private GoogleMap googleMap;
    private Marker destinationMarker;
    private LatLng pendingLatLng;
    private String pendingLabel;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_schedule_ride);

        ImageView back = findViewById(R.id.iv_back);
        TextView destination = findViewById(R.id.tv_destination_value);
        TextView luggageCountText = findViewById(R.id.tv_luggage_count);
        View minus = findViewById(R.id.btn_minus);
        View plus = findViewById(R.id.btn_plus);
        TextView dateValue = findViewById(R.id.tv_date_value);
        TextView timeValue = findViewById(R.id.tv_time_value);
        View pickDate = findViewById(R.id.row_date);
        View pickTime = findViewById(R.id.row_time);
        MaterialButton schedule = findViewById(R.id.btn_schedule);
        ImageView zoomIn = findViewById(R.id.btn_zoom_in);
        ImageView zoomOut = findViewById(R.id.btn_zoom_out);

        final String dest = getIntent() != null ? getIntent().getStringExtra(EXTRA_DESTINATION) : "";
        final double lat = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LAT, Double.NaN) : Double.NaN;
        final double lng = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LNG, Double.NaN) : Double.NaN;

        destination.setText(TextUtils.isEmpty(dest) ? "-" : dest);
        if (!Double.isNaN(lat) && !Double.isNaN(lng)) {
            pendingLatLng = new LatLng(lat, lng);
            pendingLabel = dest;
        }

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.schedule_map_fragment);
        if (mapFragment != null) mapFragment.getMapAsync(this);

        updateLuggage(luggageCountText);
        updateDateTime(dateValue, timeValue);

        back.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        minus.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (luggageCount > 0) {
                    luggageCount--;
                    updateLuggage(luggageCountText);
                }
            }
        });
        plus.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (luggageCount < 3) {
                    luggageCount++;
                    updateLuggage(luggageCountText);
                }
            }
        });

        pickDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Calendar now = Calendar.getInstance();
                DatePickerDialog dialog = new DatePickerDialog(
                        ScheduleRideActivity.this,
                        (view, year, month, dayOfMonth) -> {
                            selectedDateTime.set(Calendar.YEAR, year);
                            selectedDateTime.set(Calendar.MONTH, month);
                            selectedDateTime.set(Calendar.DAY_OF_MONTH, dayOfMonth);
                            updateDateTime(dateValue, timeValue);
                        },
                        now.get(Calendar.YEAR),
                        now.get(Calendar.MONTH),
                        now.get(Calendar.DAY_OF_MONTH)
                );
                dialog.show();
            }
        });

        pickTime.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Calendar now = Calendar.getInstance();
                TimePickerDialog dialog = new TimePickerDialog(
                        ScheduleRideActivity.this,
                        (view, hourOfDay, minute) -> {
                            selectedDateTime.set(Calendar.HOUR_OF_DAY, hourOfDay);
                            selectedDateTime.set(Calendar.MINUTE, minute);
                            updateDateTime(dateValue, timeValue);
                        },
                        now.get(Calendar.HOUR_OF_DAY),
                        now.get(Calendar.MINUTE),
                        false
                );
                dialog.show();
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

        schedule.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (TextUtils.isEmpty(dest) || Double.isNaN(lat) || Double.isNaN(lng)) {
                    Toast.makeText(ScheduleRideActivity.this, "Select a destination first", Toast.LENGTH_SHORT).show();
                    return;
                }
                schedule.setEnabled(false);
                createScheduledRide(dest, dest, lat, lng, schedule);
            }
        });
    }

    private void createScheduledRide(String placeName, String address, double lat, double lng, MaterialButton scheduleButton) {
        ApiClient.api(this)
                .createLocation(new CreateLocationRequest(placeName, address, lat, lng))
                .enqueue(new Callback<CreateLocationResponse>() {
                    @Override
                    public void onResponse(Call<CreateLocationResponse> call, Response<CreateLocationResponse> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            scheduleButton.setEnabled(true);
                            Toast.makeText(ScheduleRideActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                            return;
                        }
                        int locationId = response.body().location_id;
                        ApiClient.api(ScheduleRideActivity.this)
                                .createRideRequest(new CreateRideRequestRequest(locationId, "SCHEDULED", luggageCount))
                                .enqueue(new Callback<CreateRideRequestResponse>() {
                                    @Override
                                    public void onResponse(Call<CreateRideRequestResponse> call, Response<CreateRideRequestResponse> response) {
                                        if (!response.isSuccessful() || response.body() == null) {
                                            scheduleButton.setEnabled(true);
                                            Toast.makeText(ScheduleRideActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                                            return;
                                        }
                                        int requestId = response.body().request_id;
                                        String dt = toApiDatetime(selectedDateTime);
                                        ApiClient.api(ScheduleRideActivity.this)
                                                .scheduleRide(new ScheduleRideRequest(requestId, dt))
                                                .enqueue(new Callback<MessageResponse>() {
                                                    @Override
                                                    public void onResponse(Call<MessageResponse> call, Response<MessageResponse> response) {
                                                        scheduleButton.setEnabled(true);
                                                        if (!response.isSuccessful()) {
                                                            Toast.makeText(ScheduleRideActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                                                            return;
                                                        }
                                                        Toast.makeText(ScheduleRideActivity.this, "Ride scheduled", Toast.LENGTH_SHORT).show();
                                                    }

                                                    @Override
                                                    public void onFailure(Call<MessageResponse> call, Throwable t) {
                                                        scheduleButton.setEnabled(true);
                                                        Toast.makeText(ScheduleRideActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                                                    }
                                                });
                                    }

                                    @Override
                                    public void onFailure(Call<CreateRideRequestResponse> call, Throwable t) {
                                        scheduleButton.setEnabled(true);
                                        Toast.makeText(ScheduleRideActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                                    }
                                });
                    }

                    @Override
                    public void onFailure(Call<CreateLocationResponse> call, Throwable t) {
                        scheduleButton.setEnabled(true);
                        Toast.makeText(ScheduleRideActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private static String toApiDatetime(Calendar cal) {
        int y = cal.get(Calendar.YEAR);
        int mo = cal.get(Calendar.MONTH) + 1;
        int d = cal.get(Calendar.DAY_OF_MONTH);
        int hh = cal.get(Calendar.HOUR_OF_DAY);
        int mm = cal.get(Calendar.MINUTE);
        return y + "-" + two(mo) + "-" + two(d) + " " + two(hh) + ":" + two(mm) + ":00";
    }

    private static String two(int v) {
        return v < 10 ? ("0" + v) : String.valueOf(v);
    }

    @Override
    public void onMapReady(GoogleMap map) {
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

    private void showDestinationOnMap(LatLng latLng, String label) {
        if (googleMap == null || latLng == null) return;
        if (destinationMarker != null) destinationMarker.remove();
        destinationMarker = googleMap.addMarker(new MarkerOptions().position(latLng).title(label));
        googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 14.5f));
    }

    private void updateLuggage(TextView luggageCountText) {
        luggageCountText.setText(String.valueOf(luggageCount));
    }

    private void updateDateTime(TextView dateValue, TextView timeValue) {
        int y = selectedDateTime.get(Calendar.YEAR);
        int m = selectedDateTime.get(Calendar.MONTH) + 1;
        int d = selectedDateTime.get(Calendar.DAY_OF_MONTH);
        int hh = selectedDateTime.get(Calendar.HOUR_OF_DAY);
        int mm = selectedDateTime.get(Calendar.MINUTE);

        dateValue.setText(d + "/" + m + "/" + y);

        int displayH = hh % 12;
        if (displayH == 0) displayH = 12;
        String ampm = hh >= 12 ? "PM" : "AM";
        String min = mm < 10 ? ("0" + mm) : String.valueOf(mm);
        timeValue.setText(displayH + ":" + min + " " + ampm);
    }
}

