import { useEffect, useState } from 'react';
import { localDb, CurrentUser } from '@/app/services/localDb';

/** Build display initials from a full name, e.g. "Juan Dela Cruz" -> "JD". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export interface CurrentUserView {
  /** Raw account, or null when nobody is signed in. */
  user: CurrentUser | null;
  /** Full display name ("Guest" when signed out). */
  name: string;
  /** First word of the name, for greetings. */
  firstName: string;
  email: string;
  course: string;
  initials: string;
  isSignedIn: boolean;
}

function toView(user: CurrentUser | null): CurrentUserView {
  if (!user) {
    return {
      user: null,
      name: 'Guest',
      firstName: 'there',
      email: 'Not signed in',
      course: 'Student',
      initials: '?',
      isSignedIn: false,
    };
  }
  const name = user.name.trim() || user.email.split('@')[0];
  return {
    user,
    name,
    firstName: name.split(/\s+/)[0],
    email: user.email,
    course: user.course || 'Student',
    initials: getInitials(name),
    isSignedIn: true,
  };
}

/**
 * The signed-in account, kept in sync with `localDb`.
 * Use this anywhere the UI shows who is logged in (drawer, dashboard
 * greeting, profile card) instead of hardcoding a name.
 */
export function useCurrentUser(): CurrentUserView {
  const [view, setView] = useState<CurrentUserView>(() => toView(localDb.getCurrentUser()));

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setView(toView(localDb.getCurrentUser()));
    });
    return unsubscribe;
  }, []);

  return view;
}
