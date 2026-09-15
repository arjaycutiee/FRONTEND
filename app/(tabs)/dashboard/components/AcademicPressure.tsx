import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
        <Text style={[styles.pressureLevelText, { color }]}>{meta.title}</Text>
        <View style={[styles.pressureBadge, { backgroundColor: color + '15' }]}>
          <Text style={[styles.pressureBadgeText, { color }]}>{meta.badge}</Text>
        </View>
      </View>
      <Text style={[styles.pressureDesc, { color: textSecondary }]}>{description}</Text>
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
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pressureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  pressureLevelText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  pressureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  pressureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pressureDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  detailsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsActionText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
});
