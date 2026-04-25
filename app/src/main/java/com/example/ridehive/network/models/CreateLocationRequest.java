package com.example.ridehive.network.models;

public class CreateLocationRequest {
    public String place_name;
    public String address;
    public double lat;
    public double lng;

    public CreateLocationRequest(String placeName, String address, double lat, double lng) {
        this.place_name = placeName;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
    }
}

