package com.example.ridehive.ui.profile;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ridehive.R;
import com.example.ridehive.network.TokenStore;
import com.example.ridehive.ui.auth.LoginActivity;
import com.example.ridehive.ui.home.HomeActivity;
import com.example.ridehive.ui.rides.MyRidesActivity;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

public class ProfileActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        MaterialButton logout = findViewById(R.id.btn_logout);
        BottomNavigationView bottomNav = findViewById(R.id.bottom_nav);

        logout.setOnClickListener(v -> {
            TokenStore.clearToken(ProfileActivity.this);
            Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });

        bottomNav.setSelectedItemId(R.id.nav_profile);
        bottomNav.setOnItemSelectedListener(new BottomNavigationView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                int id = item.getItemId();
                if (id == R.id.nav_profile) return true;
                if (id == R.id.nav_home) {
                    startActivity(new Intent(ProfileActivity.this, HomeActivity.class));
                    finish();
                    return true;
                }
                if (id == R.id.nav_rides) {
                    startActivity(new Intent(ProfileActivity.this, MyRidesActivity.class));
                    finish();
                    return true;
                }
                Toast.makeText(ProfileActivity.this, "Coming soon", Toast.LENGTH_SHORT).show();
                return true;
            }
        });
    }
}

