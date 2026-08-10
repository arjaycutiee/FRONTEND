import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Switch,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';
import { localDb } from '@/app/services/localDb';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  category: 'Assignment' | 'Exam' | 'Class' | 'Meeting' | 'Personal' | 'AI Study';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  priority: 'High' | 'Medium' | 'Low';
  isAllDay: boolean;
  hasReminder: boolean;
  reminderTime: string; // e.g. "15 minutes before"
  isRecurring: boolean;
  recurrenceRule: string; // "Daily" | "Weekly" | ""
  progress: number; // 0 - 100
  checklist: ChecklistItem[];
  description?: string;
  isAIScheduled?: boolean;
}

// Initial events are now retrieved directly from the shared localDb service

const CATEGORY_COLORS: Record<CalendarEvent['category'], string> = {
  Assignment: '#38BDF8', // Sky Blue
  Exam: '#F87171', // Soft Red
  Class: '#C084FC', // Lavender
  Meeting: '#FB923C', // Warm Orange
  Personal: '#4ADE80', // Pastel Green
  'AI Study': '#A78BFA', // AI Purple
};

export default function SmartCalendarScreen() {
  const colorScheme = useColorScheme() ?? 'light';

  // Theme Color Palette matching Expenses Screen
  const primaryAccent = '#A97C50'; // GabAI Brown
  const textTheme = colorScheme === 'dark' ? '#ECEDEE' : '#11181C';
  const textSubTheme = colorScheme === 'dark' ? '#9BA1A6' : '#666666';
  const cardTheme = colorScheme === 'dark' ? '#1E1E1E' : '#F8FAFC';
  const borderTheme = colorScheme === 'dark' ? '#2E2E2E' : '#E2E8F0';
  const bgTheme = colorScheme === 'dark' ? '#121212' : '#FFFFFF';

  // Calendar States hooked up to central database
  const [events, setEventsState] = useState<CalendarEvent[]>(() => localDb.getEvents());

  const setEvents = (newEvents: CalendarEvent[] | ((prev: CalendarEvent[]) => CalendarEvent[])) => {
    const updated = typeof newEvents === 'function' ? newEvents(localDb.getEvents()) : newEvents;
    localDb.setEvents(updated);
    setEventsState(updated);
  };

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setEventsState(localDb.getEvents());
    });
    return unsubscribe;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>('2026-07-26'); // Today (July 26, 2026)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals & Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // AI & Rescheduling States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [activeReschedulingId, setActiveReschedulingId] = useState<string | null>(null);

  // Animation values
  const aiProgressAnim = useRef(new Animated.Value(0)).current;

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CalendarEvent['category']>('Class');
  const [newPriority, setNewPriority] = useState<CalendarEvent['priority']>('Medium');
  const [newDate, setNewDate] = useState('2026-07-24');
  const [newTime, setNewTime] = useState('09:00');
  const [newDuration, setNewDuration] = useState('60');
  const [newIsAllDay, setNewIsAllDay] = useState(false);
  const [newHasReminder, setNewHasReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('15 minutes before');
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newRecurrenceRule, setNewRecurrenceRule] = useState<'Daily' | 'Weekly'>('Weekly');
  const [newDescription, setNewDescription] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState<string[]>([]);

  // Calculate stats for upcoming deadlines sidebar
  const upcomingDeadlines = events
    .filter(e => e.category === 'Assignment' || e.category === 'Exam')
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calendar dates math for July 2026
  // July 2026 starts on a Wednesday (index 3 if Sunday is 0)
  const daysInJuly = 31;
  const startOffset = 3; // Sun, Mon, Tue are blank offset cells
  const totalGridCells = 35; // 5 rows of 7

  // Run AI schedule optimization simulation
  const handleAIGenerate = () => {
    setAiGenerating(true);
    aiProgressAnim.setValue(0);
    
    Animated.timing(aiProgressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start(() => {
      // Create Study slots based on upcoming deadlines (e.g. before July 25 and July 27)
      const aiStudySessions: CalendarEvent[] = [
        {
          id: `ai-${Date.now()}-1`,
          title: 'AI Scheduled: Algorithms Exam Prep',
          category: 'AI Study',
          date: '2026-07-24',
          time: '20:00',
          duration: 120,
          priority: 'High',
          isAllDay: false,
          hasReminder: true,
          reminderTime: '15 minutes before',
          isRecurring: false,
          recurrenceRule: '',
          progress: 0,
          checklist: [
            { id: `ai-1-c1`, text: 'Solve past exam questions on Graphs', completed: false },
            { id: `ai-1-c2`, text: 'Summarize Dynamic Programming steps', completed: false },
          ],
          description: 'AI-generated study slot optimized for Algorithms & Complexity Exam on July 25.',
          isAIScheduled: true,
        },
        {
          id: `ai-${Date.now()}-2`,
          title: 'AI Scheduled: DB Normalization Practice',
          category: 'AI Study',
          date: '2026-07-25',
          time: '15:00',
          duration: 90,
          priority: 'High',
          isAllDay: false,
          hasReminder: true,
          reminderTime: '15 minutes before',
          isRecurring: false,
          recurrenceRule: '',
          progress: 0,
          checklist: [
            { id: `ai-2-c1`, text: 'Convert schemas to BCNF', completed: false },
            { id: `ai-2-c2`, text: 'Verify functional dependencies', completed: false },
          ],
          description: 'AI-generated study slot optimized for Database Schema Design due on July 27.',
          isAIScheduled: true,
        },
        {
          id: `ai-${Date.now()}-3`,
          title: 'AI Scheduled: SQL Queries Draft',
          category: 'AI Study',
          date: '2026-07-26',
          time: '10:00',
          duration: 120,
          priority: 'Medium',
          isAllDay: false,
          hasReminder: false,
          reminderTime: '',
          isRecurring: false,
          recurrenceRule: '',
          progress: 0,
          checklist: [
            { id: `ai-3-c1`, text: 'Write DDL query scripts', completed: false },
            { id: `ai-3-c2`, text: 'Test database constraints', completed: false },
          ],
          description: 'AI-generated study slot optimized for Database Schema Design assignment due on July 27.',
          isAIScheduled: true,
        },
      ];

      setEvents(prev => [...prev, ...aiStudySessions]);
      setAiGenerating(false);
      Alert.alert(
        'GabAI Study Planner',
        'AI Schedule assistant analyzed your upcoming deadlines and added 3 study blocks to your calendar.'
      );
    });
  };

  // Toggle item in event detail checklist
  const toggleChecklistItem = (eventId: string, itemId: string) => {
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          const updatedChecklist = event.checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          // Recalculate progress percentage
          const completedCount = updatedChecklist.filter(item => item.completed).length;
          const totalCount = updatedChecklist.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          
          const updatedEvent = { ...event, checklist: updatedChecklist, progress };
          if (selectedEvent && selectedEvent.id === eventId) {
            setSelectedEvent(updatedEvent);
          }
          return updatedEvent;
        }
        return event;
      })
    );
  };

  // Save new event to the list
  const saveEvent = () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the event.');
      return;
    }

    const createdChecklist: ChecklistItem[] = newChecklistItems.map((item, idx) => ({
      id: `${Date.now()}-${idx}`,
      text: item,
      completed: false,
    }));

    const event: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      date: newDate,
      time: newTime,
      duration: parseInt(newDuration) || 60,
      priority: newPriority,
      isAllDay: newIsAllDay,
      hasReminder: newHasReminder,
      reminderTime: newHasReminder ? newReminderTime : '',
      isRecurring: newIsRecurring,
      recurrenceRule: newIsRecurring ? newRecurrenceRule : '',
      progress: 0,
      checklist: createdChecklist,
      description: newDescription,
    };

    setEvents(prev => [...prev, event]);
    setIsAddModalOpen(false);
    resetForm();
    Alert.alert('Event Added', 'Your event has been successfully scheduled.');
  };

  // Delete event from calendar
  const deleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEvents(prev => prev.filter(e => e.id !== eventId));
            setIsDetailModalOpen(false);
            setSelectedEvent(null);
          },
        },
      ]
    );
  };

  // Enter reschedule mode via long press
  const startRescheduling = (eventId: string) => {
    setActiveReschedulingId(eventId);
    setRescheduleMode(true);
    setIsDetailModalOpen(false);
  };

  // Reschedule an event by selecting a new date
  const completeRescheduling = (targetDate: string) => {
    if (!activeReschedulingId) return;

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === activeReschedulingId) {
          return { ...evt, date: targetDate };
        }
        return evt;
      })
    );

    const rescheduledEvent = events.find(e => e.id === activeReschedulingId);
    Alert.alert(
      'Event Rescheduled',
      `"${rescheduledEvent?.title}" has been moved to ${targetDate}.`
    );

    setRescheduleMode(false);
    setActiveReschedulingId(null);
  };

  // Add item to creation checklist
  const addChecklistItem = () => {
    if (newChecklistText.trim()) {
      setNewChecklistItems(prev => [...prev, newChecklistText.trim()]);
      setNewChecklistText('');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('Class');
    setNewPriority('Medium');
    setNewDate(selectedDate);
    setNewTime('09:00');
    setNewDuration('60');
    setNewIsAllDay(false);
    setNewHasReminder(false);
    setNewIsRecurring(false);
    setNewDescription('');
    setNewChecklistItems([]);
    setNewChecklistText('');
  };

  const openQuickAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Filter events based on search query and category
  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get days remaining helper
  const getDeadlineBadgeText = (dateStr: string) => {
    const today = new Date('2026-07-24');
    const deadline = new Date(dateStr);
    const timeDiff = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    return `${diffDays} days left`;
  };

  // Get deadline priority color styling
  const getPriorityColors = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'High':
        return { text: '#FCA5A5', bg: '#7F1D1D', dot: '#EF4444' };
      case 'Medium':
        return { text: '#FDBA74', bg: '#7C2D12', dot: '#F59E0B' };
      case 'Low':
        return { text: '#86EFAC', bg: '#14532D', dot: '#10B981' };
    }
  };

  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openDrawer} style={{ marginRight: 10, padding: 4 }}>
            <Feather name="menu" size={24} color={textTheme} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textTheme }]}>Calendar</Text>
        </View>
        
        {/* Reschedule Banner Indicator */}
        {rescheduleMode && (
          <View style={styles.rescheduleBanner}>
            <Feather name="info" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.rescheduleText}>Reschedule Mode Active: Tap a day to move event</Text>
            <TouchableOpacity onPress={() => { setRescheduleMode(false); setActiveReschedulingId(null); }} style={styles.cancelRescheduleButton}>
              <Text style={styles.cancelRescheduleText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI study scheduler helper */}
        <TouchableOpacity 
          style={[styles.aiButton, { backgroundColor: primaryAccent }]} 
          onPress={handleAIGenerate}
          disabled={aiGenerating}
        >
          <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={[styles.aiButtonText, { color: '#FFFFFF' }]}>AI Planner</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Search and Filters */}
      <View style={styles.filterSection}>
        <View style={[styles.searchBarContainer, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
          <Feather name="search" size={18} color={textSubTheme} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search academic planner..."
            placeholderTextColor={textSubTheme}
            style={[styles.searchInput, { color: textTheme }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={textSubTheme} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories filters scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {['All', 'Assignment', 'Exam', 'Class', 'Meeting', 'Personal', 'AI Study'].map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  { 
                    backgroundColor: isSelected ? primaryAccent : cardTheme,
                    borderColor: borderTheme,
                  }
                ]}
              >
                <Text style={[styles.categoryPillText, { color: isSelected ? '#FFFFFF' : textSubTheme }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Calendar View mode toggles */}
      <View style={styles.viewToggleContainer}>
        {['month', 'week', 'day'].map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setViewMode(mode as any)}
            style={[
              styles.viewToggleButton,
              { 
                backgroundColor: viewMode === mode ? cardTheme : 'transparent',
                borderColor: viewMode === mode ? borderTheme : 'transparent',
              }
            ]}
          >
            <Text style={[
              styles.viewToggleText, 
              { 
                color: viewMode === mode ? textTheme : textSubTheme,
                fontWeight: viewMode === mode ? 'bold' : 'normal'
              }
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content Layout */}
      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        
        {/* Render Selected View */}
        {viewMode === 'month' && (
          <View style={[styles.calendarCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <View style={styles.calendarMonthHeader}>
              <Text style={[styles.monthLabel, { color: textTheme }]}>July 2026</Text>
              <View style={styles.monthHeaderActions}>
                <TouchableOpacity style={styles.arrowButton}><Feather name="chevron-left" size={20} color={textTheme} /></TouchableOpacity>
                <TouchableOpacity style={styles.arrowButton}><Feather name="chevron-right" size={20} color={textTheme} /></TouchableOpacity>
              </View>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdayRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <Text key={idx} style={[styles.weekdayLabel, { color: textSubTheme }]}>{day}</Text>
              ))}
            </View>

            {/* Grid days */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: totalGridCells }).map((_, idx) => {
                const cellDay = idx - startOffset + 1;
                const isValidDay = cellDay > 0 && cellDay <= daysInJuly;
                
                if (!isValidDay) {
                  return <View key={idx} style={styles.emptyGridCell} />;
                }

                const dayString = `2026-07-${cellDay.toString().padStart(2, '0')}`;
                const isSelected = selectedDate === dayString;
                const isToday = dayString === '2026-07-24';
                
                // Get events for this specific date
                const dayEvents = events.filter(e => e.date === dayString);

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      if (rescheduleMode) {
                        completeRescheduling(dayString);
                      } else {
                        setSelectedDate(dayString);
                      }
                    }}
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: isSelected ? primaryAccent : 'transparent',
                        borderColor: isToday ? primaryAccent : 'transparent',
                        borderWidth: isToday ? 1.5 : 0,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.cellDayText,
                      { color: isSelected ? '#FFFFFF' : isToday ? primaryAccent : textTheme }
                    ]}>
                      {cellDay}
                    </Text>
                    {/* Event color indicators */}
                    <View style={styles.indicatorRow}>
                      {dayEvents.slice(0, 3).map((evt) => (
                        <View
                          key={evt.id}
                          style={[
                            styles.indicatorDot,
                            { backgroundColor: CATEGORY_COLORS[evt.category] }
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {viewMode === 'week' && (
          <View style={[styles.calendarCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <Text style={[styles.monthLabel, { color: textTheme, marginBottom: 12 }]}>July 19 - 25, 2026</Text>
            {/* Week row navigation headers */}
            <View style={styles.weekRowContainer}>
              {[
                { label: 'Sun', date: '19', full: '2026-07-19' },
                { label: 'Mon', date: '20', full: '2026-07-20' },
                { label: 'Tue', date: '21', full: '2026-07-21' },
                { label: 'Wed', date: '22', full: '2026-07-22' },
                { label: 'Thu', date: '23', full: '2026-07-23' },
                { label: 'Fri', date: '24', full: '2026-07-24' },
                { label: 'Sat', date: '25', full: '2026-07-25' },
              ].map((day) => {
                const isSelected = selectedDate === day.full;
                const isToday = day.full === '2026-07-24';
                return (
                  <TouchableOpacity
                    key={day.full}
                    onPress={() => {
                      if (rescheduleMode) {
                        completeRescheduling(day.full);
                      } else {
                        setSelectedDate(day.full);
                      }
                    }}
                    style={[
                      styles.weekDayHeaderCell,
                      { backgroundColor: isSelected ? primaryAccent : 'transparent' }
                    ]}
                  >
                    <Text style={[styles.weekDayLabel, { color: isSelected ? '#FFFFFF' : textSubTheme }]}>{day.label}</Text>
                    <Text style={[styles.weekDayNum, { color: isSelected ? '#FFFFFF' : isToday ? primaryAccent : textTheme }]}>{day.date}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Weekly agenda timeline summary */}
            <Text style={[styles.sectionSubtitle, { color: textSubTheme, marginTop: 16 }]}>Events in selected week</Text>
            <View style={styles.weeklyTimelineContainer}>
              {['2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25'].map((d) => {
                const dayEvts = events.filter(e => e.date === d);
                if (dayEvts.length === 0) return null;
                const dayLabel = new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <View key={d} style={styles.weekTimelineDayBlock}>
                    <Text style={[styles.weekTimelineDayTitle, { color: primaryAccent }]}>{dayLabel}</Text>
                    {dayEvts.map(evt => (
                      <TouchableOpacity
                        key={evt.id}
                        onPress={() => { setSelectedEvent(evt); setIsDetailModalOpen(true); }}
                        onLongPress={() => startRescheduling(evt.id)}
                        style={[styles.weekEventCard, { borderColor: CATEGORY_COLORS[evt.category], backgroundColor: bgTheme }]}
                      >
                        <View style={styles.weekCardLeft}>
                          <Text style={[styles.eventTimeText, { color: textSubTheme }]}>{evt.isAllDay ? 'All Day' : evt.time}</Text>
                          <Text style={[styles.eventTitleText, { color: textTheme }]}>{evt.title}</Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColors(evt.priority).bg }]}>
                          <Text style={[styles.priorityBadgeText, { color: getPriorityColors(evt.priority).text }]}>{evt.priority}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {viewMode === 'day' && (
          <View style={[styles.calendarCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
            <View style={styles.dayViewHeader}>
              <Text style={[styles.monthLabel, { color: textTheme }]}>
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>

            {/* Daily timeline grid */}
            <ScrollView scrollEnabled={false} style={styles.dailyTimelineList}>
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((hour) => {
                // Check if any event starts in this hour slot
                const hourEvts = events.filter(e => e.date === selectedDate && e.time.startsWith(hour.substring(0, 3)));
                return (
                  <View key={hour} style={[styles.timelineRow, { borderColor: borderTheme }]}>
                    <View style={styles.timelineTimeCol}>
                      <Text style={[styles.timelineTimeText, { color: textSubTheme }]}>{hour}</Text>
                    </View>
                    <View style={styles.timelineContentCol}>
                      {hourEvts.map(evt => (
                        <TouchableOpacity
                          key={evt.id}
                          onPress={() => { setSelectedEvent(evt); setIsDetailModalOpen(true); }}
                          onLongPress={() => startRescheduling(evt.id)}
                          style={[
                            styles.dailyEventCard,
                            { 
                              borderColor: CATEGORY_COLORS[evt.category],
                              backgroundColor: bgTheme,
                            }
                          ]}
                        >
                          <View style={styles.dailyCardHeader}>
                            <Text style={[styles.dailyEventTitle, { color: textTheme }]}>{evt.title}</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColors(evt.priority).bg, paddingVertical: 2, paddingHorizontal: 6 }]}>
                              <Text style={[styles.priorityBadgeText, { color: getPriorityColors(evt.priority).text, fontSize: 10 }]}>{evt.priority}</Text>
                            </View>
                          </View>
                          <Text style={[styles.dailyEventDesc, { color: textSubTheme }]} numberOfLines={1}>
                            {evt.description || 'No description provided.'}
                          </Text>
                          {evt.checklist.length > 0 && (
                            <View style={styles.dailyProgressContainer}>
                              <Text style={[styles.dailyProgressText, { color: textSubTheme }]}>Tasks ({evt.progress}%)</Text>
                              <View style={[styles.dailyProgressBarBg, { backgroundColor: borderTheme }]}>
                                <View style={[styles.dailyProgressBarFill, { backgroundColor: CATEGORY_COLORS[evt.category], width: `${evt.progress}%` }]} />
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* AI Loading Modal Indicator */}
        {aiGenerating && (
          <View style={[styles.aiProgressOverlay, { backgroundColor: 'rgba(11, 15, 25, 0.9)' }]}>
            <ActivityIndicator size="large" color={primaryAccent} />
            <Text style={[styles.aiProgressTitle, { color: textTheme }]}>GabAI Academic Scheduler</Text>
            <Text style={[styles.aiProgressSub, { color: textSubTheme }]}>Analyzing assignments & exams deadlines...</Text>
            <View style={[styles.aiProgressBarBg, { backgroundColor: borderTheme }]}>
              <Animated.View 
                style={[
                  styles.aiProgressBarFill, 
                  { 
                    backgroundColor: primaryAccent, 
                    width: aiProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Today's Agenda list */}
        <View style={styles.agendaHeader}>
          <Text style={[styles.sectionTitle, { color: textTheme }]}>
            Agenda for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={[styles.eventsCountText, { color: textSubTheme }]}>
            {events.filter(e => e.date === selectedDate).length} events
          </Text>
        </View>

        <View style={styles.agendaList}>
          {filteredEvents.filter(e => e.date === selectedDate).length > 0 ? (
            filteredEvents.filter(e => e.date === selectedDate).map((evt) => (
              <TouchableOpacity
                key={evt.id}
                onPress={() => { setSelectedEvent(evt); setIsDetailModalOpen(true); }}
                onLongPress={() => startRescheduling(evt.id)}
                style={[
                  styles.agendaCard,
                  { 
                    backgroundColor: cardTheme,
                    borderColor: borderTheme,
                    opacity: rescheduleMode && activeReschedulingId === evt.id ? 0.6 : 1,
                    borderWidth: rescheduleMode && activeReschedulingId === evt.id ? 2 : 1,
                  }
                ]}
              >
                <View style={[styles.categoryColorRibbon, { backgroundColor: CATEGORY_COLORS[evt.category] }]} />
                <View style={styles.agendaCardContent}>
                  <View style={styles.agendaTitleRow}>
                    <Text style={[styles.agendaEventTitle, { color: textTheme }]} numberOfLines={1}>{evt.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColors(evt.priority).bg }]}>
                      <Text style={[styles.priorityBadgeText, { color: getPriorityColors(evt.priority).text }]}>{evt.priority}</Text>
                    </View>
                  </View>

                  <View style={styles.agendaDetailsRow}>
                    <Feather name="clock" size={14} color={textSubTheme} style={{ marginRight: 4 }} />
                    <Text style={[styles.agendaDetailText, { color: textSubTheme }]}>
                      {evt.isAllDay ? 'All Day' : `${evt.time} (${evt.duration} mins)`}
                    </Text>
                    
                    <View style={{ width: 12 }} />
                    
                    <Feather name="tag" size={14} color={textSubTheme} style={{ marginRight: 4 }} />
                    <Text style={[styles.agendaDetailText, { color: textSubTheme }]}>{evt.category}</Text>
                  </View>

                  {evt.checklist.length > 0 && (
                    <View style={styles.agendaProgressContainer}>
                      <View style={styles.progressLabelRow}>
                        <Text style={[styles.progressTextLabel, { color: textSubTheme }]}>Checklist progress</Text>
                        <Text style={[styles.progressValLabel, { color: textTheme }]}>{evt.progress}%</Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: borderTheme }]}>
                        <View style={[styles.progressBarFill, { backgroundColor: CATEGORY_COLORS[evt.category], width: `${evt.progress}%` }]} />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.noEventsCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
              <Feather name="calendar" size={32} color={textSubTheme} style={{ marginBottom: 8 }} />
              <Text style={[styles.noEventsText, { color: textSubTheme }]}>No academic schedules or events today.</Text>
            </View>
          )}
        </View>

        {/* Upcoming Deadlines Widget */}
        <View style={styles.deadlineHeader}>
          <Text style={[styles.sectionTitle, { color: textTheme }]}>Upcoming Deadlines</Text>
          <Feather name="clock" size={18} color={primaryAccent} />
        </View>
        
        <View style={styles.deadlinesList}>
          {upcomingDeadlines.slice(0, 3).map((evt) => (
            <TouchableOpacity
              key={evt.id}
              onPress={() => { setSelectedEvent(evt); setIsDetailModalOpen(true); }}
              style={[styles.deadlineCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}
            >
              <View style={styles.deadlineInfoCol}>
                <View style={styles.deadlineHeadingRow}>
                  <Text style={[styles.deadlineTitleText, { color: textTheme }]} numberOfLines={1}>{evt.title}</Text>
                  <View style={[styles.deadlineBadge, { backgroundColor: '#7F1D1D' }]}>
                    <Text style={[styles.deadlineBadgeText, { color: '#FCA5A5' }]}>
                      {getDeadlineBadgeText(evt.date)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.deadlineDateText, { color: textSubTheme }]}>
                  Due: {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                {evt.checklist.length > 0 && (
                  <View style={[styles.progressBarBg, { backgroundColor: borderTheme, marginTop: 10 }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: CATEGORY_COLORS[evt.category], width: `${evt.progress}%` }]} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Floating Action Button (FAB) for Quick Add */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryAccent }]}
        onPress={openQuickAdd}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Event Details Modal */}
      <Modal
        visible={isDetailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalContainer, { backgroundColor: cardTheme }]}>
            {/* Modal Header Ribbon */}
            {selectedEvent && (
              <View style={[styles.modalHeaderRibbon, { backgroundColor: CATEGORY_COLORS[selectedEvent.category] }]} />
            )}
            
            <View style={styles.modalHeaderClose}>
              <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                <Feather name="x" size={24} color={textTheme} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalMetaRow}>
                  <View style={[styles.modalCategoryBadge, { backgroundColor: borderTheme }]}>
                    <Text style={[styles.modalCategoryText, { color: CATEGORY_COLORS[selectedEvent.category] }]}>
                      {selectedEvent.category}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColors(selectedEvent.priority).bg }]}>
                    <Text style={[styles.priorityBadgeText, { color: getPriorityColors(selectedEvent.priority).text }]}>
                      {selectedEvent.priority} Priority
                    </Text>
                  </View>
                </View>

                <Text style={[styles.modalTitleText, { color: textTheme }]}>{selectedEvent.title}</Text>
                
                {/* Date & Time info */}
                <View style={styles.modalInfoCard}>
                  <View style={styles.infoRowItem}>
                    <Feather name="calendar" size={16} color={textSubTheme} />
                    <Text style={[styles.infoRowText, { color: textTheme }]}>
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.infoRowItem, { marginTop: 8 }]}>
                    <Feather name="clock" size={16} color={textSubTheme} />
                    <Text style={[styles.infoRowText, { color: textTheme }]}>
                      {selectedEvent.isAllDay ? 'All Day Event' : `${selectedEvent.time} (${selectedEvent.duration} minutes)`}
                    </Text>
                  </View>
                  {selectedEvent.isRecurring && (
                    <View style={[styles.infoRowItem, { marginTop: 8 }]}>
                      <Feather name="refresh-cw" size={16} color={textSubTheme} />
                      <Text style={[styles.infoRowText, { color: textTheme }]}>
                        Repeats {selectedEvent.recurrenceRule}
                      </Text>
                    </View>
                  )}
                  {selectedEvent.hasReminder && (
                    <View style={[styles.infoRowItem, { marginTop: 8 }]}>
                      <Feather name="bell" size={16} color={textSubTheme} />
                      <Text style={[styles.infoRowText, { color: textTheme }]}>
                        Reminder set: {selectedEvent.reminderTime}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {selectedEvent.description ? (
                  <View style={styles.modalDescContainer}>
                    <Text style={[styles.descTitle, { color: textSubTheme }]}>Description</Text>
                    <Text style={[styles.descBodyText, { color: textTheme }]}>{selectedEvent.description}</Text>
                  </View>
                ) : null}

                {/* Checklist task manager */}
                {selectedEvent.checklist.length > 0 ? (
                  <View style={styles.modalChecklistContainer}>
                    <Text style={[styles.checklistTitleText, { color: textSubTheme }]}>Task Checklist ({selectedEvent.progress}%)</Text>
                    
                    {/* Progress tracking bar */}
                    <View style={[styles.modalProgressBarBg, { backgroundColor: borderTheme }]}>
                      <View style={[styles.modalProgressBarFill, { backgroundColor: CATEGORY_COLORS[selectedEvent.category], width: `${selectedEvent.progress}%` }]} />
                    </View>

                    <View style={styles.checklistsList}>
                      {selectedEvent.checklist.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => toggleChecklistItem(selectedEvent.id, item.id)}
                          style={[styles.checklistRow, { borderBottomColor: borderTheme }]}
                        >
                          <MaterialCommunityIcons 
                            name={item.completed ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                            size={22} 
                            color={item.completed ? CATEGORY_COLORS[selectedEvent.category] : textSubTheme} 
                          />
                          <Text style={[
                            styles.checklistRowText, 
                            { 
                              color: item.completed ? textSubTheme : textTheme,
                              textDecorationLine: item.completed ? 'line-through' : 'none'
                            }
                          ]}>
                            {item.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Action buttons */}
                <View style={styles.modalActionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderColor: borderTheme, borderWidth: 1 }]} 
                    onPress={() => startRescheduling(selectedEvent.id)}
                  >
                    <Feather name="move" size={16} color={textTheme} style={{ marginRight: 8 }} />
                    <Text style={[styles.actionBtnText, { color: textTheme }]}>Reschedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#7F1D1D' }]} 
                    onPress={() => deleteEvent(selectedEvent.id)}
                  >
                    <Feather name="trash-2" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Quick Add Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalContainer, { backgroundColor: cardTheme }]}>
            <View style={styles.addModalHeader}>
              <Text style={[styles.modalHeaderTitle, { color: textTheme }]}>Quick Add Academic Event</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Feather name="x" size={24} color={textTheme} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addFormScroll} showsVerticalScrollIndicator={false}>
              
              {/* Event Title */}
              <Text style={[styles.formLabel, { color: textSubTheme }]}>Event Title</Text>
              <TextInput
                placeholder="e.g. Study Chemistry Chapters 3-4"
                placeholderTextColor={textSubTheme}
                style={[styles.formInput, { color: textTheme, borderColor: borderTheme }]}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* Category selector */}
              <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Category</Text>
              <View style={styles.rowSelector}>
                {(['Assignment', 'Exam', 'Class', 'Meeting', 'Personal'] as CalendarEvent['category'][]).map((cat) => {
                  const isSelected = newCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewCategory(cat)}
                      style={[
                        styles.selectorPill,
                        { 
                          backgroundColor: isSelected ? CATEGORY_COLORS[cat] : bgTheme,
                          borderColor: borderTheme,
                        }
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#000000' : textTheme, fontWeight: isSelected ? 'bold' : 'normal', fontSize: 12 }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Priority Selector */}
              <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Priority Level</Text>
              <View style={styles.rowSelector}>
                {['Low', 'Medium', 'High'].map((prio) => {
                  const isSelected = newPriority === prio;
                  const colors = getPriorityColors(prio as any);
                  return (
                    <TouchableOpacity
                      key={prio}
                      onPress={() => setNewPriority(prio as any)}
                      style={[
                        styles.selectorPill,
                        { 
                          backgroundColor: isSelected ? colors.bg : bgTheme,
                          borderColor: borderTheme,
                        }
                      ]}
                    >
                      <Text style={{ color: isSelected ? colors.text : textTheme, fontWeight: isSelected ? 'bold' : 'normal' }}>
                        {prio}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date & Time fields */}
              <View style={styles.formRowFields}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    placeholder="2026-07-24"
                    placeholderTextColor={textSubTheme}
                    style={[styles.formInput, { color: textTheme, borderColor: borderTheme }]}
                    value={newDate}
                    onChangeText={setNewDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Time (HH:MM)</Text>
                  <TextInput
                    placeholder="09:00"
                    placeholderTextColor={textSubTheme}
                    style={[styles.formInput, { color: textTheme, borderColor: borderTheme }]}
                    value={newTime}
                    onChangeText={setNewTime}
                  />
                </View>
              </View>

              {/* Duration and toggle fields */}
              <View style={styles.formRowFields}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Duration (Minutes)</Text>
                  <TextInput
                    placeholder="60"
                    placeholderTextColor={textSubTheme}
                    style={[styles.formInput, { color: textTheme, borderColor: borderTheme }]}
                    value={newDuration}
                    keyboardType="numeric"
                    onChangeText={setNewDuration}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8, justifyContent: 'center', paddingTop: 16 }}>
                  <View style={styles.switchRowItem}>
                    <Text style={{ color: textTheme, marginRight: 8 }}>All Day</Text>
                    <Switch
                      value={newIsAllDay}
                      onValueChange={setNewIsAllDay}
                      trackColor={{ false: '#767577', true: primaryAccent }}
                    />
                  </View>
                </View>
              </View>

              {/* Reminders Toggle */}
              <View style={[styles.switchRowItem, { marginTop: 16, justifyContent: 'space-between' }]}>
                <View>
                  <Text style={{ color: textTheme }}>Set Reminder Alert</Text>
                  <Text style={{ color: textSubTheme, fontSize: 12 }}>Receive notification check</Text>
                </View>
                <Switch
                  value={newHasReminder}
                  onValueChange={setNewHasReminder}
                  trackColor={{ false: '#767577', true: primaryAccent }}
                />
              </View>

              {newHasReminder && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.formLabel, { color: textSubTheme }]}>Reminder Timing</Text>
                  <View style={styles.rowSelector}>
                    {['15 minutes before', '30 minutes before', '1 hour before', '1 day before'].map((rem) => {
                      const isSelected = newReminderTime === rem;
                      return (
                        <TouchableOpacity
                          key={rem}
                          onPress={() => setNewReminderTime(rem)}
                          style={[
                            styles.selectorPill,
                            { 
                              backgroundColor: isSelected ? primaryAccent : bgTheme,
                              borderColor: borderTheme,
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                            }
                          ]}
                        >
                          <Text style={{ color: isSelected ? '#FFFFFF' : textTheme, fontSize: 11 }}>{rem}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Recurrence Toggle */}
              <View style={[styles.switchRowItem, { marginTop: 16, justifyContent: 'space-between' }]}>
                <View>
                  <Text style={{ color: textTheme }}>Recurring Event</Text>
                  <Text style={{ color: textSubTheme, fontSize: 12 }}>Schedule recurring routines</Text>
                </View>
                <Switch
                  value={newIsRecurring}
                  onValueChange={setNewIsRecurring}
                  trackColor={{ false: '#767577', true: primaryAccent }}
                />
              </View>

              {newIsRecurring && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.formLabel, { color: textSubTheme }]}>Recurrence Interval</Text>
                  <View style={styles.rowSelector}>
                    {['Daily', 'Weekly'].map((rule) => {
                      const isSelected = newRecurrenceRule === rule;
                      return (
                        <TouchableOpacity
                          key={rule}
                          onPress={() => setNewRecurrenceRule(rule as any)}
                          style={[
                            styles.selectorPill,
                            { 
                              backgroundColor: isSelected ? primaryAccent : bgTheme,
                              borderColor: borderTheme,
                            }
                          ]}
                        >
                          <Text style={{ color: isSelected ? '#FFFFFF' : textTheme }}>{rule}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Description */}
              <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Description / Notes</Text>
              <TextInput
                placeholder="Write any class codes, exam format notes, or details..."
                placeholderTextColor={textSubTheme}
                multiline
                numberOfLines={3}
                style={[styles.formInput, { color: textTheme, borderColor: borderTheme, height: 80, textAlignVertical: 'top' }]}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              {/* Checklist adding section */}
              <Text style={[styles.formLabel, { color: textSubTheme, marginTop: 16 }]}>Task Checklist Items ({newChecklistItems.length} items)</Text>
              <View style={styles.checklistBuilderRow}>
                <TextInput
                  placeholder="Add a milestone to this event..."
                  placeholderTextColor={textSubTheme}
                  style={[styles.formInput, { color: textTheme, borderColor: borderTheme, flex: 1, marginBottom: 0 }]}
                  value={newChecklistText}
                  onChangeText={setNewChecklistText}
                />
                <TouchableOpacity 
                  style={[styles.addChecklistBtn, { backgroundColor: primaryAccent }]}
                  onPress={addChecklistItem}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {newChecklistItems.length > 0 && (
                <View style={[styles.builderItemsContainer, { backgroundColor: bgTheme, borderColor: borderTheme }]}>
                  {newChecklistItems.map((item, idx) => (
                    <View key={idx} style={[styles.builderItemRow, { borderBottomColor: borderTheme }]}>
                      <Text style={{ color: textTheme, flex: 1 }}>{item}</Text>
                      <TouchableOpacity onPress={() => setNewChecklistItems(prev => prev.filter((_, i) => i !== idx))}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Form Save Button */}
              <TouchableOpacity 
                style={[styles.saveFormBtn, { backgroundColor: primaryAccent }]}
                onPress={saveEvent}
              >
                <Text style={styles.saveFormBtnText}>Save Event & Schedule</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  rescheduleBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 52,
    backgroundColor: '#7C2D12',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 100,
  },
  rescheduleText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  cancelRescheduleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  cancelRescheduleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  categoryScroll: {
    paddingVertical: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(169, 124, 80, 0.1)',
    padding: 2,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  viewToggleText: {
    fontSize: 13,
  },
  mainScroll: {
    paddingBottom: 80,
  },
  calendarCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthHeaderActions: {
    flexDirection: 'row',
  },
  arrowButton: {
    marginLeft: 8,
    padding: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  emptyGridCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  cellDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  indicatorRow: {
    flexDirection: 'row',
    marginTop: 4,
    height: 4,
    justifyContent: 'center',
    width: '100%',
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  weekRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayHeaderCell: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  weekDayNum: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weeklyTimelineContainer: {
    marginTop: 12,
  },
  weekTimelineDayBlock: {
    marginBottom: 16,
  },
  weekTimelineDayTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  weekEventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 6,
  },
  weekCardLeft: {
    flex: 1,
  },
  eventTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  eventTitleText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  dayViewHeader: {
    marginBottom: 12,
  },
  dailyTimelineList: {
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  timelineTimeCol: {
    width: 60,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 12,
  },
  dailyEventCard: {
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 6,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyEventTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  dailyEventDesc: {
    fontSize: 11,
    marginTop: 4,
  },
  dailyProgressContainer: {
    marginTop: 8,
  },
  dailyProgressText: {
    fontSize: 10,
    marginBottom: 4,
  },
  dailyProgressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  dailyProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventsCountText: {
    fontSize: 12,
  },
  agendaList: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  agendaCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryColorRibbon: {
    width: 6,
    height: '100%',
  },
  agendaCardContent: {
    flex: 1,
    padding: 16,
  },
  agendaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendaEventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  agendaDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agendaDetailText: {
    fontSize: 12,
  },
  agendaProgressContainer: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTextLabel: {
    fontSize: 11,
  },
  progressValLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  noEventsCard: {
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsText: {
    fontSize: 13,
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  deadlinesList: {
    marginHorizontal: 24,
  },
  deadlineCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  deadlineInfoCol: {
    flex: 1,
  },
  deadlineHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deadlineTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  deadlineBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deadlineBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  deadlineDateText: {
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  detailModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  modalHeaderRibbon: {
    height: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  modalHeaderClose: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalScrollBody: {
    paddingHorizontal: 20,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCategoryBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInfoCard: {
    backgroundColor: 'rgba(36, 50, 79, 0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowText: {
    fontSize: 13,
    marginLeft: 10,
  },
  modalDescContainer: {
    marginBottom: 20,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  descBodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalChecklistContainer: {
    marginBottom: 24,
  },
  checklistTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalProgressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 12,
  },
  modalProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistsList: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checklistRowText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    height: '90%',
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#24324F',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addFormScroll: {
    padding: 20,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  rowSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  selectorPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  formRowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistBuilderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addChecklistBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  builderItemsContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  builderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveFormBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveFormBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiProgressOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  aiProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  aiProgressSub: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  aiProgressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '60%',
  },
  aiProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
