package com.example.ridehive.network.models;

public class CreateRideRequestRequest {
    public int location_id;
    public String type; // NOW or SCHEDULED
    public int luggage_count; // 0..3

    public CreateRideRequestRequest(int locationId, String type, int luggageCount) {
        this.location_id = locationId;
        this.type = type;
        this.luggage_count = luggageCount;
    }
}

