import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type PressureLevel = 'Light' | 'Moderate' | 'Heavy';

interface AcademicPressureProps {
  level: PressureLevel;
  description: string;
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  errorRed: string;
  warningOrange: string;
  successGreen: string;
  primaryBrown: string;
}

const LEVEL_META: Record<PressureLevel, { title: string; badge: string }> = {
  Light: { title: 'Light Pressure', badge: 'On Track' },
  Moderate: { title: 'Moderate Pressure', badge: 'Stay Focused' },
  Heavy: { title: 'High Pressure', badge: 'Critical Priority' },
};

export default function AcademicPressure({
  level,
  description,
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  errorRed,
  warningOrange,
  successGreen,
  primaryBrown,
}: AcademicPressureProps) {
  const router = useRouter();
  const color = level === 'Heavy' ? errorRed : level === 'Moderate' ? warningOrange : successGreen;
  const meta = LEVEL_META[level];

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <Text style={[styles.cardTitle, { color: textPrimary }]}>Academic Pressure</Text>
      <View style={styles.pressureRow}>
        <Text style={[styles.pressureLevelText, { color: errorRed }]}>High Pressure</Text>
        <View style={[styles.pressureBadge, { backgroundColor: errorRed + '15' }]}>
          <Text style={[styles.pressureBadgeText, { color: errorRed }]}>Critical Priority</Text>
        </View>
      </View>
      <Text style={[styles.pressureDesc, { color: textSecondary }]}>
        You have three deadlines within two days. General study load is moderate, but exam prep requirements are dense this weekend.
      </Text>
      <TouchableOpacity
        style={styles.detailsActionRow}
        onPress={() => router.push('/(tabs)/tasks/task')}
      >
        <Text style={[styles.detailsActionText, { color: primaryBrown }]}>View Details</Text>
        <Feather name="arrow-right" size={14} color={primaryBrown} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 12,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});