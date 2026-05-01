package com.example.ridehive.ui.pool;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.models.PoolDetails;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class PoolMembersAdapter extends RecyclerView.Adapter<PoolMembersAdapter.VH> {

    @NonNull
    private final List<PoolDetails.Member> items = new ArrayList<>();

    public void setItems(@NonNull List<PoolDetails.Member> members) {
        items.clear();
        items.addAll(members);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_pool_member, parent, false);
        return new VH(view);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        PoolDetails.Member m = items.get(position);
        holder.name.setText(m.name == null ? "Member" : m.name);
        
        // Use member's destination name, or a fallback if it's missing
        String destination = m.destination_name;
        if (destination == null || destination.trim().isEmpty() || destination.equalsIgnoreCase("Unknown destination")) {
            destination = "Cab's primary destination";
        }
        
        holder.meta.setText(String.format(Locale.getDefault(), 
            "Rating: %.1f  •  Luggage: %d\nGoing to: %s", 
            m.rating, 
            Math.max(0, m.luggage_count),
            destination));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView meta;

        VH(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.tv_name);
            meta = itemView.findViewById(R.id.tv_meta);
        }
    }
}
