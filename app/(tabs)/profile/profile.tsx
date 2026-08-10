import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Aesthetic color palette matching calendar/login
  const primaryAccent = '#A97C50'; // GabAI Brown
  const errorRed = '#EF4444';
  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const textTheme = isDark ? '#ECEDEE' : '#11181C';
  const textSubTheme = isDark ? '#9BA1A6' : '#666666';
  const cardTheme = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderTheme = isDark ? '#2E2E2E' : '#E2E8F0';

  // Handle Logout
  const handleLogout = () => {
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
            // Replace navigation history and direct the user to the login screen
            router.replace('/(auth)/login/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openDrawer} style={{ marginRight: 10, padding: 4 }}>
            <Feather name="menu" size={24} color={textTheme} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textTheme }]}>Profile</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
          <View style={[styles.avatarContainer, { backgroundColor: primaryAccent }]}>
            <Text style={styles.avatarText}>SV</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: textTheme }]}>Ruenz Vience B. Baylosis</Text>
            <Text style={[styles.userEmail, { color: textSubTheme }]}>vience@gabai.edu.ph</Text>
            <View style={[styles.badge, { backgroundColor: primaryAccent + '15' }]}>
              <Text style={[styles.badgeText, { color: primaryAccent }]}>BS in Computer Science</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <Feather name="check-square" size={20} color={primaryAccent} />
            <Text style={[styles.statNumber, { color: textTheme }]}>12</Text>
            <Text style={[styles.statLabel, { color: textSubTheme }]}>Tasks Done</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <Feather name="calendar" size={20} color={primaryAccent} />
            <Text style={[styles.statNumber, { color: textTheme }]}>5</Text>
            <Text style={[styles.statLabel, { color: textSubTheme }]}>Events</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <Feather name="credit-card" size={20} color={primaryAccent} />
            <Text style={[styles.statNumber, { color: textTheme }]}>₱1,250</Text>
            <Text style={[styles.statLabel, { color: textSubTheme }]}>Budget</Text>
          </View>
        </View>

        {/* Settings Groups */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionHeader, { color: textSubTheme }]}>ACADEMIC SUMMARY</Text>
          <View style={[styles.settingsGroup, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconBg, { backgroundColor: primaryAccent + '15' }]}>
                  <FontAwesome5 name="graduation-cap" size={14} color={primaryAccent} />
                </View>
                <Text style={[styles.settingsItemText, { color: textTheme }]}>Academic Progress</Text>
              </View>
              <Feather name="chevron-right" size={18} color={textSubTheme} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: borderTheme }]} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconBg, { backgroundColor: primaryAccent + '15' }]}>
                  <Feather name="award" size={16} color={primaryAccent} />
                </View>
                <Text style={[styles.settingsItemText, { color: textTheme }]}>Grades & Achievements</Text>
              </View>
              <Feather name="chevron-right" size={18} color={textSubTheme} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionHeader, { color: textSubTheme }]}>PREFERENCES</Text>
          <View style={[styles.settingsGroup, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconBg, { backgroundColor: primaryAccent + '15' }]}>
                  <Feather name="bell" size={16} color={primaryAccent} />
                </View>
                <Text style={[styles.settingsItemText, { color: textTheme }]}>Notification Settings</Text>
              </View>
              <Feather name="chevron-right" size={18} color={textSubTheme} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: borderTheme }]} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconBg, { backgroundColor: primaryAccent + '15' }]}>
                  <Feather name="lock" size={16} color={primaryAccent} />
                </View>
                <Text style={[styles.settingsItemText, { color: textTheme }]}>Privacy & Security</Text>
              </View>
              <Feather name="chevron-right" size={18} color={textSubTheme} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: errorRed }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={errorRed} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutButtonText, { color: errorRed }]}>Log Out of GabAi</Text>
        </TouchableOpacity>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textSubTheme }]}>GabAi App v1.0.0</Text>
          <Text style={[styles.footerText, { color: textSubTheme, marginTop: 4 }]}>
            Offline Student Productivity Platform
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    width: '100%',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  footerText: {
    fontSize: 12,
  },
});
