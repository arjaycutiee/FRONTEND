import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { DashboardDeadline } from './types';

interface UpcomingDeadlinesProps {
  deadlines: DashboardDeadline[];
  getPriorityColor: (priority: DashboardDeadline['priority']) => string;
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  primaryBrown: string;
}

export default function UpcomingDeadlines({
  deadlines,
  getPriorityColor,
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  primaryBrown,
}: UpcomingDeadlinesProps) {
  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Upcoming Deadlines</Text>
      {deadlines.map((dl) => (
        <View
          key={dl.id}
          style={[styles.deadlineCard, { backgroundColor: cardBg, borderColor: borderCol }]}
        >
          <View style={styles.deadlineHeader}>
            <View>
              <Text style={[styles.deadlineSubject, { color: primaryBrown }]}>{dl.subject}</Text>
              <Text style={[styles.deadlineTitle, { color: textPrimary }]} numberOfLines={1}>
                {dl.assignment}
              </Text>
            </View>
            <View
              style={[styles.priorityDot, { backgroundColor: getPriorityColor(dl.priority) }]}
            />
          </View>
          <View style={styles.deadlineFooter}>
            <Text style={[styles.deadlineCountdown, { color: textSecondary }]}>
              {dl.countdown}
            </Text>
            <View style={styles.deadlineProgressWrapper}>
              <View
                style={[
                  styles.progressLineBg,
                  { backgroundColor: borderCol, width: 80, marginRight: 8 },
                ]}
              >
                <View
                  style={[
                    styles.progressLineFill,
                    { backgroundColor: primaryBrown, width: `${dl.completion}%` },
                  ]}
                />
              </View>
              <Text style={[styles.deadlinePercent, { color: textSecondary }]}>
                {dl.completion}%
              </Text>
            </View>
          </View>
        </View>
      ))}
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
  deadlineCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deadlineSubject: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deadlineTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    maxWidth: 240,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deadlineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  deadlineCountdown: {
    fontSize: 11,
  },
  deadlineProgressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLineBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 2,
  },
  deadlinePercent: {
    fontSize: 10,
    fontWeight: '600',
  },
});
