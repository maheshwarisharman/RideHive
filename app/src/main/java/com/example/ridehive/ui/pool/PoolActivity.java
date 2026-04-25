package com.example.ridehive.ui.pool;

import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ridehive.R;

public class PoolActivity extends AppCompatActivity {

    public static final String EXTRA_DESTINATION = "extra_destination";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pool);

        ImageView back = findViewById(R.id.iv_back);
        TextView destination = findViewById(R.id.tv_pool_destination);

        String dest = getIntent() != null ? getIntent().getStringExtra(EXTRA_DESTINATION) : null;
        if (dest == null) dest = "";
        destination.setText(dest);

        back.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }
}

