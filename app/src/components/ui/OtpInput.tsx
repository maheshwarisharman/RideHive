import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
}) => {
  const inputsRef = useRef<any[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const handleChangeText = (text: string, index: number) => {
    if (disabled) return;

    // Handle full paste
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length > 1) {
      const pasted = cleanText.slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const newCode = value.split('');
    newCode[index] = cleanText;
    const finalCode = newCode.join('').slice(0, length);
    onChange(finalCode);

    if (cleanText && index < length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] || '';
        const isFocused = focusedIndex === index;

        return (
          <Pressable
            key={index}
            onPress={() => inputsRef.current[index]?.focus()}
            style={[
              styles.box,
              isFocused && styles.boxFocused,
              char ? styles.boxFilled : null,
              error ? styles.boxError : null,
              disabled ? styles.boxDisabled : null,
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              value={char}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              editable={!disabled}
              selectTextOnFocus
              style={[
                styles.textInput,
                char ? styles.textInputFilled : null,
              ]}
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: spacing.md,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFocused: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.white,
  },
  boxFilled: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.white,
  },
  boxError: {
    borderColor: colors.error,
  },
  boxDisabled: {
    opacity: 0.5,
  },
  textInput: {
    ...typography.title,
    ...typography.tabular,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  textInputFilled: {
    fontWeight: '700',
  },
});
