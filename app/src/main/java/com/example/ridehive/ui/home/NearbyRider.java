package com.example.ridehive.ui.home;

import androidx.annotation.NonNull;

public class NearbyRider {
    private final String name;
    private final String destination;

    public NearbyRider(@NonNull String name, @NonNull String destination) {
        this.name = name;
        this.destination = destination;
    }

    @NonNull
    public String getName() {
        return name;
    }

    @NonNull
    public String getDestination() {
        return destination;
    }
}

