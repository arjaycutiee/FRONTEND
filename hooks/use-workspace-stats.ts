import { useEffect, useMemo, useState } from 'react';
import { localDb, Task, Note, CalendarEvent, Transaction } from '@/app/services/localDb';
import { todayISO, addDaysISO, daysAgoISO } from '@/utils/date';

export type PressureLevel = 'Light' | 'Moderate' | 'Heavy';

export interface WorkspaceStats {
  today: string;
  tasks: Task[];
  notes: Note[];
  events: CalendarEvent[];
  transactions: Transaction[];

  /** Tasks not yet completed. */
  activeTasks: Task[];
  /** Active tasks due today. */
  tasksDueToday: Task[];
  /** Active tasks whose due date has passed. */
  overdueTasks: Task[];
  /** Active tasks due within the next 7 days (today included), soonest first. */
  upcomingDeadlines: Task[];
  /** Tasks marked completed in the last 7 days (by createdAt as a proxy). */
  completedThisWeek: number;
  /** 0-100 across all tasks. */
  completionRate: number;
  /** 0-100 for tasks due today only. */
  todayCompletionRate: number;

  /** Today's events, sorted by time. */
  eventsToday: CalendarEvent[];
  /** Today's "Class" events that have not started yet. */
  classesRemainingToday: number;

  /** Sum of expenses in the last 7 days. */
  weeklySpend: number;

  /** Notes that are not archived. */
  activeNotesCount: number;

  pressure: { level: PressureLevel; description: string };
  /** Subject with the most remaining estimated hours, or null. */
  heaviestSubject: string | null;
}

function computePressure(activeTasks: Task[], overdue: number): WorkspaceStats['pressure'] {
  const highPriority = activeTasks.filter((t) => t.priority === 'High').length;
  const total = activeTasks.length;
  if (total === 0) {
    return { level: 'Light', description: 'No pending tasks. Great time to plan ahead or take a break.' };
  }
  if (overdue > 0 || total >= 6 || highPriority >= 3) {
    return {
      level: 'Heavy',
      description: `You have ${total} pending task${total === 1 ? '' : 's'}${overdue > 0 ? `, ${overdue} overdue` : ''}${highPriority > 0 ? ` and ${highPriority} high priority` : ''}. Tackle the most urgent ones first.`,
    };
  }
  if (total >= 3 || highPriority >= 1) {
    return {
      level: 'Moderate',
      description: `You have ${total} pending task${total === 1 ? '' : 's'}. Steady daily progress will keep this manageable.`,
    };
  }
  return { level: 'Light', description: `Only ${total} pending task${total === 1 ? '' : 's'}. Your workload is well under control.` };
}

function nowHHMM(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Live, derived numbers for the dashboard and drawer — all computed from
 * `localDb`, nothing hardcoded. Re-computes whenever the store changes.
 */
export function useWorkspaceStats(): WorkspaceStats {
  const [snapshot, setSnapshot] = useState(() => ({
    tasks: localDb.getTasks(),
    notes: localDb.getNotes(),
    events: localDb.getEvents(),
    transactions: localDb.getTransactions(),
  }));

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setSnapshot({
        tasks: localDb.getTasks(),
        notes: localDb.getNotes(),
        events: localDb.getEvents(),
        transactions: localDb.getTransactions(),
      });
    });
    return unsubscribe;
  }, []);

  return useMemo(() => {
    const { tasks, notes, events, transactions } = snapshot;
    const today = todayISO();
    const weekAhead = addDaysISO(today, 7);
    const weekAgo = daysAgoISO(7);

    const activeTasks = tasks.filter((t) => !t.completed);
    const tasksDueToday = activeTasks.filter((t) => t.dueDate === today);
    const overdueTasks = activeTasks.filter((t) => t.dueDate < today);
    const upcomingDeadlines = activeTasks
      .filter((t) => t.dueDate >= today && t.dueDate <= weekAhead)
      .sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime));

    const allDueToday = tasks.filter((t) => t.dueDate === today);
    const completionRate = tasks.length ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0;
    const todayCompletionRate = allDueToday.length
      ? Math.round((allDueToday.filter((t) => t.completed).length / allDueToday.length) * 100)
      : 0;

    const completedThisWeek = tasks.filter((t) => t.completed && t.dueDate >= weekAgo && t.dueDate <= today).length;

    const eventsToday = events.filter((e) => e.date === today).sort((a, b) => a.time.localeCompare(b.time));
    const now = nowHHMM();
    const classesRemainingToday = eventsToday.filter((e) => e.category === 'Class' && e.time >= now).length;

    const weeklySpend = transactions
      .filter((tx) => tx.type === 'expense' && tx.date >= weekAgo && tx.date <= today)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const activeNotesCount = notes.filter((n) => !n.isArchived).length;

    const hoursBySubject = new Map<string, number>();
    activeTasks.forEach((t) => hoursBySubject.set(t.subject, (hoursBySubject.get(t.subject) ?? 0) + t.duration));
    let heaviestSubject: string | null = null;
    let maxHours = 0;
    hoursBySubject.forEach((hours, subject) => {
      if (hours > maxHours) {
        maxHours = hours;
        heaviestSubject = subject;
      }
    });

    return {
      today,
      tasks,
      notes,
      events,
      transactions,
      activeTasks,
      tasksDueToday,
      overdueTasks,
      upcomingDeadlines,
      completedThisWeek,
      completionRate,
      todayCompletionRate,
      eventsToday,
      classesRemainingToday,
      weeklySpend,
      activeNotesCount,
      pressure: computePressure(activeTasks, overdueTasks.length),
      heaviestSubject,
    };
  }, [snapshot]);
}
