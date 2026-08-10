import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { DashboardSubject } from './types';

interface SubjectProgressProps {
  subjects: DashboardSubject[];
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  primaryBrown: string;
}

export default function SubjectProgress({
  subjects,
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  primaryBrown,
}: SubjectProgressProps) {
  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Subject Progress</Text>
      {subjects.map((sub, idx) => (
        <View
          key={idx}
          style={[styles.subjectCard, { backgroundColor: cardBg, borderColor: borderCol }]}
        >
          <View style={styles.subjectHeader}>
            <Text style={[styles.subjectName, { color: textPrimary }]}>{sub.name}</Text>
            <Text style={[styles.subjectPercent, { color: primaryBrown }]}>{sub.completion}%</Text>
          </View>
          <View style={[styles.progressLineBg, { backgroundColor: borderCol, marginVertical: 8 }]}>
            <View
              style={[
                styles.progressLineFill,
                { backgroundColor: primaryBrown, width: `${sub.completion}%` },
              ]}
            />
          </View>
          <View style={styles.subjectDetails}>
            <Text style={[styles.subjectDetailText, { color: textSecondary }]}>
              Pending: {sub.pending} • Completed: {sub.completed}
            </Text>
            <Text style={[styles.subjectDetailText, { color: textSecondary, marginTop: 2 }]}>
              {sub.quiz}
            </Text>
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
  subjectCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subjectPercent: {
    fontSize: 12,
    fontWeight: '700',
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
  subjectDetails: {
    marginTop: 6,
  },
  subjectDetailText: {
    fontSize: 11,
  },
});
