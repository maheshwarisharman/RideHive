package com.example.ridehive.network;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.Nullable;

public final class TokenStore {
    private static final String PREFS = "ridehive_prefs";
    private static final String KEY_TOKEN = "jwt_token";

    private TokenStore() {}

    public static void saveToken(Context context, String token) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().putString(KEY_TOKEN, token).apply();
    }

    @Nullable
    public static String getToken(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return sp.getString(KEY_TOKEN, null);
    }

    public static void clearToken(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().remove(KEY_TOKEN).apply();
    }
}

