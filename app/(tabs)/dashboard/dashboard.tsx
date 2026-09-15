import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';

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
} from './components';
import { useDashboardData } from './hooks/useDashboardData';
import { getPriorityColor, getTimelineIcon } from './utils/dashboardHelpers';
import { dashboardStyles as styles } from './styles/dashboard.styles';

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

  // Dashboard Data Hook
  const {
    greeting,
    focusTasks,
    deadlines,
    subjects,
    timelineItems,
    reminderText,
    insights,
    activities,
    pressure,
    overview,
    isRefreshing,
    onRefresh,
    handleToggleComplete,
  } = useDashboardData();

  const priorityColorHelper = (pr: DashboardTask['priority']) =>
    getPriorityColor(pr, { errorRed, warningOrange, successGreen });

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
        <SmartReminders reminderText={reminderText} warningOrange={warningOrange} textPrimary={textPrimary} />

        {/* 4. Academic Pressure Widget */}
        <AcademicPressure
          level={pressure.level}
          description={pressure.description}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          errorRed={errorRed}
          warningOrange={warningOrange}
          successGreen={successGreen}
          primaryBrown={primaryBrown}
        />

        {/* 5. Today's Focus Card */}
        <TodaysFocus
          tasks={focusTasks}
          onToggleComplete={handleToggleComplete}
          getPriorityColor={priorityColorHelper}
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
          tasksCount={overview.tasksToday}
          deadlinesCount={overview.deadlines}
          classesCount={overview.classesToday}
          weeklySpend={overview.weeklySpend}
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
          getPriorityColor={priorityColorHelper}
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
          insights={insights}
          cardBg={cardBg}
          borderCol={borderCol}
          textSecondary={textSecondary}
          successGreen={successGreen}
          warningOrange={warningOrange}
          primaryBrown={primaryBrown}
        />

        {/* 12. Recent Activity Stream */}
        <RecentActivity
          activities={activities}
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
