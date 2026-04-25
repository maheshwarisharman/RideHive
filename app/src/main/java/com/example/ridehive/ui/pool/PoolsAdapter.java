package com.example.ridehive.ui.pool;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.models.PoolSummary;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;

public class PoolsAdapter extends RecyclerView.Adapter<PoolsAdapter.VH> {

    public interface Listener {
        void onJoinClicked(int poolId);
    }

    @NonNull private final Listener listener;
    @NonNull private final List<PoolSummary> items = new ArrayList<>();

    public PoolsAdapter(@NonNull Listener listener) {
        this.listener = listener;
    }

    public void setItems(@NonNull List<PoolSummary> pools) {
        items.clear();
        items.addAll(pools);
        notifyDataSetChanged();
    }

    public void clear() {
        items.clear();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_pool, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        PoolSummary p = items.get(position);
        holder.place.setText(p.place_name);
        holder.meta.setText("Seats: " + p.remaining_seats + "  •  Suitcases: " + p.remaining_suitcases + "  •  Members: " + p.total_members);
        holder.join.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                listener.onJoinClicked(p.pool_id);
            }
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView place;
        final TextView meta;
        final MaterialButton join;

        VH(@NonNull View itemView) {
            super(itemView);
            place = itemView.findViewById(R.id.tv_place);
            meta = itemView.findViewById(R.id.tv_meta);
            join = itemView.findViewById(R.id.btn_join_pool);
        }
    }
}

