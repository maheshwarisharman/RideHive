package com.example.ridehive.ui.pool;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ridehive.R;

import java.util.List;

public class MatchedPartnersAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_PARTNER = 1;
    private static final int TYPE_LOOKING = 2;

    @NonNull private final List<MatchedPartner> items;

    public MatchedPartnersAdapter(@NonNull List<MatchedPartner> items) {
        this.items = items;
    }

    @Override
    public int getItemViewType(int position) {
        if (position < items.size()) return TYPE_PARTNER;
        return TYPE_LOOKING;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        if (viewType == TYPE_PARTNER) {
            View v = inflater.inflate(R.layout.item_matched_partner, parent, false);
            return new PartnerVH(v);
        }
        View v = inflater.inflate(R.layout.item_looking_more, parent, false);
        return new LookingVH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof PartnerVH) {
            MatchedPartner p = items.get(position);
            PartnerVH vh = (PartnerVH) holder;
            vh.avatar.setImageResource(p.getAvatarRes());
            vh.name.setText(p.getName());
            vh.meta.setText("★ " + p.getRating() + "  •  " + p.getRides() + " rides");
            return;
        }
        // Looking item is static.
    }

    @Override
    public int getItemCount() {
        return items.size() + 1; // + looking-for-more card
    }

    static class PartnerVH extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final TextView name;
        final TextView meta;
        final ImageView chat;

        PartnerVH(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.iv_avatar);
            name = itemView.findViewById(R.id.tv_name);
            meta = itemView.findViewById(R.id.tv_meta);
            chat = itemView.findViewById(R.id.iv_chat);
        }
    }

    static class LookingVH extends RecyclerView.ViewHolder {
        LookingVH(@NonNull View itemView) {
            super(itemView);
        }
    }
}

