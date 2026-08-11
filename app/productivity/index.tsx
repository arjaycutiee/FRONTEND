import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  TimerRingDisplay,
  FocusModeTabs,
  SubjectSelector,
  StrictControls,
  AmbientNoiseWidget,
  FocusStatsOverview,
  SessionCompletionModal,
} from './components';
import { useFocusTimer } from './hooks/useFocusTimer';
import { focusStyles as styles } from './styles/focus.styles';

export default function StrictFocusSessionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Theme Palette
  const primaryAccent = '#A97C50'; // GabAI Brown
  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';

  const {
    currentMode,
    selectedSubject,
    setSelectedSubject,
    isStrict,
    setIsStrict,
    zenMode,
    setZenMode,
    ambientSound,
    setAmbientSound,
    isRunning,
    isPaused,
    stats,
    showCompletionModal,
    setShowCompletionModal,
    completedDurationMin,
    affirmation,
    progressPercent,
    formattedTime,
    handleSelectMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    finishEarly,
  } = useFocusTimer();

  // Fullscreen Zen / Distraction-Free Mode
  if (zenMode) {
    return (
      <View style={[styles.zenContainer, { backgroundColor: '#0B0F19' }]}>
        <StatusBar hidden />
        <TouchableOpacity
          style={[styles.zenExitBtn, { borderColor: '#2E384D' }]}
          onPress={() => setZenMode(false)}
        >
          <Feather name="minimize-2" size={18} color="#9BA1A6" />
        </TouchableOpacity>

        <Text style={[styles.zenSubjectText, { color: primaryAccent }]}>
          📚 {selectedSubject.trim() || 'General Study'}
        </Text>

        <Text style={[styles.zenTimerDigits, { color: '#FFFFFF' }]}>
          {formattedTime}
        </Text>

        <Text style={[styles.zenStrictNotice, { color: isStrict ? '#EF4444' : '#9BA1A6' }]}>
          {isStrict ? '🛡️ Strict Focus Locked' : 'Zen Focus Mode'}
        </Text>

        {/* Mini Controls in Zen Mode */}
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 40 }}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.controlMainBtn, { backgroundColor: primaryAccent }]}
              onPress={startTimer}
            >
              <Feather name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          ) : isPaused ? (
            <TouchableOpacity
              style={[styles.controlMainBtn, { backgroundColor: primaryAccent }]}
              onPress={resumeTimer}
            >
              <Feather name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlMainBtn, { backgroundColor: '#EF4444' }]}
              onPress={pauseTimer}
            >
              <Feather name="pause" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBg }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Strict Study Timer
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: borderCol, backgroundColor: cardBg }]}
            onPress={() => setZenMode(true)}
          >
            <Feather name="maximize-2" size={16} color={textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Motivational Affirmation Ticker */}
        <View
          style={[
            styles.affirmationBox,
            { backgroundColor: cardBg, borderColor: borderCol },
          ]}
        >
          <Feather name="zap" size={15} color={primaryAccent} />
          <Text style={[styles.affirmationText, { color: textPrimary }]}>
            &quot;{affirmation}&quot;
          </Text>
        </View>

        {/* Mode Selector Tabs (Pomodoro, Deep Work, Breaks) */}
        <FocusModeTabs
          currentMode={currentMode}
          onSelectMode={handleSelectMode}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryAccent={primaryAccent}
        />

        {/* Main Countdown Gauge Card */}
        <TimerRingDisplay
          formattedTime={formattedTime}
          progressPercent={progressPercent}
          selectedSubject={selectedSubject}
          isStrict={isStrict}
          isRunning={isRunning}
          isPaused={isPaused}
          onEnterZen={() => setZenMode(true)}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryAccent={primaryAccent}
        />

        {/* Strict Controls & Mode Switch */}
        <StrictControls
          isRunning={isRunning}
          isPaused={isPaused}
          isStrict={isStrict}
          onToggleStrict={setIsStrict}
          onStart={startTimer}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onReset={resetTimer}
          onFinishEarly={finishEarly}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryAccent={primaryAccent}
        />

        {/* Subject Target Selector */}
        <SubjectSelector
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryAccent={primaryAccent}
        />

        {/* Ambient Noise Soundscapes */}
        <AmbientNoiseWidget
          ambientSound={ambientSound}
          onSelectAmbientSound={setAmbientSound}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryAccent={primaryAccent}
        />

        {/* Focus Stats Overview */}
        <FocusStatsOverview
          stats={stats}
          cardBg={cardBg}
          borderCol={borderCol}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          primaryAccent={primaryAccent}
        />
      </ScrollView>

      {/* Session Completion Celebration Modal */}
      <SessionCompletionModal
        visible={showCompletionModal}
        subject={selectedSubject}
        durationMinutes={completedDurationMin}
        isStrict={isStrict}
        onDismiss={() => setShowCompletionModal(false)}
        cardBg={cardBg}
        borderCol={borderCol}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        primaryAccent={primaryAccent}
      />
    </SafeAreaView>
  );
}
