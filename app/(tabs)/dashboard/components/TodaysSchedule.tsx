import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DashboardTimelineItem } from './types';

interface TodaysScheduleProps {
  items: DashboardTimelineItem[];
  getTimelineIcon: (type: DashboardTimelineItem['type']) => string;
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  primaryBrown: string;
}

export default function TodaysSchedule({
  items,
  getTimelineIcon,
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  primaryBrown,
}: TodaysScheduleProps) {
  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Today&apos;s Schedule</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol, paddingVertical: 12 }]}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.timelineRow}>
            <Text style={[styles.timelineTimeText, { color: textSecondary }]}>
              {item.time.replace(' AM', '').replace(' PM', '')}
            </Text>
            <View style={styles.timelineCenterCol}>
              <View
                style={[
                  styles.timelineConnector,
                  idx === items.length - 1 && { bottom: '50%' },
                ]}
              >
                <View style={[styles.timelineDot, { backgroundColor: primaryBrown }]} />
              </View>
            </View>
            <View style={styles.timelineDetails}>
              <View style={styles.timelineMetaHeader}>
                <View style={[styles.timelineIconBg, { backgroundColor: primaryBrown + '12' }]}>
                  <Feather
                    name={getTimelineIcon(item.type) as any}
                    size={11}
                    color={primaryBrown}
                  />
                </View>
                <Text style={[styles.timelineType, { color: textSecondary }]}>
                  {item.type.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.timelineTitle, { color: textPrimary }]}>{item.title}</Text>
            </View>
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
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineTimeText: {
    width: 48,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    paddingTop: 10,
  },
  timelineCenterCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineConnector: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#ECEDEE30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineDetails: {
    flex: 1,
    paddingBottom: 16,
    paddingTop: 8,
  },
  timelineMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineIconBg: {
    width: 18,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  timelineType: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});
