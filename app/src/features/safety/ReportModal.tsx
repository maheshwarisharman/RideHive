import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { ShieldAlert, X } from 'lucide-react-native';
import { Button, TextField } from '../../components/ui';
import { safetyService } from './safetyService';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const REPORT_REASONS = [
  'No-show / Ghosted ride',
  'Refused fare split payment',
  'Disrespectful or inappropriate behavior',
  'Unsafe transit coordination',
  'Spam or fake profile',
];

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  targetName: string;
  poolId?: string;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  reportedUserId,
  targetName,
  poolId,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [blockAlso, setBlockAlso] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    const reportRes = await safetyService.reportUser({
      reportedUserId,
      poolId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });

    if (blockAlso) {
      await safetyService.blockUser(reportedUserId);
    }

    setSubmitting(false);

    if (reportRes.success) {
      Alert.alert(
        'Report Received',
        `Thank you for reporting. Our campus trust team will review this report.${
          blockAlso ? ` You will no longer see rides with ${targetName}.` : ''
        }`
      );
      onSuccess?.();
      onClose();
    } else {
      Alert.alert('Report Error', reportRes.error?.message || 'Could not submit report.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <ShieldAlert size={20} color={colors.error} style={{ marginRight: spacing.xs }} />
              <Text style={styles.title}>Report Rider</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Reporting helps keep RideHive safe and reliable for all BMU students. Reports are confidential.
          </Text>

          <Text style={styles.sectionLabel}>Select Reason</Text>
          <View style={styles.reasonsList}>
            {REPORT_REASONS.map((reason) => {
              const active = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, active ? styles.reasonRowActive : null]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[styles.radioDot, active ? styles.radioDotActive : null]} />
                  <Text style={[styles.reasonText, active ? styles.reasonTextActive : null]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextField
            label="Additional Details (Optional)"
            placeholder="Describe what occurred during the ride..."
            value={details}
            onChangeText={setDetails}
          />

          <TouchableOpacity
            style={styles.blockCheckbox}
            onPress={() => setBlockAlso(!blockAlso)}
          >
            <View style={[styles.checkboxBox, blockAlso ? styles.checkboxBoxActive : null]}>
              {blockAlso && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.blockText}>
              Also block {targetName} from seeing my pools in the future
            </Text>
          </TouchableOpacity>

          <Button
            title="Submit Report"
            variant="destructive"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: spacing.md }}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  reasonsList: {
    marginBottom: spacing.md,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  reasonRowActive: {
    backgroundColor: colors.surface,
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  radioDotActive: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  reasonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  reasonTextActive: {
    fontWeight: '600',
  },
  blockCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: colors.error,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: colors.error,
    borderRadius: 2,
  },
  blockText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});
