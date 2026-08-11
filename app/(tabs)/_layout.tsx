import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { localDb } from '@/app/services/localDb';
import FloatingAssistant from '@/components/FloatingAssistant';

export const DrawerContext = createContext({
  openDrawer: () => { },
  closeDrawer: () => { },
  isDrawerOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Aesthetic colors
  const primaryBrown = '#A97C50'; // GabAI Brown
  const successGreen = '#10B981';
  const errorRed = '#EF4444';
  const warningOrange = '#F59E0B';
  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';

  // Notes and Tasks dynamic counts
  const [notesCount, setNotesCount] = useState(() => localDb.getNotes().filter(n => !n.isArchived).length);
  const [tasksCount, setTasksCount] = useState(() => localDb.getTasks().filter(t => !t.completed).length);

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setNotesCount(localDb.getNotes().filter(n => !n.isArchived).length);
      setTasksCount(localDb.getTasks().filter(t => !t.completed).length);
    });
    return unsubscribe;
  }, []);

  // Drawer Animation State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.8;
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const handleNavigate = (route: string) => {
    closeDrawer();
    router.replace(route as any);
  };

  const handleLogout = () => {
    closeDrawer();
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of GabAi?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/(auth)/login/login') },
      ]
    );
  };

  // Helper to determine active state
  const isActiveRoute = (route: string) => {
    return pathname.includes(route);
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      <View style={{ flex: 1, backgroundColor: bgTheme }}>
        {/* Underlay Router Tabs Slots */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hides the bottom navigation bar completely
          }}
        >
          <Tabs.Screen name="dashboard/dashboard" />
          <Tabs.Screen name="calendar/calendar" />
          <Tabs.Screen name="tasks/task" />
          <Tabs.Screen name="notes/notes" />
          <Tabs.Screen name="expenses/expenses" />
          <Tabs.Screen name="profile/profile" />
        </Tabs>

        {/* Global Floating Virtual Assistant */}
        <FloatingAssistant />

        {/* Custom Drawer Overlay */}
        {isDrawerOpen && (
          <Pressable style={styles.backdrop} onPress={closeDrawer}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />
          </Pressable>
        )}

        <Animated.View
          style={[
            styles.drawerContainer,
            {
              width: drawerWidth,
              backgroundColor: cardBg,
              borderColor: borderCol,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>

            {/* 1. Profile Section */}
            <View style={[styles.profileSection, { borderBottomColor: borderCol }]}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, { backgroundColor: primaryBrown }]}>
                  <Text style={styles.avatarText}>SV</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: textPrimary }]}>Ruenz Vience</Text>
                  <Text style={[styles.profileCourse, { color: textSecondary }]}>BS Computer Science • Yr 4</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: successGreen }]} />
                    <Text style={[styles.statusText, { color: successGreen }]}>Offline Sync Active</Text>
                  </View>
                </View>
              </View>

              {/* Compact Academic Summary */}
              <View style={[styles.academicSummaryRow, { backgroundColor: bgTheme, borderColor: borderCol }]}>
                <View style={styles.summaryColumn}>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Sem</Text>
                  <Text style={[styles.summaryVal, { color: textPrimary }]}>1st</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderCol }]} />
                <View style={styles.summaryColumn}>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Streak</Text>
                  <Text style={[styles.summaryVal, { color: textPrimary }]}>5 Days</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderCol }]} />
                <View style={styles.summaryColumn}>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Done</Text>
                  <Text style={[styles.summaryVal, { color: textPrimary }]}>87%</Text>
                </View>
              </View>
            </View>

            {/* 2. Main Navigation Menu */}
            <View style={styles.menuSection}>
              <Text style={[styles.menuSectionHeader, { color: textSecondary }]}>WORKSPACE</Text>

              {/* Dashboard */}
              <TouchableOpacity
                style={[styles.menuItem, isActiveRoute('dashboard') && { backgroundColor: primaryBrown + '12' }]}
                onPress={() => handleNavigate('/(tabs)/dashboard/dashboard')}
              >
                <Feather name="grid" size={18} color={isActiveRoute('dashboard') ? primaryBrown : textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: isActiveRoute('dashboard') ? textPrimary : textSecondary, fontWeight: isActiveRoute('dashboard') ? '700' : '500' }]}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              {/* Task Manager */}
              <TouchableOpacity
                style={[styles.menuItem, isActiveRoute('tasks') && { backgroundColor: primaryBrown + '12' }]}
                onPress={() => handleNavigate('/(tabs)/tasks/task')}
              >
                <Feather name="check-square" size={18} color={isActiveRoute('tasks') ? primaryBrown : textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: isActiveRoute('tasks') ? textPrimary : textSecondary, fontWeight: isActiveRoute('tasks') ? '700' : '500' }]}>
                  Task Manager
                </Text>
                <View style={[styles.menuBadge, { backgroundColor: primaryBrown }]}>
                  <Text style={styles.menuBadgeText}>{tasksCount}</Text>
                </View>
              </TouchableOpacity>

              {/* Notes Workspace */}
              <TouchableOpacity
                style={[styles.menuItem, isActiveRoute('notes') && { backgroundColor: primaryBrown + '12' }]}
                onPress={() => handleNavigate('/(tabs)/notes/notes')}
              >
                <Feather name="file-text" size={18} color={isActiveRoute('notes') ? primaryBrown : textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: isActiveRoute('notes') ? textPrimary : textSecondary, fontWeight: isActiveRoute('notes') ? '700' : '500' }]}>
                  Notes Workspace
                </Text>
                <View style={[styles.menuBadge, { backgroundColor: primaryBrown }]}>
                  <Text style={styles.menuBadgeText}>{notesCount}</Text>
                </View>
              </TouchableOpacity>

              {/* Calendar */}
              <TouchableOpacity
                style={[styles.menuItem, isActiveRoute('calendar') && { backgroundColor: primaryBrown + '12' }]}
                onPress={() => handleNavigate('/(tabs)/calendar/calendar')}
              >
                <Feather name="calendar" size={18} color={isActiveRoute('calendar') ? primaryBrown : textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: isActiveRoute('calendar') ? textPrimary : textSecondary, fontWeight: isActiveRoute('calendar') ? '700' : '500' }]}>
                  Calendar
                </Text>
              </TouchableOpacity>

              {/* Expenses */}
              <TouchableOpacity
                style={[styles.menuItem, isActiveRoute('expenses') && { backgroundColor: primaryBrown + '12' }]}
                onPress={() => handleNavigate('/(tabs)/expenses/expenses')}
              >
                <Feather name="credit-card" size={18} color={isActiveRoute('expenses') ? primaryBrown : textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: isActiveRoute('expenses') ? textPrimary : textSecondary, fontWeight: isActiveRoute('expenses') ? '700' : '500' }]}>
                  Expenses (Wallet)
                </Text>
              </TouchableOpacity>

              {/* Focus Session */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { closeDrawer(); router.push('/productivity' as any); }}
              >
                <Feather name="target" size={18} color={textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: textSecondary }]}>Focus Session</Text>
              </TouchableOpacity>

              {/* Assistant Chat */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { closeDrawer(); router.push('/assistant'); }}
              >
                <Feather name="message-square" size={18} color={textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: textSecondary }]}>Virtual Assistant</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Quick Actions row of buttons */}
            <View style={styles.quickActionsSection}>
              <Text style={[styles.menuSectionHeader, { color: textSecondary, marginBottom: 8 }]}>QUICK ACTIONS</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: bgTheme, borderColor: borderCol }]} onPress={() => handleNavigate('/(tabs)/tasks/task')}>
                  <Feather name="plus" size={14} color={primaryBrown} />
                  <Text style={[styles.quickActionBtnText, { color: textPrimary }]}>Task</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: bgTheme, borderColor: borderCol }]} onPress={() => handleNavigate('/(tabs)/notes/notes')}>
                  <Feather name="edit-3" size={14} color={primaryBrown} />
                  <Text style={[styles.quickActionBtnText, { color: textPrimary }]}>Note</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: bgTheme, borderColor: borderCol }]} onPress={() => handleNavigate('/(tabs)/expenses/expenses')}>
                  <Feather name="dollar-sign" size={14} color={primaryBrown} />
                  <Text style={[styles.quickActionBtnText, { color: textPrimary }]}>Spend</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: bgTheme, borderColor: borderCol }]} onPress={() => handleNavigate('/(tabs)/calendar/calendar')}>
                  <Feather name="calendar" size={14} color={primaryBrown} />
                  <Text style={[styles.quickActionBtnText, { color: textPrimary }]}>Event</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Academic Shortcuts */}
            <View style={styles.shortcutsSection}>
              <Text style={[styles.menuSectionHeader, { color: textSecondary }]}>ACADEMIC SHORTCUTS</Text>
              <View style={styles.shortcutRow}>
                <View style={[styles.shortcutDot, { backgroundColor: warningOrange }]} />
                <Text style={[styles.shortcutText, { color: textSecondary }]}>Today&apos;s Classes: 2 Remaining</Text>
              </View>
              <View style={styles.shortcutRow}>
                <View style={[styles.shortcutDot, { backgroundColor: errorRed }]} />
                <Text style={[styles.shortcutText, { color: textSecondary }]}>Assignments Due Today: 3 Pending</Text>
              </View>
              <View style={styles.shortcutRow}>
                <View style={[styles.shortcutDot, { backgroundColor: successGreen }]} />
                <Text style={[styles.shortcutText, { color: textSecondary }]}>Upcoming Deadlines: 5 Sorted</Text>
              </View>
            </View>

            {/* 5. Productivity Summary Cards */}
            <View style={styles.productivitySummary}>
              <Text style={[styles.menuSectionHeader, { color: textSecondary, marginBottom: 8 }]}>DAILY SUMMARY</Text>
              <View style={[styles.progressCard, { backgroundColor: bgTheme, borderColor: borderCol }]}>
                <Text style={[styles.progressLabel, { color: textSecondary }]}>Today&apos;s Completion Rate</Text>
                <Text style={[styles.progressVal, { color: textPrimary }]}>87% Done</Text>
                <View style={[styles.miniProgressBg, { backgroundColor: borderCol }]}>
                  <View style={[styles.miniProgressFill, { backgroundColor: primaryBrown, width: '87%' }]} />
                </View>
              </View>
              <View style={[styles.progressCard, { backgroundColor: bgTheme, borderColor: borderCol, marginTop: 8 }]}>
                <Text style={[styles.progressLabel, { color: textSecondary }]}>Academic Pressure</Text>
                <Text style={[styles.pressureVal, { color: errorRed }]}>High Pressure</Text>
              </View>
            </View>

            {/* 6. Settings & Logout Footer */}
            <View style={[styles.footerSection, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                style={[styles.menuItem, isActiveRoute('profile') && { backgroundColor: primaryBrown + '12' }]}
                onPress={() => handleNavigate('/(tabs)/profile/profile')}
              >
                <Feather name="settings" size={16} color={isActiveRoute('profile') ? primaryBrown : textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: isActiveRoute('profile') ? textPrimary : textSecondary }]}>
                  Settings & Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Feather name="log-out" size={16} color={errorRed} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: errorRed }]}>Log Out</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  drawerContent: {
    paddingBottom: 40,
  },
  profileSection: {
    padding: 24,
    borderBottomWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileCourse: {
    fontSize: 11,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  academicSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    marginTop: 4,
  },
  summaryColumn: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 24,
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  menuBadge: {
    paddingHorizontal: 8,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    flexDirection: 'row',
    height: 34,
    borderWidth: 1,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  quickActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  shortcutsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginLeft: 12,
  },
  shortcutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  shortcutText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  productivitySummary: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  progressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 6,
  },
  miniProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  pressureVal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  footerSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
