package com.example.ridehive.util;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.IOException;

import okhttp3.ResponseBody;
import retrofit2.Response;

public final class UiUtil {
    private UiUtil() {}

    @NonNull
    public static String errorMessage(@Nullable Throwable t) {
        if (t == null) return "Something went wrong";
        String msg = t.getMessage();
        return msg == null || msg.trim().isEmpty() ? "Something went wrong" : msg;
    }

    @NonNull
    public static String errorMessage(@NonNull Response<?> resp) {
        try {
            ResponseBody body = resp.errorBody();
            if (body != null) {
                String s = body.string();
                if (s != null && !s.trim().isEmpty()) return s;
            }
        } catch (IOException ignored) {}
        return "Request failed (" + resp.code() + ")";
    }
}

