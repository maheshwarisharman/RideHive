package com.example.ridehive.ui.auth;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ridehive.R;
import com.example.ridehive.network.ApiClient;
import com.example.ridehive.network.models.SignupRequest;
import com.example.ridehive.network.models.SignupResponse;
import com.example.ridehive.util.UiUtil;
import com.google.android.material.button.MaterialButton;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SignupActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        findViewById(R.id.iv_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        EditText name = findViewById(R.id.et_name);
        EditText email = findViewById(R.id.et_email);
        EditText password = findViewById(R.id.et_password);
        MaterialButton signup = findViewById(R.id.btn_signup);

        signup.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String n = name.getText() == null ? "" : name.getText().toString().trim();
                String e = email.getText() == null ? "" : email.getText().toString().trim();
                String p = password.getText() == null ? "" : password.getText().toString().trim();

                if (TextUtils.isEmpty(n) || TextUtils.isEmpty(e) || TextUtils.isEmpty(p)) {
                    Toast.makeText(SignupActivity.this, "Fill all fields", Toast.LENGTH_SHORT).show();
                    return;
                }

                signup.setEnabled(false);
                ApiClient.api(SignupActivity.this)
                        .signup(new SignupRequest(n, e, p))
                        .enqueue(new Callback<SignupResponse>() {
                            @Override
                            public void onResponse(Call<SignupResponse> call, Response<SignupResponse> response) {
                                signup.setEnabled(true);
                                if (!response.isSuccessful()) {
                                    Toast.makeText(SignupActivity.this, UiUtil.errorMessage(response), Toast.LENGTH_SHORT).show();
                                    return;
                                }
                                Toast.makeText(SignupActivity.this, "Signup successful. Please login.", Toast.LENGTH_SHORT).show();
                                finish();
                            }

                            @Override
                            public void onFailure(Call<SignupResponse> call, Throwable t) {
                                signup.setEnabled(true);
                                Toast.makeText(SignupActivity.this, UiUtil.errorMessage(t), Toast.LENGTH_SHORT).show();
                            }
                        });
            }
        });
    }
}

