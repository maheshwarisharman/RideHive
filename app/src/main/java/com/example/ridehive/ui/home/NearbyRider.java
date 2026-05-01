package com.example.ridehive.ui.home;

import androidx.annotation.NonNull;

public class NearbyRider {
    private final int poolId;
    private final String name;
    private final String destination;
    private final String scheduledTime;
    private final int memberCount;

    public NearbyRider(int poolId, @NonNull String name, @NonNull String destination, String scheduledTime, int memberCount) {
        this.poolId = poolId;
        this.name = name;
        this.destination = destination;
        this.scheduledTime = scheduledTime;
        this.memberCount = memberCount;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public String getScheduledTime() {
        return scheduledTime;
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

