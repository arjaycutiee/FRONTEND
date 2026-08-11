import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FocusSessionWidgetProps {
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  primaryBrown: string;
  timerDisplay?: string;
  targetDisplay?: string;
}

export default function FocusSessionWidget({
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  primaryBrown,
  timerDisplay = '25:00',
  targetDisplay = 'Remaining Study Target: 1.5 hrs',
}: FocusSessionWidgetProps) {
  const router = useRouter();

  return (
    <>
      <Text style={[styles.sectionHeading, { color: textSecondary }]}>Focus Session</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/productivity' as any)}
        style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
      >
        <View style={styles.focusWidgetHeader}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Feather name="shield" size={12} color={primaryBrown} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: primaryBrown, textTransform: 'uppercase' }}>Strict Study Guard</Text>
            </View>
            <Text style={[styles.focusTimerText, { color: textPrimary }]}>{timerDisplay}</Text>
            <Text style={[styles.focusTimerSubText, { color: textSecondary }]}>{targetDisplay}</Text>
          </View>
          <View style={styles.focusWidgetActions}>
            <View style={[styles.focusWidgetPlayBtn, { backgroundColor: primaryBrown }]}>
              <Feather name="play" size={16} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
  focusWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusTimerText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  focusTimerSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  focusWidgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusWidgetPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
