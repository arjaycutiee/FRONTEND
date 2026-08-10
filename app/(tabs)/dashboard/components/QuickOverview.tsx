import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface QuickOverviewProps {
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  tasksCount?: number;
  deadlinesCount?: number;
  classesCount?: number;
  weeklySpend?: string;
}

export default function QuickOverview({
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  tasksCount = 4,
  deadlinesCount = 5,
  classesCount = 2,
  weeklySpend = '₱1,250',
}: QuickOverviewProps) {
  const stats = [
    { num: `${tasksCount}`, label: 'Tasks Today' },
    { num: `${deadlinesCount}`, label: 'Deadlines' },
    { num: `${classesCount}`, label: "Today's Classes" },
    { num: weeklySpend, label: 'Weekly Spend' },
  ];

  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Quick Overview</Text>
      <View style={styles.statsGrid}>
        {stats.map((item, idx) => (
          <View
            key={idx}
            style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}
          >
            <Text style={[styles.statNum, { color: textPrimary }]}>{item.num}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  statNum: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});
