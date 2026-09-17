import { useState, useEffect, useCallback, useMemo } from 'react';
import { localDb } from '@/app/services/localDb';
import { useWorkspaceStats } from '@/hooks/use-workspace-stats';
import { getCountdownLabel, formatTime12h } from '@/utils/date';
import { DashboardTask, DashboardDeadline, DashboardSubject, DashboardTimelineItem } from '../types';

export interface DashboardInsight {
  icon: 'check' | 'trending-up' | 'check-circle' | 'alert-circle' | 'info';
  tone: 'success' | 'accent' | 'warning';
  text: string;
}

export interface DashboardActivity {
  icon: 'check-square' | 'dollar-sign' | 'calendar' | 'file-text';
  text: string;
  /** Epoch ms, used for sorting. */
  at: number;
}

export function useDashboardData() {
  const stats = useWorkspaceStats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Hello');

  // Dynamic Greeting based on current hour
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Today's Focus: tasks due today plus any high-priority active task
  const focusTasks: DashboardTask[] = useMemo(
    () =>
      stats.tasks
        .filter((t) => t.dueDate === stats.today || (t.priority === 'High' && !t.completed))
        .sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime))
        .map((t) => ({
          id: t.id,
          subject: t.subject,
          title: t.title,
          dueTime: t.dueTime,
          priority: t.priority,
          countdown: getCountdownLabel(t.dueDate, stats.today),
          completed: t.completed,
        })),
    [stats.tasks, stats.today]
  );

  // Upcoming deadlines: active tasks in the next 7 days
  const deadlines: DashboardDeadline[] = useMemo(
    () =>
      stats.upcomingDeadlines.slice(0, 5).map((t) => {
        const total = t.subTasks.length;
        const done = t.subTasks.filter((s) => s.completed).length;
        return {
          id: t.id,
          subject: t.subject,
          assignment: t.title,
          countdown: getCountdownLabel(t.dueDate, stats.today),
          priority: t.priority,
          completion: total ? Math.round((done / total) * 100) : 0,
        };
      }),
    [stats.upcomingDeadlines, stats.today]
  );

  // Subject progress: group all tasks by subject
  const subjects: DashboardSubject[] = useMemo(() => {
    const bySubject = new Map<string, { pending: number; completed: number; nextExam: string | null }>();
    stats.tasks.forEach((t) => {
      const entry = bySubject.get(t.subject) ?? { pending: 0, completed: 0, nextExam: null };
      if (t.completed) entry.completed += 1;
      else entry.pending += 1;
      if (t.category === 'Exams' && !t.completed && t.dueDate >= stats.today) {
        if (!entry.nextExam || t.dueDate < entry.nextExam) entry.nextExam = t.dueDate;
      }
      bySubject.set(t.subject, entry);
    });
    return Array.from(bySubject.entries())
      .map(([name, e]) => {
        const total = e.pending + e.completed;
        return {
          name,
          pending: e.pending,
          completed: e.completed,
          quiz: e.nextExam ? `Exam ${getCountdownLabel(e.nextExam, stats.today).toLowerCase()}` : 'None scheduled',
          projectStatus: e.pending > 0 ? 'In progress' : 'Up to date',
          completion: total ? Math.round((e.completed / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.pending - a.pending);
  }, [stats.tasks, stats.today]);

  // Today's schedule: today's events + today's tasks merged by time
  const timelineItems: DashboardTimelineItem[] = useMemo(() => {
    const eventItems = stats.eventsToday.map((e) => ({
      sortKey: e.time,
      time: formatTime12h(e.time),
      type: (e.category === 'Class' ? 'class' : 'event') as DashboardTimelineItem['type'],
      title: e.title,
    }));
    const taskItems = stats.tasks
      .filter((t) => t.dueDate === stats.today)
      .map((t) => ({
        sortKey: t.dueTime,
        time: formatTime12h(t.dueTime),
        type: 'task' as DashboardTimelineItem['type'],
        title: t.title,
        status: t.completed ? 'Done' : 'Pending',
        deadline: formatTime12h(t.dueTime),
      }));
    return [...eventItems, ...taskItems]
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _sortKey, ...item }) => item);
  }, [stats.eventsToday, stats.tasks, stats.today]);

  // Smart reminder: the next thing due today, if any
  const reminderText = useMemo(() => {
    if (stats.overdueTasks.length > 0) {
      const n = stats.overdueTasks.length;
      return `You have ${n} overdue task${n === 1 ? '' : 's'}. Reschedule or finish ${n === 1 ? 'it' : 'them'} to stay on track.`;
    }
    if (stats.tasksDueToday.length > 0) {
      const next = [...stats.tasksDueToday].sort((a, b) => a.dueTime.localeCompare(b.dueTime))[0];
      return `"${next.title}" is due today at ${formatTime12h(next.dueTime)}.`;
    }
    if (stats.eventsToday.length > 0) {
      const next = stats.eventsToday[0];
      return `Next up today: ${next.title} at ${formatTime12h(next.time)}.`;
    }
    return 'Nothing due today. Add a task or event to get started.';
  }, [stats.overdueTasks, stats.tasksDueToday, stats.eventsToday]);

  // Productivity insights
  const insights: DashboardInsight[] = useMemo(() => {
    const list: DashboardInsight[] = [];
    list.push({
      icon: 'check',
      tone: 'success',
      text:
        stats.completedThisWeek > 0
          ? `You completed ${stats.completedThisWeek} task${stats.completedThisWeek === 1 ? '' : 's'} this week.`
          : 'No tasks completed yet this week.',
    });
    if (stats.heaviestSubject) {
      list.push({ icon: 'trending-up', tone: 'accent', text: `${stats.heaviestSubject} has the highest remaining workload.` });
    }
    list.push(
      stats.overdueTasks.length === 0
        ? { icon: 'check-circle', tone: 'success', text: 'You have no overdue assignments.' }
        : {
            icon: 'alert-circle',
            tone: 'warning',
            text: `${stats.overdueTasks.length} assignment${stats.overdueTasks.length === 1 ? ' is' : 's are'} overdue.`,
          }
    );
    return list;
  }, [stats.completedThisWeek, stats.heaviestSubject, stats.overdueTasks]);

  // Recent activity: newest items across the store
  const activities: DashboardActivity[] = useMemo(() => {
    const items: DashboardActivity[] = [];
    stats.tasks.forEach((t) =>
      items.push({ icon: 'check-square', at: t.createdAt, text: `${t.completed ? 'Completed' : 'Added'} task "${t.title}".` })
    );
    stats.notes.forEach((n) => items.push({ icon: 'file-text', at: n.updatedAt, text: `Updated note "${n.title}".` }));
    return items.sort((a, b) => b.at - a.at).slice(0, 3);
  }, [stats.tasks, stats.notes]);

  const handleToggleComplete = useCallback((id: string) => {
    localDb.toggleTaskCompleted(id);
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  return {
    greeting,
    focusTasks,
    deadlines,
    subjects,
    timelineItems,
    reminderText,
    insights,
    activities,
    pressure: stats.pressure,
    overview: {
      tasksToday: stats.tasksDueToday.length,
      deadlines: stats.upcomingDeadlines.length,
      classesToday: stats.eventsToday.filter((e) => e.category === 'Class').length,
      weeklySpend: `₱${stats.weeklySpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    },
    isRefreshing,
    onRefresh,
    handleToggleComplete,
  };
}
