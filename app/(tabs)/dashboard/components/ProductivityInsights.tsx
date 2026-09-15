import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface InsightItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  tone: 'success' | 'accent' | 'warning';
  text: string;
}

interface ProductivityInsightsProps {
  insights: InsightItem[];
  cardBg: string;
  borderCol: string;
  textSecondary: string;
  successGreen: string;
  warningOrange: string;
  primaryBrown: string;
}

export default function ProductivityInsights({
  insights,
  cardBg,
  borderCol,
  textSecondary,
  successGreen,
  warningOrange,
  primaryBrown,
}: ProductivityInsightsProps) {
  const toneColor = { success: successGreen, accent: primaryBrown, warning: warningOrange };

  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Productivity Insights</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
        {insights.map((item, idx) => (
          <View key={idx} style={[styles.insightRow, idx > 0 && { marginTop: 8 }]}>
            <Feather name={item.icon} size={14} color={toneColor[item.tone]} style={{ marginRight: 8 }} />
            <Text style={[styles.insightText, { color: textSecondary }]}>{item.text}</Text>
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
