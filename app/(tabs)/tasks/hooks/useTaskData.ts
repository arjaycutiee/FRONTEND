import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { localDb, Task, SubTask } from '@/app/services/localDb';
import { TaskSubTab, TaskCategory, TaskPriority, TaskDifficulty, TaskRepeat } from '../types';
import { todayISO, addDaysISO } from '@/utils/date';

export function useTaskData() {
  const [activeSubTab, setActiveSubTab] = useState<TaskSubTab>('overview');
  const [tasks, setTasksState] = useState<Task[]>(() => localDb.getTasks());

  const setTasks = useCallback((newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    const updated = typeof newTasks === 'function' ? newTasks(localDb.getTasks()) : newTasks;
    localDb.setTasks(updated);
    setTasksState(updated);
  }, []);

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
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('Capstone Paper');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Academic');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('Medium');
  const [newDuration, setNewDuration] = useState('1.5');
  const [newDueDate, setNewDueDate] = useState(() => todayISO());
  const [newDueTime, setNewDueTime] = useState('12:00');
  const [newHasReminder, setNewHasReminder] = useState(false);
  const [newRepeat, setNewRepeat] = useState<TaskRepeat>('None');
  const [newSubTaskInput, setNewSubTaskInput] = useState('');
  const [newSubTasksList, setNewSubTasksList] = useState<string[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeTasks = tasks.filter((t) => !t.completed);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const estimatedRemainingHours = activeTasks.reduce((sum, item) => sum + item.duration, 0);

  // Workload Meter Math
  const getWorkloadLevel = useCallback(() => {
    const totalActive = activeTasks.length;
    const highPriorityCount = activeTasks.filter((t) => t.priority === 'High').length;
    if (totalActive >= 6 || highPriorityCount >= 3) {
      return { level: 'Heavy', color: '#EF4444', desc: 'High stress level detected. Prioritize critical deadlines first.' };
    } else if (totalActive >= 3 || highPriorityCount >= 1) {
      return { level: 'Moderate', color: '#F59E0B', desc: 'Balanced workload. Keep steady study sessions.' };
    }
    return { level: 'Light', color: '#10B981', desc: 'Great job! Workload is well managed and relaxed.' };
  }, [activeTasks]);

  // Real dates from the device clock
  const todayStr = todayISO();
  const tomorrowStr = addDaysISO(todayStr, 1);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesSubject = task.subject.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
      }

      // Filter Pills
      if (activeFilter === 'Today') return task.dueDate === todayStr && !task.completed;
      if (activeFilter === 'Tomorrow') return task.dueDate === tomorrowStr && !task.completed;
      if (activeFilter === 'Priority') return task.priority === 'High' && !task.completed;
      if (activeFilter === 'Difficulty') return task.difficulty === 'Hard' && !task.completed;
      if (activeFilter === 'Completed') return task.completed;
      return true;
    });
  }, [tasks, searchQuery, activeFilter, todayStr, tomorrowStr]);

  // Timeline segmented tasks
  const overdueTasks = useMemo(() => tasks.filter((t) => t.dueDate < todayStr && !t.completed), [tasks, todayStr]);
  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayStr && !t.completed), [tasks, todayStr]);
  const tomorrowTasks = useMemo(() => tasks.filter((t) => t.dueDate === tomorrowStr && !t.completed), [tasks, tomorrowStr]);
  const upcomingTasks = useMemo(() => tasks.filter((t) => t.dueDate > tomorrowStr && !t.completed), [tasks, tomorrowStr]);
  const completedTasksList = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  // Task Actions
  const toggleTask = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      );
    },
    [setTasks]
  );

  const toggleSubTask = useCallback(
    (taskId: string, subTaskId: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const updatedSubs = t.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...t, subTasks: updatedSubs };
          }
          return t;
        })
      );
    },
    [setTasks]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            if (focusedTask?.id === taskId) {
              setIsFocusActive(false);
              setFocusedTask(null);
            }
          },
        },
      ]);
    },
    [focusedTask, setTasks]
  );

  const handleTogglePin = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isPinned: !t.isPinned } : t))
      );
    },
    [setTasks]
  );

  const handleToggleFavorite = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isFavorite: !t.isFavorite } : t))
      );
    },
    [setTasks]
  );

  // Multi-select helpers
  const toggleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleBulkComplete = useCallback(() => {
    setTasks((prev) =>
      prev.map((t) => (selectedTaskIds.includes(t.id) ? { ...t, completed: true } : t))
    );
    setSelectedTaskIds([]);
    setIsMultiSelectMode(false);
  }, [selectedTaskIds, setTasks]);

  const handleBulkDelete = useCallback(() => {
    Alert.alert('Bulk Delete', `Delete ${selectedTaskIds.length} selected tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: () => {
          setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
          setSelectedTaskIds([]);
          setIsMultiSelectMode(false);
        },
      },
    ]);
  }, [selectedTaskIds, setTasks]);

  // Focus timer actions
  const handleFocusOnTask = useCallback((task: Task) => {
    setFocusedTask(task);
    setPomodoroTime(25 * 60);
    setIsTimerRunning(false);
    setIsFocusActive(true);
  }, []);

  const handleToggleTimer = useCallback(() => {
    setIsTimerRunning((prev) => !prev);
  }, []);

  const handleResetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setPomodoroTime(25 * 60);
  }, []);

  const handleCloseFocus = useCallback(() => {
    setIsTimerRunning(false);
    setIsFocusActive(false);
    setFocusedTask(null);
  }, []);

  // Subtask Builder helpers for creation
  const handleAddSubTaskToList = useCallback(() => {
    if (!newSubTaskInput.trim()) return;
    setNewSubTasksList((prev) => [...prev, newSubTaskInput.trim()]);
    setNewSubTaskInput('');
  }, [newSubTaskInput]);

  const handleRemoveSubTaskFromList = useCallback((idx: number) => {
    setNewSubTasksList((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Create Task
  const handleCreateTask = useCallback(() => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const subTasksFormatted: SubTask[] = newSubTasksList.map((st, i) => ({
      id: `${Date.now()}-${i}`,
      title: st,
      completed: false,
    }));

    const created: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim() || 'No detailed description provided.',
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
      subTasks: subTasksFormatted,
      createdAt: Date.now(),
    };

    setTasks((prev) => [created, ...prev]);

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewSubTasksList([]);
    setNewSubTaskInput('');
    setIsAdding(false);
  }, [
    newTitle,
    newDesc,
    newSubject,
    newCategory,
    newPriority,
    newDifficulty,
    newDuration,
    newDueDate,
    newDueTime,
    newHasReminder,
    newRepeat,
    newSubTasksList,
    setTasks,
  ]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  return {
    tasks,
    filteredTasks,
    activeSubTab,
    setActiveSubTab,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isSearching,
    setIsSearching,
    isMultiSelectMode,
    setIsMultiSelectMode,
    selectedTaskIds,
    toggleSelectTask,
    handleBulkComplete,
    handleBulkDelete,
    isAdding,
    setIsAdding,
    isRefreshing,
    handleRefresh,
    focusedTask,
    isFocusActive,
    pomodoroTime,
    isTimerRunning,
    handleFocusOnTask,
    handleToggleTimer,
    handleResetTimer,
    handleCloseFocus,
    totalTasks,
    completedTasks,
    activeTasks,
    completionRate,
    estimatedRemainingHours,
    getWorkloadLevel,
    overdueTasks,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    completedTasksList,
    toggleTask,
    toggleSubTask,
    handleDeleteTask,
    handleTogglePin,
    handleToggleFavorite,
    // Add Form Fields
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newSubject,
    setNewSubject,
    newCategory,
    setNewCategory,
    newPriority,
    setNewPriority,
    newDifficulty,
    setNewDifficulty,
    newDuration,
    setNewDuration,
    newDueDate,
    setNewDueDate,
    newDueTime,
    setNewDueTime,
    newHasReminder,
    setNewHasReminder,
    newRepeat,
    setNewRepeat,
    newSubTaskInput,
    setNewSubTaskInput,
    newSubTasksList,
    handleAddSubTaskToList,
    handleRemoveSubTaskFromList,
    handleCreateTask,
  };
}
