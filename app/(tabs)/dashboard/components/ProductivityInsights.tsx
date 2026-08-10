import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ProductivityInsightsProps {
  cardBg: string;
  borderCol: string;
  textSecondary: string;
  successGreen: string;
  primaryBrown: string;
}

export default function ProductivityInsights({
  cardBg,
  borderCol,
  textSecondary,
  successGreen,
  primaryBrown,
}: ProductivityInsightsProps) {
  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Productivity Insights</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.insightRow}>
          <Feather name="check" size={14} color={successGreen} style={{ marginRight: 8 }} />
          <Text style={[styles.insightText, { color: textSecondary }]}>
            You completed 8 tasks this week.
          </Text>
        </View>
        <View style={[styles.insightRow, { marginTop: 8 }]}>
          <Feather name="trending-up" size={14} color={primaryBrown} style={{ marginRight: 8 }} />
          <Text style={[styles.insightText, { color: textSecondary }]}>
            Capstone Paper has the highest remaining workload.
          </Text>
        </View>
        <View style={[styles.insightRow, { marginTop: 8 }]}>
          <Feather name="check-circle" size={14} color={successGreen} style={{ marginRight: 8 }} />
          <Text style={[styles.insightText, { color: textSecondary }]}>
            You have no overdue assignments.
          </Text>
        </View>
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
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightText: {
    fontSize: 12,
    flex: 1,
  },
});
