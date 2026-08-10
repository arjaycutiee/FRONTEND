import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface QuickActionsProps {
  primaryBrown: string;
  borderCol: string;
}

export default function QuickActions({ primaryBrown, borderCol }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    { label: 'Add Task', icon: 'plus' as const, route: '/(tabs)/tasks/task' },
    { label: 'Add Expense', icon: 'dollar-sign' as const, route: '/(tabs)/expenses/expenses' },
    { label: 'Open Calendar', icon: 'calendar' as const, route: '/(tabs)/calendar/calendar' },
    { label: 'Open Notes', icon: 'edit-3' as const, route: '/(tabs)/notes/notes' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickActionsScroll}
    >
      {actions.map((action, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.actionBtn, { backgroundColor: primaryBrown + '12', borderColor: borderCol }]}
          onPress={() => router.push(action.route as any)}
        >
          <Feather name={action.icon} size={14} color={primaryBrown} style={{ marginRight: 6 }} />
          <Text style={[styles.actionBtnText, { color: primaryBrown }]}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickActionsScroll: {
    height: 48,
    marginBottom: 16,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
