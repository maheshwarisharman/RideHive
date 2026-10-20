import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { Button, Card, Chip, TextField } from '../../components/ui';
import { safetyService } from './safetyService';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const RATING_TAGS = ['Punctual', 'Polite', 'Smooth coordination', 'Fair sharing', 'Great co-rider'];

export interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  poolId: string;
  toUserId: string;
  targetName: string;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  poolId,
  toUserId,
  targetName,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await safetyService.submitRating({
      poolId,
      toUserId,
      score: rating,
      tags: selectedTags,
      comments: comment.trim() || undefined,
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert('Thank You', `Your rating for ${targetName} has been submitted.`);
      onSuccess?.();
      onClose();
    } else {
      Alert.alert('Rating Error', res.error?.message || 'Could not submit rating.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Rate {targetName}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            How was your pooling experience with this rider? Your feedback keeps the BMU campus
            community safe.
          </Text>

          {/* 5 Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starTouch}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${star} star`}
              >
                <Star
                  size={36}
                  color={star <= rating ? '#000000' : colors.border}
                  fill={star <= rating ? '#000000' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Tags */}
          <Text style={styles.tagsLabel}>Positive Highlights</Text>
          <View style={styles.tagsRow}>
            {RATING_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, active ? styles.tagChipActive : null]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, active ? styles.tagTextActive : null]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Comment */}
          <TextField
            label="Optional Note"
            placeholder="Add comments on punctuality or coordination..."
            value={comment}
            onChangeText={setComment}
          />

          <Button
            title="Submit Rating"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  starTouch: {
    padding: spacing.xs,
  },
  tagsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  tagText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
});
