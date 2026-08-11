import { useColorScheme } from '@/hooks/use-color-scheme';
import { NotesTheme } from '../types';

export function useNotesTheme(): NotesTheme {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    primaryBrown: '#A97C50',
    successGreen: '#10B981',
    bgTheme: isDark ? '#121212' : '#FFFFFF',
    textPrimary: isDark ? '#ECEDEE' : '#11181C',
    textSecondary: isDark ? '#9BA1A6' : '#666666',
    cardBg: isDark ? '#1E1E1E' : '#F8FAFC',
    borderCol: isDark ? '#2A2A2A' : '#E2E8F0',
    inputBg: isDark ? '#1A1A1A' : '#F1F5F9',
  };
}
