package com.example.ridehive.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ridehive.R;
import com.example.ridehive.network.ApiClient;
import com.example.ridehive.network.TokenStore;
import com.example.ridehive.network.models.LoginRequest;
import com.example.ridehive.network.models.LoginResponse;
import com.example.ridehive.ui.home.HomeActivity;
import com.example.ridehive.util.UiUtil;
import com.google.android.material.button.MaterialButton;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        EditText email = findViewById(R.id.et_email);
        EditText password = findViewById(R.id.et_password);
        MaterialButton login = findViewById(R.id.btn_login);
        TextView signup = findViewById(R.id.tv_signup);

        login.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String e = email.getText() == null ? "" : email.getText().toString().trim();
                String p = password.getText() == null ? "" : password.getText().toString().trim();
                if (TextUtils.isEmpty(e) || TextUtils.isEmpty(p)) {
                    Toast.makeText(LoginActivity.this, "Enter email and password", Toast.LENGTH_SHORT).show();
                    return;
                }

                login.setEnabled(false);
                ApiClient.api(LoginActivity.this)
                        .login(new LoginRequest(e, p))
                        .enqueue(new Callback<LoginResponse>() {
                            @Override
                            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                                login.setEnabled(true);
                                if (!response.isSuccessful() || response.body() == null || TextUtils.isEmpty(response.body().token)) {
                                    Toast.makeText(LoginActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                                    return;
                                }
                                TokenStore.saveToken(LoginActivity.this, response.body().token);
                                startActivity(new Intent(LoginActivity.this, HomeActivity.class));
                                finish();
                            }

                            @Override
                            public void onFailure(Call<LoginResponse> call, Throwable t) {
                                login.setEnabled(true);
                                Toast.makeText(LoginActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                            }
                        });
            }
        });

        signup.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(LoginActivity.this, SignupActivity.class));
            }
        });
    }
}

