package com.example.ridehive.ui.home;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;

public class NearbyRidersAdapter extends RecyclerView.Adapter<NearbyRidersAdapter.VH> {

    public interface Listener {
        void onJoinClicked(@NonNull NearbyRider rider);
    }

    @NonNull private final List<NearbyRider> items = new ArrayList<>();
    @NonNull private final Listener listener;

    public NearbyRidersAdapter(@NonNull List<NearbyRider> items, @NonNull Listener listener) {
        this.items.addAll(items);
        this.listener = listener;
    }

    public void setItems(@NonNull List<NearbyRider> riders) {
        items.clear();
        items.addAll(riders);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_nearby_rider, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        NearbyRider rider = items.get(position);
        holder.name.setText(rider.getName());
        holder.destination.setText(rider.getDestination());
        holder.avatar.setImageResource(position % 2 == 0 ? R.drawable.ic_avatar_1 : R.drawable.ic_avatar_2);
        holder.joinButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                listener.onJoinClicked(rider);
            }
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final TextView name;
        final TextView destination;
        final MaterialButton joinButton;

        VH(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.iv_avatar);
            name = itemView.findViewById(R.id.tv_name);
            destination = itemView.findViewById(R.id.tv_destination);
            joinButton = itemView.findViewById(R.id.btn_join);
        }
    }
}

