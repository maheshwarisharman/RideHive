package com.example.ridehive.network.models;

public class RidePassenger {
    public int user_id;
    public String name;
    public double rating;

    @com.google.gson.annotations.SerializedName("destination_name")
    public String destination_name;

    @com.google.gson.annotations.SerializedName("destination_address")
    public String destination_address;

    @com.google.gson.annotations.SerializedName("dest_lat")
    public double dest_lat;

    @com.google.gson.annotations.SerializedName("dest_lng")
    public double dest_lng;

    public int luggage_count;
}
