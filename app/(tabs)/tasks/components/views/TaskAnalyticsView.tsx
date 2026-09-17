import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TaskTheme } from '../../types';
import type { useTaskData } from '../../hooks/useTaskData';
import { taskStyles as styles } from '../../styles/task.styles';
import { todayISO, addDaysISO, getLastNDays } from '@/utils/date';

interface TaskAnalyticsViewProps {
  taskData: ReturnType<typeof useTaskData>;
  theme: TaskTheme;
}

export default function TaskAnalyticsView({ taskData, theme }: TaskAnalyticsViewProps) {
  const { tasks, totalTasks, completedTasks } = taskData;
  const { cardBg, borderCol, textPrimary, textSecondary, primaryBrown, successGreen } = theme;

  const today = todayISO();
  const weekAgo = addDaysISO(today, -7);
  const twoWeeksAgo = addDaysISO(today, -14);

  // Everything below is derived from the user's own tasks — no demo numbers.
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgDuration = totalTasks > 0 ? tasks.reduce((sum, t) => sum + t.duration, 0) / totalTasks : 0;

  const completedThisWeek = tasks.filter((t) => t.completed && t.dueDate > weekAgo && t.dueDate <= today).length;
  const completedLastWeek = tasks.filter((t) => t.completed && t.dueDate > twoWeeksAgo && t.dueDate <= weekAgo).length;
  const weeklyDelta =
    completedLastWeek === 0
      ? completedThisWeek > 0 ? 100 : 0
      : Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);

  // Completed tasks per day over the last 7 days (oldest first)
  const weeklyCompletion = getLastNDays(7, today).map((day) => ({
    day: day.label,
    count: tasks.filter((t) => t.completed && t.dueDate === day.full).length,
  }));
  const maxCount = Math.max(1, ...weeklyCompletion.map((d) => d.count));

  const highPriorityDone = tasks.filter((t) => t.completed && t.priority === 'High').length;
  const badges = [
    completedTasks >= 1 && {
      icon: 'zap' as const,
      color: primaryBrown,
      title: 'First Win',
      subtitle: `Completed ${completedTasks} task${completedTasks === 1 ? '' : 's'} so far.`,
    },
    highPriorityDone >= 3 && {
      icon: 'check-circle' as const,
      color: successGreen,
      title: 'Priority Crusher',
      subtitle: `Finished ${highPriorityDone} high priority tasks.`,
    },
    completionRate >= 80 && totalTasks >= 5 && {
      icon: 'award' as const,
      color: primaryBrown,
      title: 'Consistent',
      subtitle: `${completionRate}% of your tasks are done.`,
    },
  ].filter(Boolean) as { icon: 'zap' | 'check-circle' | 'award'; color: string; title: string; subtitle: string }[];

  return (
    <View style={styles.analyticsContainer}>
      {/* Metric widgets grid */}
      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Feather name="award" size={18} color={primaryBrown} />
          <Text style={[styles.analyticsNum, { color: textPrimary }]}>{completionRate}%</Text>
          <Text style={[styles.analyticsLabel, { color: textSecondary }]}>Completion Rate</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Feather name="clock" size={18} color={primaryBrown} />
          <Text style={[styles.analyticsNum, { color: textPrimary }]}>{avgDuration.toFixed(1)} hrs</Text>
          <Text style={[styles.analyticsLabel, { color: textSecondary }]}>Avg Task Duration</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Feather name="zap" size={18} color={primaryBrown} />
          <Text style={[styles.analyticsNum, { color: textPrimary }]}>
            {completedTasks}/{totalTasks}
          </Text>
          <Text style={[styles.analyticsLabel, { color: textSecondary }]}>Tasks Completed</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Feather name="trending-up" size={18} color={primaryBrown} />
          <Text style={[styles.analyticsNum, { color: textPrimary }]}>
            {weeklyDelta >= 0 ? '+' : ''}{weeklyDelta}%
          </Text>
          <Text style={[styles.analyticsLabel, { color: textSecondary }]}>vs Last Week</Text>
        </View>
      </View>

      {/* Weekly Activity Bar Chart */}
      <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <Text style={[styles.sectionHeadingTitle, { color: textPrimary, marginBottom: 16 }]}>
          📊 Weekly Task Completion
        </Text>
        <View style={styles.chartContainer}>
          {weeklyCompletion.map((bar, idx) => (
            <View key={idx} style={styles.chartBarCol}>
              <View style={styles.chartBarWrapper}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: `${bar.count === 0 ? 4 : Math.round((bar.count / maxCount) * 100)}%`,
                      backgroundColor: bar.count === 0 ? borderCol : primaryBrown,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartBarLabel, { color: textSecondary }]}>{bar.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <Text style={[styles.sectionHeadingTitle, { color: textPrimary, marginBottom: 12 }]}>
          🏆 Academic Badges
        </Text>
        {badges.length === 0 && (
          <Text style={{ fontSize: 13, color: textSecondary }}>
            Complete tasks to start earning badges.
          </Text>
        )}
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <View
              key={badge.title}
              style={[styles.badgeItemCard, { backgroundColor: cardBg, borderColor: borderCol }]}
            >
              <View style={[styles.badgeIconBg, { backgroundColor: badge.color + '15' }]}>
                <Feather name={badge.icon} size={18} color={badge.color} />
              </View>
              <Text style={[styles.badgeCardTitle, { color: textPrimary }]}>{badge.title}</Text>
              <Text style={[styles.badgeCardSubtitle, { color: textSecondary }]}>{badge.subtitle}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
