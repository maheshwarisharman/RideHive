package com.example.ridehive.network.models;

public class ScheduleRideRequest {
    public int request_id;
    public String datetime; // "YYYY-MM-DD HH:MM:SS"

    public ScheduleRideRequest(int requestId, String datetime) {
        this.request_id = requestId;
        this.datetime = datetime;
    }
}

