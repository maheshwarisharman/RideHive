package com.example.ridehive.ui.pool;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.models.SearchingRide;

import java.util.ArrayList;
import java.util.List;

public class SearchingPeopleAdapter extends RecyclerView.Adapter<SearchingPeopleAdapter.VH> {

    @NonNull
    private final List<SearchingRide> items = new ArrayList<>();

    public void setItems(@NonNull List<SearchingRide> rides) {
        items.clear();
        items.addAll(rides);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_searching_person, parent, false);
        return new VH(view);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        SearchingRide ride = items.get(position);
        holder.name.setText(ride.user_name == null ? "Someone" : ride.user_name);
        String place = ride.place_name == null ? "Unknown destination" : ride.place_name;
        holder.destination.setText("Going to " + place);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView destination;

        VH(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.tv_name);
            destination = itemView.findViewById(R.id.tv_destination);
        }
    }
}
