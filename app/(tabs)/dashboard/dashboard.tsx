import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';
import { localDb } from '@/app/services/localDb';

import {
  DashboardHeader,
  QuickActions,
  SmartReminders,
  AcademicPressure,
  TodaysFocus,
  QuickOverview,
  TodaysSchedule,
  FocusSessionWidget,
  UpcomingDeadlines,
  SubjectProgress,
  ProductivityInsights,
  RecentActivity,
  Footer,
  DashboardTask,
  DashboardDeadline,
  DashboardSubject,
  DashboardTimelineItem,
} from './components';

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Theme Colors
  const primaryBrown = '#A97C50'; // GabAI Brown
  const successGreen = '#10B981';
  const errorRed = '#EF4444';
  const warningOrange = '#F59E0B';
  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';

  // Drawer
  const { openDrawer } = useDrawer();

  // Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic Greeting based on current hour
  const [greeting, setGreeting] = useState('Hello');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Today's Focus State loaded from central database
  const [focusTasks, setFocusTasks] = useState<DashboardTask[]>(() =>
    localDb
      .getTasks()
      .filter((t) => t.dueDate === '2026-07-26' || t.priority === 'High')
      .map((t) => ({
        id: t.id,
        subject: t.subject,
        title: t.title,
        dueTime: t.dueTime,
        priority: t.priority,
        countdown: t.dueDate === '2026-07-26' ? 'Today' : 'Upcoming',
        completed: t.completed,
      }))
  );

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setFocusTasks(
        localDb
          .getTasks()
          .filter((t) => t.dueDate === '2026-07-26' || t.priority === 'High')
          .map((t) => ({
            id: t.id,
            subject: t.subject,
            title: t.title,
            dueTime: t.dueTime,
            priority: t.priority,
            countdown: t.dueDate === '2026-07-26' ? 'Today' : 'Upcoming',
            completed: t.completed,
          }))
      );
    });
    return unsubscribe;
  }, []);

  // Upcoming Deadlines (sorted by urgency)
  const deadlines: DashboardDeadline[] = [
    {
      id: '1',
      subject: 'Capstone Paper',
      assignment: 'Methodology Outline Draft',
      countdown: '3 hours left',
      priority: 'High',
      completion: 80,
    },
    {
      id: '2',
      subject: 'Economics',
      assignment: 'Fiscal Policy Exercise',
      countdown: '1 day left',
      priority: 'High',
      completion: 60,
    },
    {
      id: '3',
      subject: 'Technopreneurship',
      assignment: 'Competitor Analysis Deck',
      countdown: '2 days left',
      priority: 'Medium',
      completion: 40,
    },
    {
      id: '4',
      subject: 'Ethics',
      assignment: 'Case Study Essay 2',
      countdown: '4 days left',
      priority: 'Low',
      completion: 10,
    },
    {
      id: '5',
      subject: 'Database Systems',
      assignment: 'Normalization Lab 3',
      countdown: '5 days left',
      priority: 'Medium',
      completion: 0,
    },
  ];

  // Subject Workload
  const subjects: DashboardSubject[] = [
    {
      name: 'Capstone Paper',
      pending: 3,
      completed: 5,
      quiz: 'Final Defense Aug 3',
      projectStatus: 'Drafting methodology',
      completion: 62,
    },
    {
      name: 'Economics',
      pending: 2,
      completed: 3,
      quiz: 'Quiz 2 Monday',
      projectStatus: 'N/A',
      completion: 60,
    },
    {
      name: 'Technopreneurship',
      pending: 1,
      completed: 4,
      quiz: 'Pitching Friday',
      projectStatus: 'Prototype stage',
      completion: 80,
    },
    {
      name: 'Ethics',
      pending: 1,
      completed: 2,
      quiz: 'None Scheduled',
      projectStatus: 'N/A',
      completion: 66,
    },
  ];

  // Mixed Chronological Timeline
  const timelineItems: DashboardTimelineItem[] = [
    { time: '09:00 AM', type: 'class', title: 'Economics Lecture' },
    { time: '11:00 AM', type: 'event', title: 'Group Study Session at Library' },
    { time: '01:30 PM', type: 'class', title: 'Technopreneurship Lab' },
    { time: '04:00 PM', type: 'task', title: 'Review Economics Chapter 5 Formulas', status: 'Pending', deadline: '4:00 PM' },
    { time: '08:00 PM', type: 'reminder', title: 'Log budget expenses for today' },
  ];

  const handleToggleComplete = (id: string) => {
    localDb.toggleTaskCompleted(id);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getPriorityColor = (pr: DashboardTask['priority']) => {
    switch (pr) {
      case 'High':
        return errorRed;
      case 'Medium':
        return warningOrange;
      case 'Low':
        return successGreen;
    }
  };

  const getTimelineIcon = (type: DashboardTimelineItem['type']) => {
    switch (type) {
      case 'class':
        return 'book-open';
      case 'task':
        return 'check-square';
      case 'event':
        return 'users';
      case 'reminder':
        return 'bell';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* 1. Header Bar */}
      <DashboardHeader
        greeting={greeting}
        onOpenDrawer={openDrawer}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[primaryBrown]}
          />
        }
      >
        {/* 2. Quick Actions */}
        <QuickActions primaryBrown={primaryBrown} borderCol={borderCol} />

        {/* 3. Smart Reminders */}
        <SmartReminders warningOrange={warningOrange} textPrimary={textPrimary} />

        {/* 4. Academic Pressure Widget */}
        <AcademicPressure
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          errorRed={errorRed}
          primaryBrown={primaryBrown}
        />

        {/* 5. Today's Focus Card */}
        <TodaysFocus
          tasks={focusTasks}
          onToggleComplete={handleToggleComplete}
          getPriorityColor={getPriorityColor}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryBrown={primaryBrown}
        />

        {/* 6. Quick Overview Stats Grid */}
        <QuickOverview
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          tasksCount={4}
          deadlinesCount={5}
          classesCount={2}
          weeklySpend="₱1,250"
        />

        {/* 7. Today's Schedule Timeline */}
        <TodaysSchedule
          items={timelineItems}
          getTimelineIcon={getTimelineIcon}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryBrown={primaryBrown}
        />

        {/* 8. Focus Session Compact Widget */}
        <FocusSessionWidget
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryBrown={primaryBrown}
        />

        {/* 9. Upcoming Deadlines */}
        <UpcomingDeadlines
          deadlines={deadlines}
          getPriorityColor={getPriorityColor}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryBrown={primaryBrown}
        />

        {/* 10. Subject Progress */}
        <SubjectProgress
          subjects={subjects}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryBrown={primaryBrown}
        />

        {/* 11. Productivity Insights */}
        <ProductivityInsights
          cardBg={cardBg}
          borderCol={borderCol}
          textSecondary={textSecondary}
          successGreen={successGreen}
          primaryBrown={primaryBrown}
        />

        {/* 12. Recent Activity Stream */}
        <RecentActivity
          cardBg={cardBg}
          borderCol={borderCol}
          textSecondary={textSecondary}
          primaryBrown={primaryBrown}
        />

        {/* 13. Footer */}
        <Footer textSecondary={textSecondary} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
