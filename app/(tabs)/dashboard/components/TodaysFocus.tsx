import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardTask } from './types';

interface TodaysFocusProps {
  tasks: DashboardTask[];
  onToggleComplete: (id: string) => void;
  getPriorityColor: (priority: DashboardTask['priority']) => string;
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  primaryBrown: string;
}

export default function TodaysFocus({
  tasks,
  onToggleComplete,
  getPriorityColor,
  cardBg,
  borderCol,
  textPrimary,
  textSecondary,
  primaryBrown,
}: TodaysFocusProps) {
  const router = useRouter();

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 12 }]}>
        ⭐️ Today&apos;s Focus
      </Text>
      {tasks.map((task) => (
        <View key={task.id} style={styles.focusTaskRow}>
          <TouchableOpacity
            onPress={() => onToggleComplete(task.id)}
            style={[
              styles.checkbox,
              {
                borderColor: borderCol,
                backgroundColor: task.completed ? primaryBrown + '12' : 'transparent',
              },
            ]}
          >
            {task.completed && <Feather name="check" size={14} color={primaryBrown} />}
          </TouchableOpacity>
          <View style={styles.focusTaskInfo}>
            <Text style={[styles.focusSubject, { color: primaryBrown }]}>{task.subject}</Text>
            <Text
              style={[
                styles.focusTitle,
                {
                  color: textPrimary,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <Text style={[styles.focusTime, { color: textSecondary }]}>
              Due at {task.dueTime} • {task.countdown}
            </Text>
          </View>
          <View
            style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]}
          />
        </View>
      ))}
      <TouchableOpacity
        style={[styles.viewAllTasksBtn, { borderColor: borderCol }]}
        onPress={() => router.push('/(tabs)/tasks/task')}
      >
        <Text style={[styles.viewAllTasksBtnText, { color: textPrimary }]}>View All Tasks</Text>
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
  focusTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEDEE20',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusTaskInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  focusSubject: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  focusTime: {
    fontSize: 11,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viewAllTasksBtn: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  viewAllTasksBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
