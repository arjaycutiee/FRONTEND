import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
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
                styles.priorityDot,
                {
                  backgroundColor: getPriorityColor(
                    task.priority
                  ),
                },
              ]}
            />
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Feather
            name="check-circle"
            size={16}
            color={primaryBrown}
          />

          <Text
            style={[
              styles.emptyText,
              { color: textSecondary },
            ]}
          >
            You're all caught up
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },

  header: {
    height: 46,
    paddingHorizontal: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
  },

  taskRow: {
    minHeight: 56,
    paddingHorizontal: 15,

    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,

    alignItems: 'center',
    justifyContent: 'center',
  },

  taskInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },

  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
  },

  taskTime: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },

  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  emptyState: {
    height: 50,
    paddingHorizontal: 15,

    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 8,
  },
});