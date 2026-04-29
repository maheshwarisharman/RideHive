package com.example.ridehive.ui.rides;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.models.RidePassenger;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class RidePassengersAdapter extends RecyclerView.Adapter<RidePassengersAdapter.VH> {

    @NonNull
    private final List<RidePassenger> items = new ArrayList<>();

    public void setItems(@NonNull List<RidePassenger> passengers) {
        items.clear();
        items.addAll(passengers);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ride_passenger, parent, false);
        return new VH(view);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        RidePassenger passenger = items.get(position);
        holder.name.setText(passenger.name == null ? "Passenger" : passenger.name);
        holder.rating.setText(String.format(Locale.getDefault(), "Rating: %.1f", passenger.rating));
        holder.destination.setText(passenger.destination_name == null ? "--" : passenger.destination_name);
        holder.address.setText(passenger.destination_address == null ? "--" : passenger.destination_address);
        holder.luggage.setText("Luggage: " + Math.max(0, passenger.luggage_count));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView rating;
        final TextView destination;
        final TextView address;
        final TextView luggage;

        VH(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.tv_name);
            rating = itemView.findViewById(R.id.tv_rating);
            destination = itemView.findViewById(R.id.tv_destination_name);
            address = itemView.findViewById(R.id.tv_destination_address);
            luggage = itemView.findViewById(R.id.tv_luggage);
        }
    }
}
