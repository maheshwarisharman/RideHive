import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  BottomSheetProps,
} from '@gorhom/bottom-sheet';
import { colors, radii, spacing } from '../../theme/tokens';

export interface BottomSheetWrapperProps extends Partial<BottomSheetProps> {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  enablePanDownToClose?: boolean;
}

export const BottomSheetWrapper = forwardRef<BottomSheet, BottomSheetWrapperProps>(
  (
    {
      children,
      snapPoints: customSnapPoints,
      onClose,
      enablePanDownToClose = true,
      ...props
    },
    ref
  ) => {
    const snapPoints = useMemo(
      () => customSnapPoints || ['40%', '75%'],
      [customSnapPoints]
    );

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        onClose={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        {...props}
      >
        <BottomSheetView style={styles.content}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

BottomSheetWrapper.displayName = 'BottomSheetWrapper';

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 36,
    height: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
