import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';
import { localDb } from '@/app/services/localDb';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: 'Academic' | 'Personal' | 'Projects' | 'Exams' | 'Activities';
  priority: 'High' | 'Medium' | 'Low';
  difficulty: 'Hard' | 'Medium' | 'Easy';
  duration: number; // in hours
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  completed: boolean;
  hasReminder: boolean;
  repeat: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  isPinned: boolean;
  isFavorite: boolean;
  attachments: number; // count
  subTasks: SubTask[];
  createdAt: number; // timestamp
}

const CATEGORIES: Task['category'][] = ['Academic', 'Personal', 'Projects', 'Exams', 'Activities'];
const SUBJECTS = ['Capstone Paper', 'Economics with Taxation', 'Technopreneurship', 'Ethics', 'General'];
const FILTERS = ['All', 'Today', 'Tomorrow', 'Priority', 'Difficulty', 'Subject', 'Category', 'Recently Added', 'Longest Pending', 'Completed'];

export default function NextGenTaskScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // GabAi Design Colors
  const primaryBrown = '#A97C50'; // GabAI Brown
  const successGreen = '#10B981';
  const errorRed = '#EF4444';
  const warningOrange = '#F59E0B';
  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';
  const inputBg = isDark ? '#121212' : '#FFFFFF';

  // Sub-Navigation Tab State
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timeline' | 'subjects' | 'analytics'>('overview');

  // State hooked up to the central database
  const [tasks, setTasksState] = useState<Task[]>(() => localDb.getTasks());
  
  const setTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    const updated = typeof newTasks === 'function' ? newTasks(localDb.getTasks()) : newTasks;
    localDb.setTasks(updated);
    setTasksState(updated);
  };

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setTasksState(localDb.getTasks());
    });
    return unsubscribe;
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Multi-select & Bulk Mode
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Focus Mode Modal State
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('Capstone Paper');
  const [newCategory, setNewCategory] = useState<Task['category']>('Academic');
  const [newPriority, setNewPriority] = useState<Task['priority']>('Medium');
  const [newDifficulty, setNewDifficulty] = useState<Task['difficulty']>('Medium');
  const [newDuration, setNewDuration] = useState('1.5');
  const [newDueDate, setNewDueDate] = useState('2026-07-25');
  const [newDueTime, setNewDueTime] = useState('12:00');
  const [newHasReminder, setNewHasReminder] = useState(false);
  const [newRepeat, setNewRepeat] = useState<Task['repeat']>('None');
  const [newSubTaskInput, setNewSubTaskInput] = useState('');
  const [newSubTasksList, setNewSubTasksList] = useState<string[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Date constants (Mocking today is July 25, 2026)
  const todayStr = '2026-07-25';
  const tomorrowStr = '2026-07-26';

  // Pomodoro timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsTimerRunning(false);
      Alert.alert('Focus Time Up!', 'Great job! Take a small rest break.');
      setPomodoroTime(25 * 60);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, pomodoroTime]);

  // Overall calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = tasks.filter(t => !t.completed);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const estimatedRemainingHours = activeTasks.reduce((sum, item) => sum + item.duration, 0);

  // Workload Meter Math
  const getWorkloadLevel = () => {
    const totalActiveTasks = activeTasks.length;
    const highPriorityCount = activeTasks.filter(t => t.priority === 'High').length;
    const hardDifficultyCount = activeTasks.filter(t => t.difficulty === 'Hard').length;

    const score = totalActiveTasks + (highPriorityCount * 1.5) + (hardDifficultyCount * 1.0);

    if (score === 0) return { label: 'None', color: successGreen, icon: 'check-circle' };
    if (score <= 3) return { label: 'Light', color: successGreen, icon: 'smile' };
    if (score <= 6) return { label: 'Moderate', color: warningOrange, icon: 'info' };
    if (score <= 9) return { label: 'Heavy', color: primaryBrown, icon: 'alert-triangle' };
    return { label: 'Overloaded', color: errorRed, icon: 'zap' };
  };

  const workload = getWorkloadLevel();

  // Dynamic Heatmap Workload (mocking 14 calendar cells)
  const heatmapDays = [
    { date: '19', load: 1, full: '2026-07-19' },
    { date: '20', load: 3, full: '2026-07-20' },
    { date: '21', load: 0, full: '2026-07-21' },
    { date: '22', load: 2, full: '2026-07-22' },
    { date: '23', load: 0, full: '2026-07-23' },
    { date: '24', load: 4, full: '2026-07-24' },
    { date: '25', load: 5, full: '2026-07-25' }, // Today
    { date: '26', load: 3, full: '2026-07-26' }, // Tomorrow
    { date: '27', load: 2, full: '2026-07-27' },
    { date: '28', load: 1, full: '2026-07-28' },
    { date: '29', load: 0, full: '2026-07-29' },
    { date: '30', load: 1, full: '2026-07-30' },
    { date: '31', load: 0, full: '2026-07-31' },
  ];

  // Subject Metrics
  const getSubjectBreakdown = (sub: string) => {
    const subTasks = tasks.filter(t => t.subject === sub);
    const total = subTasks.length;
    const completed = subTasks.filter(t => t.completed).length;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remainingTasks = subTasks.filter(t => !t.completed).length;
    
    // Split mock classifications
    const assignments = subTasks.filter(t => t.category === 'Academic').length;
    const projects = subTasks.filter(t => t.category === 'Projects').length;
    const quizzes = subTasks.filter(t => t.category === 'Exams').length;

    return { total, completed, completionPercent, remainingTasks, assignments, projects, quizzes };
  };

  // Sorting and Filtering
  const getFilteredTasksList = () => {
    let result = [...tasks];

    // Filter search query
    if (searchQuery) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter dynamic tabs
    if (activeFilter === 'Today') {
      result = result.filter(t => t.dueDate === todayStr);
    } else if (activeFilter === 'Tomorrow') {
      result = result.filter(t => t.dueDate === tomorrowStr);
    } else if (activeFilter === 'Completed') {
      result = result.filter(t => t.completed);
    } else if (activeFilter === 'Priority') {
      // Sort or filter High Priority
      result = result.filter(t => t.priority === 'High');
    } else if (activeFilter === 'Difficulty') {
      result = result.filter(t => t.difficulty === 'Hard');
    } else if (activeFilter === 'Recently Added') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (activeFilter === 'Longest Pending') {
      result.sort((a, b) => a.createdAt - b.createdAt);
    }

    return result;
  };

  // Handlers
  const handleToggleComplete = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleTogglePin = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleToggleFavorite = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTasks(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) {
      Alert.alert('Input Error', 'Please specify a task title.');
      return;
    }

    const createdSubTasks: SubTask[] = newSubTasksList.map((item, idx) => ({
      id: `${Date.now()}-${idx}`,
      title: item,
      completed: false,
    }));

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      subject: newSubject,
      category: newCategory,
      priority: newPriority,
      difficulty: newDifficulty,
      duration: parseFloat(newDuration) || 1.0,
      dueDate: newDueDate,
      dueTime: newDueTime,
      completed: false,
      hasReminder: newHasReminder,
      repeat: newRepeat,
      isPinned: false,
      isFavorite: false,
      attachments: 0,
      subTasks: createdSubTasks,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setIsAdding(false);
    resetForm();
  };

  const addSubTaskToForm = () => {
    if (newSubTaskInput.trim()) {
      setNewSubTasksList([...newSubTasksList, newSubTaskInput.trim()]);
      setNewSubTaskInput('');
    }
  };

  const removeSubTaskFromForm = (idx: number) => {
    setNewSubTasksList(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewSubject('Capstone Paper');
    setNewCategory('Academic');
    setNewPriority('Medium');
    setNewDifficulty('Medium');
    setNewDuration('1.5');
    setNewDueDate('2026-07-25');
    setNewDueTime('12:00');
    setNewHasReminder(false);
    setNewRepeat('None');
    setNewSubTasksList([]);
    setNewSubTaskInput('');
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  // Focus Mode Actions
  const openFocusMode = (task: Task) => {
    setFocusedTask(task);
    setPomodoroTime(25 * 60);
    setIsTimerRunning(false);
    setIsFocusActive(true);
  };

  const toggleFocusSubTask = (subId: string) => {
    if (!focusedTask) return;
    const updatedSubTasks = focusedTask.subTasks.map(sub =>
      sub.id === subId ? { ...sub, completed: !sub.completed } : sub
    );
    const updatedTask = { ...focusedTask, subTasks: updatedSubTasks };
    
    setFocusedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === focusedTask.id ? updatedTask : t));
  };

  // Bulk Actions
  const handleBulkComplete = () => {
    if (selectedTaskIds.length === 0) return;
    setTasks(prev =>
      prev.map(t => selectedTaskIds.includes(t.id) ? { ...t, completed: true } : t)
    );
    setSelectedTaskIds([]);
    setIsMultiSelectMode(false);
    Alert.alert('Success', 'Selected tasks completed in bulk.');
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    Alert.alert('Delete Selected', 'Delete all selected tasks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
          setSelectedTaskIds([]);
          setIsMultiSelectMode(false);
        }
      }
    ]);
  };

  const toggleSelectTaskId = (id: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Render Sub-sections
  const renderOverviewSubTab = () => {
    const pinnedTasks = tasks.filter(t => !t.completed && t.isPinned);
    
    return (
      <View style={styles.overviewContainer}>
        {/* Daily Motivation Banner */}
        <View style={[styles.motivationBanner, { backgroundColor: primaryBrown + '12', borderColor: primaryBrown + '30' }]}>
          <Feather name="award" size={24} color={primaryBrown} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.motivationTitle, { color: textPrimary }]}>Master Your Semester</Text>
            <Text style={[styles.motivationQuote, { color: textSecondary }]}>
              &ldquo;Productivity is never an accident. It is always the result of a commitment to excellence.&rdquo;
            </Text>
          </View>
        </View>

        {/* Workload Meter & Analytics Widget */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.overviewCardLabel, { color: textSecondary }]}>Workload Status</Text>
              <Feather name={workload.icon as any} size={16} color={workload.color} />
            </View>
            <Text style={[styles.workloadLabel, { color: workload.color }]}>{workload.label}</Text>
            <Text style={[styles.overviewCardSubText, { color: textSecondary, marginTop: 4 }]}>
              Based on active assignments and projects metrics.
            </Text>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.overviewCardLabel, { color: textSecondary }]}>Weekly Completion</Text>
              <Feather name="percent" size={14} color={primaryBrown} />
            </View>
            <Text style={[styles.completionPercentageText, { color: textPrimary }]}>{completionRate}%</Text>
            <View style={[styles.progressLineBg, { backgroundColor: borderCol, marginTop: 8 }]}>
              <View style={[styles.progressLineFill, { backgroundColor: primaryBrown, width: `${completionRate}%` }]} />
            </View>
          </View>
        </View>

        {/* Student Insights Panel */}
        <View style={[styles.insightsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionHeadingTitle, { color: textPrimary }]}>🚀 Student Insights</Text>
          <View style={styles.insightBullet}>
            <View style={[styles.bulletDot, { backgroundColor: primaryBrown }]} />
            <Text style={[styles.insightText, { color: textSecondary }]}>
              You have {tasks.filter(t => !t.completed && t.dueDate <= todayStr).length} tasks currently overdue.
            </Text>
          </View>
          <View style={styles.insightBullet}>
            <View style={[styles.bulletDot, { backgroundColor: primaryBrown }]} />
            <Text style={[styles.insightText, { color: textSecondary }]}>
              {estimatedRemainingHours.toFixed(1)} estimated study hours remaining for your active load.
            </Text>
          </View>
          <View style={styles.insightBullet}>
            <View style={[styles.bulletDot, { backgroundColor: primaryBrown }]} />
            <Text style={[styles.insightText, { color: textSecondary }]}>
              Database & Capstone Paper assignments constitute 80% of your upcoming work.
            </Text>
          </View>
        </View>

        {/* Heatmap Calendar Section */}
        <View style={[styles.heatmapCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionHeadingTitle, { color: textPrimary, marginBottom: 12 }]}>📅 Workload Heatmap</Text>
          <View style={styles.heatmapGrid}>
            {heatmapDays.map((day, idx) => {
              // Color densities
              let cellColor = isDark ? '#1A1A1A' : '#F3F4F6';
              if (day.load > 0) {
                if (day.load === 1) cellColor = primaryBrown + '20';
                else if (day.load === 2) cellColor = primaryBrown + '40';
                else if (day.load === 3) cellColor = primaryBrown + '70';
                else cellColor = primaryBrown; // Heavy
              }
              const isToday = day.full === todayStr;

              return (
                <View key={idx} style={styles.heatmapCellContainer}>
                  <View style={[styles.heatmapCell, { backgroundColor: cellColor, borderColor: isToday ? primaryBrown : 'transparent', borderWidth: isToday ? 1.5 : 0 }]} />
                  <Text style={[styles.heatmapCellText, { color: isToday ? primaryBrown : textSecondary }]}>{day.date}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={[styles.legendText, { color: textSecondary }]}>Light</Text>
            <View style={[styles.legendBox, { backgroundColor: primaryBrown + '20' }]} />
            <View style={[styles.legendBox, { backgroundColor: primaryBrown + '40' }]} />
            <View style={[styles.legendBox, { backgroundColor: primaryBrown + '70' }]} />
            <View style={[styles.legendBox, { backgroundColor: primaryBrown }]} />
            <Text style={[styles.legendText, { color: textSecondary }]}>Heavy</Text>
          </View>
        </View>

        {/* Today's Focus (Pinned / Favorites) */}
        <View style={styles.focusBlock}>
          <Text style={[styles.sectionHeadingTitle, { color: textPrimary, marginBottom: 12 }]}>⭐️ Today&apos;s Focus (Top Pinned)</Text>
          {pinnedTasks.slice(0, 3).map(task => (
            <TouchableOpacity 
              key={task.id} 
              style={[styles.focusTaskCard, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={() => openFocusMode(task)}
            >
              <View style={styles.focusCardLeft}>
                <Feather name="target" size={16} color={primaryBrown} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.focusCardTitle, { color: textPrimary }]} numberOfLines={1}>{task.title}</Text>
                  <Text style={[styles.focusCardSub, { color: textSecondary }]}>{task.subject} • {task.duration} hrs</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={textSecondary} />
            </TouchableOpacity>
          ))}
          {pinnedTasks.length === 0 && (
            <View style={[styles.emptyFocusCard, { borderColor: borderCol }]}>
              <Text style={[styles.emptyFocusText, { color: textSecondary }]}>No pinned tasks for today.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimelineSubTab = () => {
    const filteredTasks = getFilteredTasksList();
    const activeTimelineTasks = filteredTasks.filter(t => !t.completed);
    
    // Timeline groupings
    const overdueTasks = activeTimelineTasks.filter(t => t.dueDate < todayStr);
    const todayTasks = activeTimelineTasks.filter(t => t.dueDate === todayStr);
    const tomorrowTasks = activeTimelineTasks.filter(t => t.dueDate === tomorrowStr);
    const thisWeekTasks = activeTimelineTasks.filter(t => t.dueDate > tomorrowStr && t.dueDate <= '2026-07-31');
    const laterTasks = activeTimelineTasks.filter(t => t.dueDate > '2026-07-31');

    const renderTaskCard = (item: Task) => {
      const isOverdue = !item.completed && item.dueDate < todayStr;
      const isSelected = selectedTaskIds.includes(item.id);

      return (
        <View key={item.id} style={[
          styles.taskCard,
          {
            backgroundColor: cardBg,
            borderColor: isSelected ? primaryBrown : isOverdue ? errorRed : borderCol,
            borderWidth: isSelected || isOverdue ? 1.5 : 1,
          }
        ]}>
          {/* Checkbox or Multi-select control */}
          {isMultiSelectMode ? (
            <TouchableOpacity 
              onPress={() => toggleSelectTaskId(item.id)}
              style={[styles.checkbox, { borderColor: isSelected ? primaryBrown : borderCol, backgroundColor: isSelected ? primaryBrown : 'transparent' }]}
            >
              {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => handleToggleComplete(item.id)}
              style={[styles.checkbox, { borderColor: borderCol }]}
            >
              {item.completed && <Feather name="check" size={14} color={primaryBrown} />}
            </TouchableOpacity>
          )}

          <View style={styles.taskCardMain}>
            <View style={styles.taskCardHeaderRow}>
              <Text style={[styles.taskSubject, { color: primaryBrown }]}>{item.subject}</Text>
              <View style={styles.taskControlsRow}>
                <TouchableOpacity onPress={() => handleTogglePin(item.id)} style={styles.iconButton}>
                  <Feather name="bookmark" size={13} color={item.isPinned ? primaryBrown : textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleToggleFavorite(item.id)} style={styles.iconButton}>
                  <Feather name="star" size={13} color={item.isFavorite ? warningOrange : textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.taskTitle, { color: textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>

            {item.description ? (
              <Text style={[styles.taskDesc, { color: textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            {/* Task Meta Row */}
            <View style={styles.taskFooter}>
              <View style={[styles.dateBadge, { backgroundColor: borderCol }]}>
                <Feather name="calendar" size={11} color={textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.dateText, { color: textSecondary }]}>{item.dueDate} @ {item.dueTime}</Text>
              </View>

              <View style={[styles.categoryBadge, { backgroundColor: primaryBrown + '12' }]}>
                <Text style={[styles.categoryBadgeText, { color: primaryBrown }]}>{item.category}</Text>
              </View>

              <View style={[styles.difficultyBadge, { backgroundColor: item.difficulty === 'Hard' ? errorRed + '12' : item.difficulty === 'Medium' ? warningOrange + '12' : successGreen + '12' }]}>
                <Text style={[styles.difficultyBadgeText, { color: item.difficulty === 'Hard' ? errorRed : item.difficulty === 'Medium' ? warningOrange : successGreen }]}>
                  {item.difficulty}
                </Text>
              </View>

              {item.attachments > 0 && (
                <View style={styles.attachmentMeta}>
                  <Feather name="paperclip" size={11} color={textSecondary} />
                  <Text style={[styles.attachmentText, { color: textSecondary }]}>{item.attachments}</Text>
                </View>
              )}
            </View>

            {/* Progress line if task has subtasks */}
            {item.subTasks.length > 0 && (
              <View style={styles.taskProgressContainer}>
                <View style={[styles.progressLineBg, { backgroundColor: borderCol }]}>
                  <View 
                    style={[
                      styles.progressLineFill, 
                      { 
                        backgroundColor: primaryBrown, 
                        width: `${Math.round((item.subTasks.filter(s => s.completed).length / item.subTasks.length) * 100)}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>

          {/* Right Action buttons */}
          <View style={styles.taskCardRight}>
            <View style={[styles.priorityDot, { backgroundColor: item.priority === 'High' ? errorRed : item.priority === 'Medium' ? warningOrange : successGreen }]} />
            
            <TouchableOpacity onPress={() => openFocusMode(item)} style={[styles.focusShortcutBtn, { backgroundColor: primaryBrown + '12' }]}>
              <Feather name="target" size={14} color={primaryBrown} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.trashShortcutBtn}>
              <Feather name="trash-2" size={13} color={errorRed} />
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.timelineContainer}>
        {/* Bulk select action header bar */}
        {isMultiSelectMode && (
          <View style={[styles.bulkActionBar, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.bulkActionText, { color: textPrimary }]}>{selectedTaskIds.length} Selected</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={handleBulkComplete} style={[styles.bulkBtn, { backgroundColor: successGreen }]}>
                <Text style={styles.bulkBtnText}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkDelete} style={[styles.bulkBtn, { backgroundColor: errorRed }]}>
                <Text style={styles.bulkBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setIsMultiSelectMode(false); setSelectedTaskIds([]); }} style={[styles.bulkBtn, { backgroundColor: borderCol }]}>
                <Text style={[styles.bulkBtnText, { color: textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filter Pills list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            onPress={() => setIsMultiSelectMode(!isMultiSelectMode)} 
            style={[styles.filterPill, { backgroundColor: isMultiSelectMode ? primaryBrown : cardBg, borderColor: borderCol }]}
          >
            <Feather name="list" size={13} color={isMultiSelectMode ? '#FFFFFF' : textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, { color: isMultiSelectMode ? '#FFFFFF' : textSecondary }]}>Select</Text>
          </TouchableOpacity>

          {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, { backgroundColor: isActive ? primaryBrown : cardBg, borderColor: borderCol }]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterPillText, { color: isActive ? '#FFFFFF' : textSecondary }]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.timelineSectionTitle, { color: errorRed }]}>⚠️ Overdue Deadlines</Text>
            {overdueTasks.map(renderTaskCard)}
          </View>
        )}

        {/* Today */}
        <View style={styles.timelineSection}>
          <Text style={[styles.timelineSectionTitle, { color: textPrimary }]}>📅 Today</Text>
          {todayTasks.length > 0 ? todayTasks.map(renderTaskCard) : (
            <Text style={[styles.emptyTimelineText, { color: textSecondary }]}>No tasks scheduled for today.</Text>
          )}
        </View>

        {/* Tomorrow */}
        <View style={styles.timelineSection}>
          <Text style={[styles.timelineSectionTitle, { color: textPrimary }]}>📅 Tomorrow</Text>
          {tomorrowTasks.length > 0 ? tomorrowTasks.map(renderTaskCard) : (
            <Text style={[styles.emptyTimelineText, { color: textSecondary }]}>No tasks scheduled for tomorrow.</Text>
          )}
        </View>

        {/* This Week */}
        {thisWeekTasks.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.timelineSectionTitle, { color: textPrimary }]}>📅 This Week</Text>
            {thisWeekTasks.map(renderTaskCard)}
          </View>
        )}

        {/* Later */}
        {laterTasks.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.timelineSectionTitle, { color: textPrimary }]}>📅 Later</Text>
            {laterTasks.map(renderTaskCard)}
          </View>
        )}

        {/* Empty State */}
        {activeTimelineTasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={48} color={successGreen} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitleText, { color: textPrimary }]}>🎉 You&apos;re all caught up!</Text>
            <Text style={[styles.emptySubText, { color: textSecondary }]}>Enjoy your free study time.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSubjectsSubTab = () => {
    return (
      <View style={styles.subjectsContainer}>
        {SUBJECTS.map(sub => {
          const stats = getSubjectBreakdown(sub);
          if (stats.total === 0) return null;

          return (
            <View key={sub} style={[styles.subjectCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.subjectCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subjectCardTitle, { color: textPrimary }]}>{sub}</Text>
                  <Text style={[styles.subjectCardSubtitle, { color: textSecondary }]}>
                    {stats.remainingTasks} active task{stats.remainingTasks === 1 ? '' : 's'} remaining
                  </Text>
                </View>
                <View style={[styles.subjectPercentBadge, { backgroundColor: primaryBrown + '12' }]}>
                  <Text style={[styles.subjectPercentText, { color: primaryBrown }]}>{stats.completionPercent}%</Text>
                </View>
              </View>

              {/* Progress Line */}
              <View style={[styles.progressLineBg, { backgroundColor: borderCol, marginVertical: 12 }]}>
                <View style={[styles.progressLineFill, { backgroundColor: primaryBrown, width: `${stats.completionPercent}%` }]} />
              </View>

              {/* Counts Grid */}
              <View style={styles.subjectMetricsRow}>
                <View style={styles.metricItem}>
                  <Feather name="file-text" size={13} color={textSecondary} style={{ marginBottom: 2 }} />
                  <Text style={[styles.metricCount, { color: textPrimary }]}>{stats.assignments}</Text>
                  <Text style={[styles.metricLabel, { color: textSecondary }]}>Assignments</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderCol }]} />
                <View style={styles.metricItem}>
                  <Feather name="clipboard" size={13} color={textSecondary} style={{ marginBottom: 2 }} />
                  <Text style={[styles.metricCount, { color: textPrimary }]}>{stats.projects}</Text>
                  <Text style={[styles.metricLabel, { color: textSecondary }]}>Projects</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderCol }]} />
                <View style={styles.metricItem}>
                  <Feather name="edit-3" size={13} color={textSecondary} style={{ marginBottom: 2 }} />
                  <Text style={[styles.metricCount, { color: textPrimary }]}>{stats.quizzes}</Text>
                  <Text style={[styles.metricLabel, { color: textSecondary }]}>Quizzes</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAnalyticsSubTab = () => {
    return (
      <View style={styles.analyticsContainer}>
        {/* Metric widgets grid */}
        <View style={styles.analyticsGrid}>
          <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Feather name="award" size={18} color={primaryBrown} />
            <Text style={[styles.analyticsNum, { color: textPrimary }]}>87%</Text>
            <Text style={[styles.analyticsLabel, { color: textSecondary }]}>On-Time Completion</Text>
          </View>
          <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Feather name="clock" size={18} color={primaryBrown} />
            <Text style={[styles.analyticsNum, { color: textPrimary }]}>2.4 hrs</Text>
            <Text style={[styles.analyticsLabel, { color: textSecondary }]}>Avg Study Duration</Text>
          </View>
          <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Feather name="zap" size={18} color={primaryBrown} />
            <Text style={[styles.analyticsNum, { color: textPrimary }]}>5 Days</Text>
            <Text style={[styles.analyticsLabel, { color: textSecondary }]}>Productivity Streak</Text>
          </View>
          <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Feather name="calendar" size={18} color={primaryBrown} />
            <Text style={[styles.analyticsNum, { color: textPrimary }]}>Wednesdays</Text>
            <Text style={[styles.analyticsLabel, { color: textSecondary }]}>Most Active Day</Text>
          </View>
        </View>

        {/* Completion Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionHeadingTitle, { color: textPrimary, marginBottom: 16 }]}>📊 Weekly Completion Rate</Text>
          <View style={styles.chartContainer}>
            {[
              { day: 'M', completed: 3 },
              { day: 'T', completed: 5 },
              { day: 'W', completed: 8 },
              { day: 'T', completed: 4 },
              { day: 'F', completed: 6 },
              { day: 'S', completed: 2 },
              { day: 'S', completed: 5 },
            ].map((item, idx) => {
              // Height calculated based on max completed tasks
              const barHeight = (item.completed / 10) * 120;
              return (
                <View key={idx} style={styles.chartBarCol}>
                  <View style={styles.chartBarWrapper}>
                    <View style={[styles.chartBarFill, { backgroundColor: primaryBrown, height: barHeight }]} />
                  </View>
                  <Text style={[styles.chartBarLabel, { color: textSecondary }]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={styles.badgesSection}>
          <Text style={[styles.sectionHeadingTitle, { color: textPrimary, marginBottom: 12 }]}>🏆 Earned Achievements</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badgeItemCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={[styles.badgeIconBg, { backgroundColor: primaryBrown + '12' }]}>
                <Feather name="award" size={18} color={primaryBrown} />
              </View>
              <Text style={[styles.badgeCardTitle, { color: textPrimary }]}>Streak Master</Text>
              <Text style={[styles.badgeCardSubtitle, { color: textSecondary }]}>5+ task completion streak.</Text>
            </View>
            <View style={[styles.badgeItemCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={[styles.badgeIconBg, { backgroundColor: primaryBrown + '12' }]}>
                <Feather name="zap" size={18} color={primaryBrown} />
              </View>
              <Text style={[styles.badgeCardTitle, { color: textPrimary }]}>Early Bird</Text>
              <Text style={[styles.badgeCardSubtitle, { color: textSecondary }]}>Finished 2 days early.</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      
      {/* Sticky Header Section */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openDrawer} style={{ marginRight: 10, padding: 4 }}>
            <Feather name="menu" size={24} color={textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerGreeting, { color: textPrimary }]}>Hello, Vience!</Text>
            <Text style={[styles.headerDate, { color: textSecondary }]}>Saturday, July 25</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsSearching(!isSearching)} style={styles.headerBtn}>
            <Feather name={isSearching ? 'x' : 'search'} size={20} color={textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Feather name="bell" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Search Box */}
      {isSearching && (
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Feather name="search" size={16} color={textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search title, details, subjects..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
        </View>
      )}

      {/* Next-Gen Sub Navigation Bar */}
      <View style={[styles.subTabBar, { borderColor: borderCol }]}>
        <TouchableOpacity 
          onPress={() => setActiveSubTab('overview')} 
          style={[styles.subTabItem, activeSubTab === 'overview' && { borderBottomColor: primaryBrown }]}
        >
          <Text style={[styles.subTabText, { color: activeSubTab === 'overview' ? textPrimary : textSecondary, fontWeight: activeSubTab === 'overview' ? 'bold' : 'normal' }]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveSubTab('timeline')} 
          style={[styles.subTabItem, activeSubTab === 'timeline' && { borderBottomColor: primaryBrown }]}
        >
          <Text style={[styles.subTabText, { color: activeSubTab === 'timeline' ? textPrimary : textSecondary, fontWeight: activeSubTab === 'timeline' ? 'bold' : 'normal' }]}>
            Timeline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveSubTab('subjects')} 
          style={[styles.subTabItem, activeSubTab === 'subjects' && { borderBottomColor: primaryBrown }]}
        >
          <Text style={[styles.subTabText, { color: activeSubTab === 'subjects' ? textPrimary : textSecondary, fontWeight: activeSubTab === 'subjects' ? 'bold' : 'normal' }]}>
            Subjects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveSubTab('analytics')} 
          style={[styles.subTabItem, activeSubTab === 'analytics' && { borderBottomColor: primaryBrown }]}
        >
          <Text style={[styles.subTabText, { color: activeSubTab === 'analytics' ? textPrimary : textSecondary, fontWeight: activeSubTab === 'analytics' ? 'bold' : 'normal' }]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Sub Tab Scroll Container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[primaryBrown]} />
        }
      >
        {activeSubTab === 'overview' && renderOverviewSubTab()}
        {activeSubTab === 'timeline' && renderTimelineSubTab()}
        {activeSubTab === 'subjects' && renderSubjectsSubTab()}
        {activeSubTab === 'analytics' && renderAnalyticsSubTab()}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryBrown }]}
        onPress={() => {
          resetForm();
          setIsAdding(true);
        }}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Focus Mode Modal (Pomodoro Timer) */}
      <Modal
        visible={isFocusActive}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFocusActive(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: borderCol, height: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>🧘 Focus Session</Text>
                <Text style={[styles.focusCardSub, { color: textSecondary, marginTop: 2 }]}>
                  {focusedTask?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setIsTimerRunning(false); setIsFocusActive(false); }} style={styles.closeBtn}>
                <Feather name="x" size={22} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pomodoro Timer circle widget */}
              <View style={styles.timerContainer}>
                <View style={[styles.timerCircle, { borderColor: primaryBrown }]}>
                  <Text style={[styles.timerText, { color: textPrimary }]}>{formatTimer(pomodoroTime)}</Text>
                  <Text style={[styles.timerSubText, { color: textSecondary }]}>Pomodoro session</Text>
                </View>

                {/* Timer Controls */}
                <View style={styles.timerControls}>
                  <TouchableOpacity 
                    onPress={() => setIsTimerRunning(!isTimerRunning)} 
                    style={[styles.timerBtn, { backgroundColor: isTimerRunning ? warningOrange : successGreen }]}
                  >
                    <Feather name={isTimerRunning ? 'pause' : 'play'} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.timerBtnText}>{isTimerRunning ? 'Pause' : 'Start Focus'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => { setIsTimerRunning(false); setPomodoroTime(25 * 60); }} 
                    style={[styles.timerBtn, { backgroundColor: borderCol }]}
                  >
                    <Feather name="rotate-ccw" size={16} color={textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Study Hours Estimator */}
              <View style={[styles.detailSection, { borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 16 }]}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Estimated Study Duration</Text>
                <Text style={[styles.focusDurationText, { color: textPrimary }]}>
                  {focusedTask?.duration} hour{focusedTask?.duration === 1 ? '' : 's'} allocated
                </Text>
              </View>

              {/* Sub-Tasks Checklist */}
              {focusedTask && focusedTask.subTasks.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={[styles.inputLabel, { color: textSecondary, marginBottom: 10 }]}>Sub-tasks Checklist</Text>
                  {focusedTask.subTasks.map(sub => (
                    <TouchableOpacity 
                      key={sub.id} 
                      style={styles.focusSubTaskRow}
                      onPress={() => toggleFocusSubTask(sub.id)}
                    >
                      <View style={[styles.checkbox, { width: 18, height: 18, marginRight: 10, borderColor: borderCol, backgroundColor: sub.completed ? primaryBrown + '12' : 'transparent' }]}>
                        {sub.completed && <Feather name="check" size={12} color={primaryBrown} />}
                      </View>
                      <Text style={[styles.focusSubTaskText, { color: sub.completed ? textSecondary : textPrimary, textDecorationLine: sub.completed ? 'line-through' : 'none' }]}>
                        {sub.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Notes */}
              <View style={styles.detailSection}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Study Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  placeholder="Draft outlines, reference citations, or reminders..."
                  placeholderTextColor={textSecondary}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              {/* Resources list */}
              <View style={[styles.detailSection, { marginBottom: 30 }]}>
                <Text style={[styles.inputLabel, { color: textSecondary, marginBottom: 8 }]}>Study Resources</Text>
                <View style={[styles.resourceItem, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <Feather name="link-2" size={14} color={primaryBrown} style={{ marginRight: 8 }} />
                  <Text style={[styles.resourceText, { color: textPrimary }]}>Google Scholar PDF Reference Docs</Text>
                </View>
                <View style={[styles.resourceItem, { backgroundColor: inputBg, borderColor: borderCol, marginTop: 8 }]}>
                  <Feather name="book-open" size={14} color={primaryBrown} style={{ marginRight: 8 }} />
                  <Text style={[styles.resourceText, { color: textPrimary }]}>Lecture Notes Chapter 5 & 6</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Task Creation Modal */}
      <Modal
        visible={isAdding}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAdding(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: borderCol, height: '90%' }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Create Student Task</Text>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.closeBtn}>
                  <Feather name="x" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Subject Selection */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Subject Course</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
                  {SUBJECTS.map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.toggleSelectBtn,
                        {
                          backgroundColor: newSubject === sub ? primaryBrown : inputBg,
                          borderColor: borderCol,
                        },
                      ]}
                      onPress={() => setNewSubject(sub)}
                    >
                      <Text style={[styles.toggleSelectText, { color: newSubject === sub ? '#FFFFFF' : textPrimary }]}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Title */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Task Title</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  placeholder="e.g., Write capstone methodology draft"
                  placeholderTextColor={textSecondary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus={true}
                />

                {/* Description */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Description details</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  placeholder="Optional notes, instructions, or hyperlinks..."
                  placeholderTextColor={textSecondary}
                  multiline={true}
                  numberOfLines={3}
                  value={newDesc}
                  onChangeText={setNewDesc}
                />

                {/* Category Selection */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Category</Text>
                <View style={styles.gridRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.gridBtn,
                        {
                          backgroundColor: newCategory === cat ? primaryBrown : inputBg,
                          borderColor: borderCol,
                        },
                      ]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={[styles.gridBtnText, { color: newCategory === cat ? '#FFFFFF' : textPrimary }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Priority Selection */}
                <Text style={[styles.inputLabel, { color: textSecondary, marginTop: 12 }]}>Priority Rating</Text>
                <View style={styles.toggleRow}>
                  {(['High', 'Medium', 'Low'] as Task['priority'][]).map((pr) => (
                    <TouchableOpacity
                      key={pr}
                      style={[
                        styles.toggleSelectBtn,
                        {
                          flex: 1,
                          backgroundColor: newPriority === pr 
                            ? pr === 'High' ? errorRed : pr === 'Medium' ? warningOrange : successGreen
                            : inputBg,
                          borderColor: borderCol,
                        },
                      ]}
                      onPress={() => setNewPriority(pr)}
                    >
                      <Text style={[styles.toggleSelectText, { color: newPriority === pr ? '#FFFFFF' : textPrimary }]}>
                        {pr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Difficulty Selection */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Difficulty Rating</Text>
                <View style={styles.toggleRow}>
                  {(['Hard', 'Medium', 'Easy'] as Task['difficulty'][]).map((dif) => (
                    <TouchableOpacity
                      key={dif}
                      style={[
                        styles.toggleSelectBtn,
                        {
                          flex: 1,
                          backgroundColor: newDifficulty === dif ? primaryBrown : inputBg,
                          borderColor: borderCol,
                        },
                      ]}
                      onPress={() => setNewDifficulty(dif)}
                    >
                      <Text style={[styles.toggleSelectText, { color: newDifficulty === dif ? '#FFFFFF' : textPrimary }]}>
                        {dif}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Duration Picker */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Estimated Duration (Hours)</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  placeholder="e.g., 2.5"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  value={newDuration}
                  onChangeText={setNewDuration}
                />

                {/* Date & Time */}
                <View style={styles.dateTimeContainer}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>Due Date</Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={textSecondary}
                      value={newDueDate}
                      onChangeText={setNewDueDate}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>Time</Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                      placeholder="HH:MM"
                      placeholderTextColor={textSecondary}
                      value={newDueTime}
                      onChangeText={setNewDueTime}
                    />
                  </View>
                </View>

                {/* Subtask Inputs checklist creation */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Add Sub-tasks</Text>
                <View style={styles.subtaskBuilderRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                    placeholder="Sub-task description..."
                    placeholderTextColor={textSecondary}
                    value={newSubTaskInput}
                    onChangeText={setNewSubTaskInput}
                  />
                  <TouchableOpacity onPress={addSubTaskToForm} style={[styles.addSubtaskBtn, { backgroundColor: primaryBrown }]}>
                    <Feather name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Subtasks List */}
                {newSubTasksList.map((item, idx) => (
                  <View key={idx} style={[styles.subtaskBuilderListItem, { borderColor: borderCol }]}>
                    <Text style={[styles.subtaskListItemText, { color: textPrimary }]}>{item}</Text>
                    <TouchableOpacity onPress={() => removeSubTaskFromForm(idx)}>
                      <Feather name="trash-2" size={14} color={errorRed} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Reminder Settings */}
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Feather name="bell" size={16} color={primaryBrown} style={{ marginRight: 8 }} />
                    <Text style={[styles.switchLabel, { color: textPrimary }]}>Enable Reminder Alert</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.customSwitch,
                      { backgroundColor: newHasReminder ? successGreen : borderCol }
                    ]}
                    onPress={() => setNewHasReminder(!newHasReminder)}
                  >
                    <View style={[styles.switchKnob, { alignSelf: newHasReminder ? 'flex-end' : 'flex-start' }]} />
                  </TouchableOpacity>
                </View>

                {/* Repeat Select */}
                <Text style={[styles.inputLabel, { color: textSecondary, marginTop: 12 }]}>Repeat Recurrence</Text>
                <View style={styles.toggleRow}>
                  {(['None', 'Daily', 'Weekly', 'Monthly'] as Task['repeat'][]).map((rep) => (
                    <TouchableOpacity
                      key={rep}
                      style={[
                        styles.toggleSelectBtn,
                        {
                          flex: 1,
                          backgroundColor: newRepeat === rep ? primaryBrown : inputBg,
                          borderColor: borderCol,
                        },
                      ]}
                      onPress={() => setNewRepeat(rep)}
                    >
                      <Text style={[styles.toggleSelectText, { color: newRepeat === rep ? '#FFFFFF' : textPrimary }]}>
                        {rep}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: primaryBrown }]}
                  onPress={handleCreateTask}
                >
                  <Text style={styles.saveBtnText}>Save Task</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerDate: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    marginLeft: 16,
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    height: '100%',
  },
  subTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1.5,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  subTabItem: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    flex: 1,
  },
  subTabText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  overviewContainer: {
    paddingHorizontal: 24,
  },
  motivationBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  motivationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  motivationQuote: {
    fontSize: 11,
    lineHeight: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  workloadLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  overviewCardSubText: {
    fontSize: 9,
  },
  completionPercentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  progressLineBg: {
    height: 5,
    width: '100%',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  insightsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeadingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  insightBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  insightText: {
    fontSize: 12,
    flex: 1,
  },
  heatmapCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  heatmapCellContainer: {
    alignItems: 'center',
    width: '13%',
    marginBottom: 10,
  },
  heatmapCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginBottom: 4,
  },
  heatmapCellText: {
    fontSize: 9,
    fontWeight: '600',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECEDEE30',
    paddingTop: 10,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  focusBlock: {
    marginBottom: 20,
  },
  focusTaskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  focusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  focusCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  focusCardSub: {
    fontSize: 11,
  },
  emptyFocusCard: {
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyFocusText: {
    fontSize: 12,
  },
  timelineContainer: {
    paddingHorizontal: 24,
  },
  bulkActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  bulkBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterScroll: {
    height: 40,
    marginBottom: 16,
  },
  filterPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    flexDirection: 'row',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineSection: {
    marginBottom: 20,
  },
  timelineSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyTimelineText: {
    fontSize: 12,
    marginLeft: 4,
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  taskCardMain: {
    flex: 1,
    marginLeft: 12,
  },
  taskCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  taskSubject: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskControlsRow: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 4,
    marginLeft: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 12,
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  attachmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  attachmentText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  taskProgressContainer: {
    marginTop: 10,
  },
  taskCardRight: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  focusShortcutBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  trashShortcutBtn: {
    padding: 4,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  subjectsContainer: {
    paddingHorizontal: 24,
  },
  subjectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  subjectPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subjectMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECEDEE20',
    paddingTop: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  analyticsContainer: {
    paddingHorizontal: 24,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  analyticsNum: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  analyticsLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 10,
  },
  chartBarCol: {
    alignItems: 'center',
    width: '12%',
  },
  chartBarWrapper: {
    height: 120,
    width: 8,
    backgroundColor: '#ECEDEE20',
    borderRadius: 4,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  badgesSection: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItemCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  badgeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeCardSubtitle: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  timerSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBtn: {
    flexDirection: 'row',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  timerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  detailSection: {
    marginVertical: 12,
  },
  focusDurationText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  focusSubTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  focusSubTaskText: {
    fontSize: 13,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  resourceText: {
    fontSize: 12,
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  subjectRow: {
    marginBottom: 16,
    height: 44,
  },
  toggleSelectBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleSelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  gridBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  gridBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subtaskBuilderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSubtaskBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  subtaskBuilderListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  subtaskListItemText: {
    fontSize: 13,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: 28,
  },
});
