package com.example.ridehive.network.models;

public class SearchingRide {
    public int request_id;
    public int user_id;
    public String user_name;
    public String type;
    public int luggage_count;
    public String place_name;
    public String address;
    public String created_at;

    @com.google.gson.annotations.SerializedName("scheduled_time")
    public String scheduled_time;

    public int current_members;
}
