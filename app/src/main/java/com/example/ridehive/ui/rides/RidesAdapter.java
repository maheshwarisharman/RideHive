package com.example.ridehive.ui.rides;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;
import com.example.ridehive.network.models.RideRequestItem;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class RidesAdapter extends RecyclerView.Adapter<RidesAdapter.VH> {

    public interface Listener {
        void onRideClicked(@NonNull RideRequestItem ride);
    }

    @NonNull
    private final List<RideRequestItem> items = new ArrayList<>();
    @NonNull
    private final Listener listener;

    public RidesAdapter(@NonNull Listener listener) {
        this.listener = listener;
    }

    public void setItems(@NonNull List<RideRequestItem> rides) {
        items.clear();
        items.addAll(rides);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ride, parent, false);
        return new VH(view);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        RideRequestItem ride = items.get(position);
        holder.place.setText(nonNull(ride.place_name));
        holder.address.setText(nonNull(ride.address));
        holder.meta.setText(buildMeta(ride));
        holder.status.setText(buildStatus(ride));
        holder.time.setText(buildTime(ride));
        holder.itemView.setOnClickListener(v -> listener.onRideClicked(ride));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    @NonNull
    private static String buildMeta(@NonNull RideRequestItem ride) {
        String type = nonNull(ride.type);
        String requestStatus = nonNull(ride.request_status);
        int luggage = Math.max(ride.luggage_count, 0);
        return type + "  •  " + requestStatus + "  •  Luggage: " + luggage;
    }

    @NonNull
    private static String buildStatus(@NonNull RideRequestItem ride) {
        String poolStatus = nonNull(ride.pool_status);
        if (poolStatus.isEmpty()) return nonNull(ride.request_status);
        return nonNull(ride.request_status) + " / " + poolStatus;
    }

    @NonNull
    private static String buildTime(@NonNull RideRequestItem ride) {
        String primary = ride.scheduled_datetime == null ? ride.created_at : ride.scheduled_datetime;
        String label = ride.scheduled_datetime == null ? "Created: " : "Scheduled: ";
        return label + formatIso(primary);
    }

    @NonNull
    private static String formatIso(String iso) {
        if (iso == null || iso.trim().isEmpty()) return "--";
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US);
            parser.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date parsed = parser.parse(iso);
            if (parsed == null) return iso;

            SimpleDateFormat output = new SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault());
            output.setTimeZone(TimeZone.getDefault());
            return output.format(parsed);
        } catch (Exception ignored) {
            return iso;
        }
    }

    @NonNull
    private static String nonNull(String text) {
        return text == null ? "" : text;
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView place;
        final TextView address;
        final TextView meta;
        final TextView status;
        final TextView time;

        VH(@NonNull View itemView) {
            super(itemView);
            place = itemView.findViewById(R.id.tv_place);
            address = itemView.findViewById(R.id.tv_address);
            meta = itemView.findViewById(R.id.tv_meta);
            status = itemView.findViewById(R.id.tv_status);
            time = itemView.findViewById(R.id.tv_time);
        }
    }
}
