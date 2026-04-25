package com.example.ridehive.ui.pool;

import android.os.Bundle;
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

public class FindingPoolActivity extends AppCompatActivity implements OnMapReadyCallback {

    public static final String EXTRA_DESTINATION = "extra_destination";
    public static final String EXTRA_LUGGAGE_COUNT = "extra_luggage_count";
    public static final String EXTRA_DEST_LAT = "extra_dest_lat";
    public static final String EXTRA_DEST_LNG = "extra_dest_lng";

    private GoogleMap googleMap;
    private Marker destinationMarker;
    private LatLng pendingLatLng;
    private String pendingLabel;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_finding_pool);

        ImageView back = findViewById(R.id.iv_back);
        ImageView more = findViewById(R.id.iv_more);
        TextView destination = findViewById(R.id.tv_destination_value);
        TextView matchedCount = findViewById(R.id.tv_matched_count);
        RecyclerView list = findViewById(R.id.rv_matched_partners);
        MaterialButton cancel = findViewById(R.id.btn_cancel_matching);
        ImageView zoomIn = findViewById(R.id.btn_zoom_in);
        ImageView zoomOut = findViewById(R.id.btn_zoom_out);

        String dest = getIntent() != null ? getIntent().getStringExtra(EXTRA_DESTINATION) : "";
        int luggage = getIntent() != null ? getIntent().getIntExtra(EXTRA_LUGGAGE_COUNT, 0) : 0;
        double lat = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LAT, Double.NaN) : Double.NaN;
        double lng = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LNG, Double.NaN) : Double.NaN;

        destination.setText(dest == null ? "" : dest);

        if (!Double.isNaN(lat) && !Double.isNaN(lng)) {
            pendingLatLng = new LatLng(lat, lng);
            pendingLabel = dest;
        }

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.finding_map_fragment);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }

        List<MatchedPartner> partners = mockPartners();
        matchedCount.setText(partners.size() + " Matched");

        list.setLayoutManager(new LinearLayoutManager(this));
        list.setAdapter(new MatchedPartnersAdapter(partners));

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
                Toast.makeText(FindingPoolActivity.this, "Matching cancelled", Toast.LENGTH_SHORT).show();
                finish();
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

        // For now we just keep luggage count available for future capacity logic.
        // Cab capacity: 4 people, 3 suitcases (not implemented yet).
        if (luggage < 0) {
            // no-op safety
        }
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

    @NonNull
    private static List<MatchedPartner> mockPartners() {
        List<MatchedPartner> list = new ArrayList<>();
        list.add(new MatchedPartner("Aditi", 4.9f, 82, R.drawable.ic_avatar_2));
        list.add(new MatchedPartner("Arush", 4.7f, 15, R.drawable.ic_avatar_1));
        return list;
    }
}

