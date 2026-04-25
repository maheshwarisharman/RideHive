package com.example.ridehive.network;

import com.example.ridehive.network.models.CreateLocationRequest;
import com.example.ridehive.network.models.CreateLocationResponse;
import com.example.ridehive.network.models.CreatePoolRequest;
import com.example.ridehive.network.models.CreatePoolResponse;
import com.example.ridehive.network.models.CreateRideRequestRequest;
import com.example.ridehive.network.models.CreateRideRequestResponse;
import com.example.ridehive.network.models.CancelRideRequest;
import com.example.ridehive.network.models.JoinPoolRequest;
import com.example.ridehive.network.models.MessageResponse;
import com.example.ridehive.network.models.PoolSummary;
import com.example.ridehive.network.models.ScheduleRideRequest;
import com.example.ridehive.network.models.SignupRequest;
import com.example.ridehive.network.models.SignupResponse;
import com.example.ridehive.network.models.LoginRequest;
import com.example.ridehive.network.models.LoginResponse;
import com.example.ridehive.network.models.User;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface RideHiveApi {

    @POST("signup")
    Call<SignupResponse> signup(@Body SignupRequest body);

    @POST("login")
    Call<LoginResponse> login(@Body LoginRequest body);

    @POST("logout")
    Call<MessageResponse> logout();

    @GET("me")
    Call<User> me();

    @POST("location")
    Call<CreateLocationResponse> createLocation(@Body CreateLocationRequest body);

    @POST("ride/request")
    Call<CreateRideRequestResponse> createRideRequest(@Body CreateRideRequestRequest body);

    @POST("ride/schedule")
    Call<MessageResponse> scheduleRide(@Body ScheduleRideRequest body);

    @POST("ride/cancel")
    Call<MessageResponse> cancelRide(@Body CancelRideRequest body);

    @GET("pools")
    Call<List<PoolSummary>> pools();

    @POST("pool/create")
    Call<CreatePoolResponse> createPool(@Body CreatePoolRequest body);

    @POST("pool/join")
    Call<MessageResponse> joinPool(@Body JoinPoolRequest body);
}

