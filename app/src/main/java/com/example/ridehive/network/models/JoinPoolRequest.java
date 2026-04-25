package com.example.ridehive.network.models;

public class JoinPoolRequest {
    public int pool_id;
    public int request_id;
    public int luggage_count;

    public JoinPoolRequest(int poolId, int requestId, int luggageCount) {
        this.pool_id = poolId;
        this.request_id = requestId;
        this.luggage_count = luggageCount;
    }
}

