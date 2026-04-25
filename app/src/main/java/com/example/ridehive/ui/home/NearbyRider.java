package com.example.ridehive.ui.home;

import androidx.annotation.NonNull;

public class NearbyRider {
    private final int poolId;
    private final String name;
    private final String destination;

    public NearbyRider(int poolId, @NonNull String name, @NonNull String destination) {
        this.poolId = poolId;
        this.name = name;
        this.destination = destination;
    }

    public int getPoolId() {
        return poolId;
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

