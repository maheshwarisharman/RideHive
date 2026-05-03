package com.example.ridehive.network.models;

import java.util.List;

public class PoolDetails {
    public int pool_id;
    public int location_id;
    public int capacity_people;
    public int capacity_suitcases;
    public int remaining_people;
    public int remaining_suitcases;
    public String status;
    public String created_at;
    public String place_name;
    public String address;
    public String latitude;
    public String longitude;

    @com.google.gson.annotations.SerializedName("scheduled_time")
    public String scheduled_time;

    public List<Member> members;

    public static class Member {
        public int user_id;
        public String name;
        public double rating;
        public int luggage_count;
        public String joined_at;

        @com.google.gson.annotations.SerializedName("destination_name")
        public String destination_name;

        @com.google.gson.annotations.SerializedName("destination_address")
        public String destination_address;

        @com.google.gson.annotations.SerializedName("dest_lat")
        public double dest_lat;

        @com.google.gson.annotations.SerializedName("dest_lng")
        public double dest_lng;
    }
}
