import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { AppButton } from '../../../shared/components/AppButton';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NameSetup'>;
};

export default function NameSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const { user, updateUserProfileName } = useAuth();
  const { updateSettings } = useSettings();
  const { theme } = useAppTheme();
  const tc = theme.colors;

  const [fullName, setFullName] = useState(
    user?.name && user.name !== 'Google User' && user.name !== 'User' ? user.name : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const name = fullName.trim();
      await updateUserProfileName(name);

      // Reset onboarding flag so new user is welcomed on Dashboard
      await updateSettings({ onboardingCompleted: false });

      // Navigate to main application dashboard
      navigation.replace('MainTabs');
    } catch (err: any) {
      setError(err.message || 'Failed to save name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Icon */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#A855F7', '#7C3AED']}
              style={styles.logoBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Welcome to Xpense! 👋</Text>
            <Text style={styles.subtitle}>
              What should we call you? Your name will be displayed in your profile settings and on your exported PDF financial statements.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rishabh Verma"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (error) setError('');
                  }}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
              </View>
            </View>

            <View style={{ height: spacing.lg }} />

            <AppButton
              label="Continue to App"
              onPress={handleSaveName}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    maxWidth: 320,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.body,
    fontSize: 16,
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
    textAlign: 'center',
  },
});
