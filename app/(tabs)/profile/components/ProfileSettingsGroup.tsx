import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { profileStyles as styles } from '../styles/profile.styles';
import { SettingSection } from '../types';

const PROFILE_SECTIONS: SettingSection[] = [
  {
    id: 'academic',
    title: 'ACADEMIC SUMMARY',
    items: [
      { id: 'academic_progress', title: 'Academic Progress', icon: 'graduation-cap', iconType: 'fontawesome' },
      { id: 'grades', title: 'Grades & Achievements', icon: 'award', iconType: 'feather' },
    ],
  },
  {
    id: 'preferences',
    title: 'PREFERENCES',
    items: [
      { id: 'notifications', title: 'Notification Settings', icon: 'bell', iconType: 'feather' },
      { id: 'privacy', title: 'Privacy & Security', icon: 'lock', iconType: 'feather' },
    ],
  },
];

interface ProfileSettingsGroupProps {
  cardTheme: string;
  borderTheme: string;
  textTheme: string;
  textSubTheme: string;
  primaryAccent: string;
}

export default function ProfileSettingsGroup({
  cardTheme,
  borderTheme,
  textTheme,
  textSubTheme,
  primaryAccent,
}: ProfileSettingsGroupProps) {
  return (
    <>
      {PROFILE_SECTIONS.map((section) => (
        <View key={section.id} style={styles.settingsSection}>
          <Text style={[styles.sectionHeader, { color: textSubTheme }]}>{section.title}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            {section.items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: borderTheme }]} />}
                <TouchableOpacity style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconBg, { backgroundColor: primaryAccent + '15' }]}>
                      {item.iconType === 'fontawesome' ? (
                        <FontAwesome5 name={item.icon as any} size={14} color={primaryAccent} />
                      ) : (
                        <Feather name={item.icon as any} size={16} color={primaryAccent} />
                      )}
                    </View>
                    <Text style={[styles.settingsItemText, { color: textTheme }]}>{item.title}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={textSubTheme} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}
