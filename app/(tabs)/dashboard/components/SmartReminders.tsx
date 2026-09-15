import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SmartRemindersProps {
  warningOrange: string;
  textPrimary: string;
  reminderText: string;
}

export default function SmartReminders({
  warningOrange,
  textPrimary,
  reminderText,
}: SmartRemindersProps) {
  return (
    <View
      style={[
        styles.smartReminderCard,
        { backgroundColor: warningOrange + '10', borderColor: warningOrange + '30' },
      ]}
    >
      <Feather
        name="alert-circle"
        size={18}
        color={warningOrange}
        style={{ marginRight: 10 }}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.reminderText, { color: textPrimary }]}>
          {reminderText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  smartReminderCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
  },
  reminderText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16,
  },
});
