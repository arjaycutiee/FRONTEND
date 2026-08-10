import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DashboardHeaderProps {
  greeting: string;
  onOpenDrawer: () => void;
  textPrimary: string;
  textSecondary: string;
}

export default function DashboardHeader({
  greeting,
  onOpenDrawer,
  textPrimary,
  textSecondary,
}: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
          <Feather name="menu" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.greetingText, { color: textPrimary }]}>{greeting}, Vience!</Text>
          <Text style={[styles.dateText, { color: textSecondary }]}>Saturday, July 25</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Notifications', 'No new alerts.')}
        >
          <Feather name="bell" size={20} color={textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/(tabs)/profile/profile')}
        >
          <Feather name="settings" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 10,
    padding: 4,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    marginLeft: 16,
    padding: 4,
  },
});
