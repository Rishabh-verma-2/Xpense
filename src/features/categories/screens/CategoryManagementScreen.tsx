import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useCategories } from '../../../context/CategoryContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { AppButton } from '../../../shared/components/AppButton';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'CategoryManagement'>;
};

export default function CategoryManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { categories, archiveCategory, unarchiveCategory, removeCategory } = useCategories();
  const [selectedTab, setSelectedTab] = useState<'expense' | 'income'>('expense');

  const filtered = categories.filter((c) => c.type === selectedTab);

  const handleDelete = (id: string, name: string, isSystem: boolean) => {
    if (isSystem) {
      Alert.alert('System Category', 'System categories cannot be deleted, but you can archive them.');
      return;
    }
    Alert.alert('Delete Category', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeCategory(id);
          Alert.alert('Success', `Category "${name}" deleted successfully!`);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Categories" onBack={() => navigation.goBack()} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'expense' && styles.tabActive]}
          onPress={() => setSelectedTab('expense')}
        >
          <Text style={[styles.tabText, selectedTab === 'expense' && styles.tabTextActive]}>
            Expense ({categories.filter((c) => c.type === 'expense').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'income' && styles.tabActive]}
          onPress={() => setSelectedTab('income')}
        >
          <Text style={[styles.tabText, selectedTab === 'income' && styles.tabTextActive]}>
            Income ({categories.filter((c) => c.type === 'income').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((cat) => (
          <View key={cat.id} style={[styles.catCard, cat.isArchived && styles.archivedCard]}>
            <View style={[styles.iconBg, { backgroundColor: `${cat.color}20` }]}>
              <Ionicons name={cat.icon as any} size={20} color={cat.color} />
            </View>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>{cat.name}</Text>
              {cat.isSystem ? <Text style={styles.systemBadge}>System Default</Text> : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  cat.isArchived ? unarchiveCategory(cat.id) : archiveCategory(cat.id)
                }
              >
                <Ionicons
                  name={cat.isArchived ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddEditCategory', { categoryId: cat.id })}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              {!cat.isSystem ? (
                <TouchableOpacity onPress={() => handleDelete(cat.id, cat.name, cat.isSystem)}>
                  <Ionicons name="trash-outline" size={18} color={colors.expense} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBtn}>
        <AppButton
          label="Add Custom Category"
          onPress={() => navigation.navigate('AddEditCategory', {})}
          icon={<Ionicons name="add" size={20} color="#FFF" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  archivedCard: {
    opacity: 0.5,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  systemBadge: {
    ...typography.label,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bottomBtn: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
});
