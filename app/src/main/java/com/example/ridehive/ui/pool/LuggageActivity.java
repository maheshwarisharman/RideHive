package com.example.ridehive.ui.pool;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ridehive.R;
import com.google.android.material.button.MaterialButton;

public class LuggageActivity extends AppCompatActivity {

    public static final String EXTRA_DESTINATION = "extra_destination";
    public static final String EXTRA_DEST_LAT = "extra_dest_lat";
    public static final String EXTRA_DEST_LNG = "extra_dest_lng";

    public static final String RESULT_DESTINATION = "result_destination";
    public static final String RESULT_LUGGAGE_COUNT = "result_luggage_count";
    public static final String RESULT_DEST_LAT = "result_dest_lat";
    public static final String RESULT_DEST_LNG = "result_dest_lng";

    private int luggageCount = 0; // 0..3

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_luggage);

        ImageView back = findViewById(R.id.iv_back);
        TextView destination = findViewById(R.id.tv_destination_value);
        TextView countText = findViewById(R.id.tv_luggage_count);
        View minus = findViewById(R.id.btn_minus);
        View plus = findViewById(R.id.btn_plus);
        MaterialButton continueBtn = findViewById(R.id.btn_continue);

        final String dest = getIntent() != null ? getIntent().getStringExtra(EXTRA_DESTINATION) : "";
        final double destLat = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LAT, Double.NaN) : Double.NaN;
        final double destLng = getIntent() != null ? getIntent().getDoubleExtra(EXTRA_DEST_LNG, Double.NaN) : Double.NaN;
        destination.setText(TextUtils.isEmpty(dest) ? "-" : dest);

        updateCount(countText);

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
                    updateCount(countText);
                }
            }
        });

        plus.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (luggageCount < 3) {
                    luggageCount++;
                    updateCount(countText);
                }
            }
        });

        continueBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent data = new Intent();
                data.putExtra(RESULT_DESTINATION, dest);
                data.putExtra(RESULT_LUGGAGE_COUNT, luggageCount);
                data.putExtra(RESULT_DEST_LAT, destLat);
                data.putExtra(RESULT_DEST_LNG, destLng);
                setResult(RESULT_OK, data);
                finish();
            }
        });
    }

    private void updateCount(TextView countText) {
        countText.setText(String.valueOf(luggageCount));
    }
}

