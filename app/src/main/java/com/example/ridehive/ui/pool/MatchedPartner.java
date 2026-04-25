package com.example.ridehive.ui.pool;

import androidx.annotation.DrawableRes;
import androidx.annotation.NonNull;

public class MatchedPartner {
    @NonNull private final String name;
    private final float rating;
    private final int rides;
    @DrawableRes private final int avatarRes;

    public MatchedPartner(@NonNull String name, float rating, int rides, @DrawableRes int avatarRes) {
        this.name = name;
        this.rating = rating;
        this.rides = rides;
        this.avatarRes = avatarRes;
    }

    @NonNull
    public String getName() {
        return name;
    }

    public float getRating() {
        return rating;
    }

    public int getRides() {
        return rides;
    }

    public int getAvatarRes() {
        return avatarRes;
    }
}

