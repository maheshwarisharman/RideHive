package com.example.ridehive.network;

import android.content.Context;

import androidx.annotation.NonNull;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public final class ApiClient {
    private static RideHiveApi api;

    private ApiClient() {}

    @NonNull
    public static synchronized RideHiveApi api(@NonNull Context context) {
        if (api != null) return api;

        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(new AuthInterceptor(context))

                // 👇 ADD THIS INTERCEPTOR
                .addInterceptor(chain -> {
                    okhttp3.Request original = chain.request();

                    okhttp3.Request request = original.newBuilder()
                            .header("ngrok-skip-browser-warning", "true")
                            .build();

                    return chain.proceed(request);
                })

                .addInterceptor(logging)
                .build();

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(ApiConstants.BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        api = retrofit.create(RideHiveApi.class);
        return api;
    }
}

