import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { localDb, CurrentUser } from '@/app/services/localDb';
import { UserProfile, ProfileStatItem } from '../types';

/** Build display initials from a full name, e.g. "Juan Dela Cruz" -> "JD". */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Map the signed-in account (or none) to what the profile card displays. */
function toUserProfile(user: CurrentUser | null): UserProfile {
  if (!user) {
    return { name: 'Guest', email: 'Not signed in', course: 'Student', initials: '?' };
  }
  return {
    name: user.name,
    email: user.email,
    course: user.course || 'Student',
    initials: getInitials(user.name),
  };
}

export function useProfileData() {
  const router = useRouter();

  // Sync state from central database
  const [userProfile, setUserProfile] = useState<UserProfile>(() => toUserProfile(localDb.getCurrentUser()));
  const [tasks, setTasks] = useState(() => localDb.getTasks());
  const [events, setEvents] = useState(() => localDb.getEvents());
  const [transactions, setTransactions] = useState(() => localDb.getTransactions());

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setUserProfile(toUserProfile(localDb.getCurrentUser()));
      setTasks(localDb.getTasks());
      setEvents(localDb.getEvents());
      setTransactions(localDb.getTransactions());
    });
    return unsubscribe;
  }, []);

  // Compute live stats
  const completedTasksCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const eventsCount = useMemo(() => events.length, [events]);

  const walletBalance = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    return income - expense;
  }, [transactions]);

  const stats: ProfileStatItem[] = useMemo(
    () => [
      {
        id: 'tasks',
        label: 'Tasks Done',
        value: completedTasksCount.toString(),
        icon: 'check-square',
      },
      {
        id: 'events',
        label: 'Events',
        value: eventsCount.toString(),
        icon: 'calendar',
      },
      {
        id: 'budget',
        label: 'Budget',
        value: `₱${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: 'credit-card',
      },
    ],
    [completedTasksCount, eventsCount, walletBalance]
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of GabAi?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            localDb.clearCurrentUser();
            router.replace('/(auth)/login/login');
          },
        },
      ],
      { cancelable: true }
    );
  }, [router]);

  return {
    userProfile,
    stats,
    handleLogout,
  };
}
