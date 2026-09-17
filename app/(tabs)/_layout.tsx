import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
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
import { useCurrentUser } from '@/hooks/use-current-user';
import { useWorkspaceStats } from '@/hooks/use-workspace-stats';
import FloatingAssistant from '@/components/FloatingAssistant';

export const DrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // Theme
 const colorScheme = useColorScheme() ?? 'light';
const theme =
  colorScheme === 'dark'
    ? Colors.dark
    : Colors.light;

const primaryBrown = '#A97C50';
const successGreen = '#10B981';
const errorRed = '#EF4444';

const bgTheme = theme.background;
const textPrimary = theme.text;
const textSecondary = theme.icon;

const cardBg =
  colorScheme === 'dark'
    ? '#1E1E1E'
    : '#F8FAFC';

const borderCol =
  colorScheme === 'dark'
    ? '#2E2E2E'
    : '#E2E8F0';

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

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.78;

  const slideAnim = useRef(
    new Animated.Value(-drawerWidth)
  ).current;

  const openDrawer = () => {
    setIsDrawerOpen(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -drawerWidth,
      duration: 180,
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

  const isActiveRoute = (route: string) =>
    pathname.includes(route);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'grid' as const,
      route: '/(tabs)/dashboard/dashboard',
      active: isActiveRoute('dashboard'),
    },
    {
      label: 'Task Manager',
      icon: 'check-square' as const,
      route: '/(tabs)/tasks/task',
      active: isActiveRoute('tasks'),
      badge: tasksCount,
    },
    {
      label: 'Notes',
      icon: 'file-text' as const,
      route: '/(tabs)/notes/notes',
      active: isActiveRoute('notes'),
      badge: notesCount,
    },
    {
      label: 'Calendar',
      icon: 'calendar' as const,
      route: '/(tabs)/calendar/calendar',
      active: isActiveRoute('calendar'),
    },
    {
      label: 'Expenses',
      icon: 'credit-card' as const,
      route: '/(tabs)/expenses/expenses',
      active: isActiveRoute('expenses'),
    },
    {
      label: 'Focus Session',
      icon: 'target' as const,
      route: '/productivity',
      active: pathname.includes('productivity'),
    },
    {
      label: 'Virtual Assistant',
      icon: 'message-square' as const,
      route: '/assistant',
      active: pathname.includes('assistant'),
    },
  ];

  return (
    <DrawerContext.Provider
      value={{
        openDrawer,
        closeDrawer,
        isDrawerOpen,
      }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: bgTheme,
          },
        ]}
      >
        {/* Tabs */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              display: 'none',
            },
          }}
        >
          <Tabs.Screen name="dashboard/dashboard" />
          <Tabs.Screen name="calendar/calendar" />
          <Tabs.Screen name="tasks/task" />
          <Tabs.Screen name="notes/notes" />
          <Tabs.Screen name="expenses/expenses" />
          <Tabs.Screen name="profile/profile" />
        </Tabs>

        <FloatingAssistant />

        {/* Backdrop */}
        {isDrawerOpen && (
          <Pressable
            style={styles.backdrop}
            onPress={closeDrawer}
          >
            <View
              style={[
                styles.backdropOverlay,
                {
                  backgroundColor:
                    'rgba(0, 0, 0, 0.4)',
                },
              ]}
            />
          </Pressable>
        )}

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              backgroundColor: cardBg,
              borderColor: borderCol,
              transform: [
                {
                  translateX: slideAnim,
                },
              ],
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

            {/* Navigation */}
            <View style={styles.navigation}>
              <Text
                style={[
                  styles.sectionLabel,
                  {
                    color: textSecondary,
                  },
                ]}
              >
                MENU
              </Text>

              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleNavigate(item.route)
                  }
                  style={[
                    styles.menuItem,
                    item.active && {
                      backgroundColor:
                        `${primaryBrown}12`,
                    },
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={17}
                    color={
                      item.active
                        ? primaryBrown
                        : textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.menuText,
                      {
                        color: item.active
                          ? textPrimary
                          : textSecondary,
                        fontWeight: item.active
                          ? '700'
                          : '500',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>

                  {item.badge !== undefined &&
                    item.badge > 0 && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              primaryBrown,
                          },
                        ]}
                      >
                        <Text
                          style={styles.badgeText}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: borderCol,
                },
              ]}
            >
              {/* Settings */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleNavigate(
                    '/(tabs)/profile/profile'
                  )
                }
                style={styles.footerItem}
              >
                <Feather
                  name="settings"
                  size={17}
                  color={
                    isActiveRoute('profile')
                      ? primaryBrown
                      : textSecondary
                  }
                />

                <Text
                  style={[
                    styles.menuText,
                    {
                      color: isActiveRoute(
                        'profile'
                      )
                        ? textPrimary
                        : textSecondary,
                    },
                  ]}
                >
                  Settings & Profile
                </Text>
              </TouchableOpacity>

              {/* Logout */}
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
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },

  backdropOverlay: {
    flex: 1,
  },

  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,

    borderRightWidth: 1,

    zIndex: 1000,

    shadowColor: '#000',
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,

    elevation: 10,
  },

  drawerContent: {
    paddingBottom: 24,
  },

  /* Profile */

  profile: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,

    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 15,
    fontWeight: '700',
  },

  profileCourse: {
    fontSize: 10,
    marginTop: 2,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },

  /* Navigation */

  navigation: {
    paddingHorizontal: 14,
    paddingTop: 20,
  },

  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,

    marginLeft: 11,
    marginBottom: 7,
  },

  menuItem: {
    height: 42,
    borderRadius: 10,

    paddingHorizontal: 11,

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 3,
  },

  menuText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 11,
  },

  badge: {
    minWidth: 19,
    height: 19,

    paddingHorizontal: 5,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  /* Footer */

  footer: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingTop: 14,

    borderTopWidth: 1,
  },

  footerItem: {
    height: 42,
    paddingHorizontal: 11,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 10,
  },
});