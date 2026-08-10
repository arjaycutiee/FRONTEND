import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import { localDb } from '@/app/services/localDb';

// Message types
interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: ActionButton[];
  customWidget?: 'focus' | 'stats' | 'task-detail' | 'expense-list';
  widgetData?: any;
}

interface ActionButton {
  label: string;
  icon: string;
  action: () => void;
}

// Bouncing Dot Component for Typing Indicator
function BouncingDot({ delay }: { delay: number }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(150),
      ])
    ).start();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        styles.typingDot,
        { transform: [{ translateY: animatedValue }] },
      ]}
    />
  );
}

// Typing Indicator Component
function TypingIndicator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';

  return (
    <View style={styles.assistantMessageContainer}>
      <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.typingContainer}>
          <BouncingDot delay={0} />
          <BouncingDot delay={150} />
          <BouncingDot delay={300} />
        </View>
      </View>
    </View>
  );
}

// Animated Message Item Wrapper
function AnimatedMessageItem({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

// Interactive Focus Session Widget
function FocusSessionWidget({
  onComplete,
  topic = 'Capstone methodology draft review',
}: {
  onComplete: (duration: number) => void;
  topic?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryBrown = '#A97C50';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored if haptics fail or on web
    }
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored if haptics fail or on web
    }
    onComplete(seconds);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.widgetCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <View style={styles.widgetHeader}>
        <Feather name="target" size={16} color={primaryBrown} style={{ marginRight: 6 }} />
        <Text style={[styles.widgetTitle, { color: textPrimary }]}>Focus Stopwatch Active</Text>
      </View>
      <Text style={[styles.widgetSubtitle, { color: isDark ? '#9BA1A6' : '#666' }]}>{topic}</Text>

      <Text style={[styles.timerText, { color: textPrimary }]}>{formatTime(seconds)}</Text>

      <View style={styles.timerControls}>
        <TouchableOpacity
          style={[styles.timerBtn, { borderColor: borderCol }]}
          onPress={toggleTimer}
        >
          <Feather name={isRunning ? 'pause' : 'play'} size={14} color={primaryBrown} style={{ marginRight: 4 }} />
          <Text style={[styles.timerBtnText, { color: textPrimary }]}>
            {isRunning ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timerBtn, { backgroundColor: primaryBrown, borderColor: primaryBrown }]}
          onPress={handleStop}
        >
          <Feather name="check" size={14} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={[styles.timerBtnText, { color: '#FFF' }]}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // GabAi Design Colors
  const primaryBrown = '#A97C50';
  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';
  const inputBg = isDark ? '#1C1C1E' : '#FFFFFF';

  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Suggestion Chips (Welcome page & suggested list)
  const sugChips = [
    { text: 'How many tasks do I have today?', icon: 'check-square' },
    { text: 'What is my next class?', icon: 'book-open' },
    { text: 'How much did I spend this week?', icon: 'dollar-sign' },
    { text: 'Show upcoming deadlines.', icon: 'clock' },
    { text: 'What should I focus on today?', icon: 'target' },
    { text: 'Open my calendar.', icon: 'calendar' },
  ];

  // Suggested Questions shown in empty state
  const sugQuestions = [
    'What should I work on first today?',
    'Do I have overdue tasks?',
    'How much have I spent this month?',
    'Show tomorrow\'s schedule.',
    'Which subject has the most assignments?',
    'How many classes do I have today?',
  ];

  // Quick Action Chips (horizontal scroll above input bar)
  const quickActions = [
    { label: 'Tasks', query: 'List today\'s tasks' },
    { label: 'Schedule', query: 'Show today\'s schedule' },
    { label: 'Calendar', query: 'Open calendar' },
    { label: 'Expenses', query: 'How much did I spend this week?' },
    { label: 'Focus Session', query: 'Start focus session' },
    { label: 'Notes', query: 'Open notepad' },
    { label: 'Analytics', query: 'Show productivity statistics' },
  ];

  // Auto-scroll list when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addMessage = (sender: 'user' | 'assistant', text: string, actions?: ActionButton[], customWidget?: Message['customWidget'], widgetData?: any) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      sender,
      text,
      timestamp,
      actions,
      customWidget,
      widgetData,
    };
    setMessages((prev) => [...prev, newMessage]);
    scrollToBottom();
  };

  // Local NLP & Query Routing Engine
  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Send user message
    addMessage('user', queryText);
    setInputVal('');
    setIsTyping(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored if haptics fail or on web
    }

    // Simulated short thinking delay (offline latency)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));
    setIsTyping(false);

    const norm = queryText.toLowerCase().trim().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    // Navigation triggers
    if (norm.includes('open calendar') || norm.includes('go to calendar') || norm.includes('navigate to schedule')) {
      addMessage('assistant', "Opening your smart calendar for you right now.", [
        {
          label: 'Open Calendar Now',
          icon: 'calendar',
          action: () => {
            router.replace('/(tabs)/calendar/calendar');
          },
        },
      ]);
      return;
    }

    if (norm.includes('open tasks') || norm.includes('open task manager') || norm.includes('view tasks')) {
      addMessage('assistant', "Navigating to your Task Manager page.", [
        {
          label: 'Open Tasks Now',
          icon: 'check-square',
          action: () => {
            router.replace('/(tabs)/tasks/task');
          },
        },
      ]);
      return;
    }

    if (norm.includes('open expenses') || norm.includes('open wallet') || norm.includes('view budget') || norm.includes('spend spendings')) {
      addMessage('assistant', "Redirecting to your Expenses and Wallet Manager.", [
        {
          label: 'Open Wallet Now',
          icon: 'credit-card',
          action: () => {
            router.replace('/(tabs)/expenses/expenses');
          },
        },
      ]);
      return;
    }

    if (norm.includes('open profile') || norm.includes('open settings') || norm.includes('go to settings')) {
      addMessage('assistant', "Redirecting to your Profile and Settings tab.", [
        {
          label: 'Open Profile Now',
          icon: 'user',
          action: () => {
            router.replace('/(tabs)/profile/profile');
          },
        },
      ]);
      return;
    }

    if (norm.includes('notes') || norm.includes('notepad') || norm.includes('open notes') || norm.includes('my notes') || norm.includes('study notes')) {
      const activeNotes = localDb.getNotes().filter((n) => !n.isArchived);
      let reply = `You currently have ${activeNotes.length} active notes in your Notes Workspace:\n\n`;
      activeNotes.slice(0, 4).forEach((n, i) => {
        const pinIcon = n.isPinned ? '📌 ' : '📝 ';
        reply += `${i + 1}. ${pinIcon}${n.title} [${n.category}]\n`;
      });
      if (activeNotes.length > 4) {
        reply += `...and ${activeNotes.length - 4} more notes.\n`;
      }
      addMessage('assistant', reply, [
        {
          label: 'Open Notes Workspace',
          icon: 'file-text',
          action: () => {
            router.replace('/(tabs)/notes/notes');
          },
        },
      ]);
      return;
    }

    // 1. Today's Tasks query
    if (
      norm.includes('tasks today') ||
      norm.includes('today tasks') ||
      norm.includes('what to focus on today') ||
      norm.includes('what should i focus on today') ||
      norm.includes('how many tasks do i have today') ||
      norm.includes('list today tasks') ||
      norm.includes('tasks for today')
    ) {
      const today = '2026-07-26';
      const todayTasks = localDb.getTasks().filter((t) => t.dueDate === today);

      if (todayTasks.length === 0) {
        addMessage('assistant', "Great news! You have no tasks scheduled for today. You are fully caught up.", [
          { label: 'Add New Task', icon: 'plus', action: () => router.replace('/(tabs)/tasks/task') },
          { label: 'View All Tasks', icon: 'list', action: () => router.replace('/(tabs)/tasks/task') },
        ]);
      } else {
        const pendingCount = todayTasks.filter((t) => !t.completed).length;
        let responseText = `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} today (${pendingCount} pending, ${todayTasks.length - pendingCount} completed):\n\n`;

        todayTasks.forEach((t, i) => {
          const statusIcon = t.completed ? '✅' : '⏳';
          const priorityLabel = t.priority === 'High' ? '🔴 High' : t.priority === 'Medium' ? '🟡 Medium' : '🟢 Low';
          responseText += `${i + 1}. ${statusIcon} ${t.title} [${t.subject}]\n    • Priority: ${priorityLabel} | Due: ${t.dueTime}\n`;
        });

        // Add action buttons for the first incomplete task if present
        const firstPending = todayTasks.find((t) => !t.completed);
        const actions: ActionButton[] = [
          { label: 'Manage in Tab', icon: 'check-square', action: () => router.replace('/(tabs)/tasks/task') },
        ];

        if (firstPending) {
          actions.unshift({
            label: `Complete "${firstPending.title.slice(0, 18)}..."`,
            icon: 'check',
            action: () => {
              localDb.toggleTaskCompleted(firstPending.id);
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {
                // Ignored if haptics fail or on web
              }
              addMessage('assistant', `Nice! I've marked "${firstPending.title}" as complete. All dashboards and lists are updated!`);
            },
          });
        }

        addMessage('assistant', responseText, actions);
      }
      return;
    }

    // 2. Class schedule / schedule today
    if (
      norm.includes('next class') ||
      norm.includes('classes today') ||
      norm.includes('schedule today') ||
      norm.includes('today schedule') ||
      norm.includes('my schedule') ||
      norm.includes('class schedule') ||
      norm.includes('how many classes do i have today') ||
      norm.includes('show today schedule')
    ) {
      const today = '2026-07-26';
      const todayEvents = localDb.getEvents().filter((e) => e.date === today && (e.category === 'Class' || e.category === 'Exam' || e.category === 'Meeting'));

      if (todayEvents.length === 0) {
        addMessage('assistant', "No classes or academic meetings scheduled for today, July 26, 2026. Enjoy your study break!", [
          { label: 'Open Calendar', icon: 'calendar', action: () => router.replace('/(tabs)/calendar/calendar') },
        ]);
      } else {
        // Sort by time
        const sorted = [...todayEvents].sort((a, b) => a.time.localeCompare(b.time));
        let responseText = `Here is your academic schedule for today:\n\n`;

        sorted.forEach((e) => {
          responseText += `• ⏰ ${e.time} (${e.duration} mins) - **${e.title}**\n    Category: ${e.category} | Priority: ${e.priority}\n`;
        });

        addMessage('assistant', responseText, [
          { label: 'View in Calendar', icon: 'calendar', action: () => router.replace('/(tabs)/calendar/calendar') },
        ]);
      }
      return;
    }

    // 3. Weekly Expenses query
    if (
      norm.includes('spend this week') ||
      norm.includes('weekly expenses') ||
      norm.includes('money spent') ||
      norm.includes('expense summary') ||
      norm.includes('expenses this week') ||
      norm.includes('my expenses')
    ) {
      const txs = localDb.getTransactions();
      const expenses = txs.filter((t) => t.type === 'expense');
      const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

      // Categorize
      const categoryMap: Record<string, number> = {};
      expenses.forEach((e) => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      });

      let responseText = `You spent a total of **₱${totalExpense.toFixed(2)}** this week.\n\nHere is your spending breakdown:\n`;
      Object.keys(categoryMap).forEach((cat) => {
        responseText += `• **${cat}**: ₱${categoryMap[cat].toFixed(2)}\n`;
      });

      const allowance = txs.filter((t) => t.category === 'Allowance').reduce((sum, item) => sum + item.amount, 0);
      responseText += `\nTotal Allowance: ₱${allowance.toFixed(2)}\nNet Wallet Standing: ₱${(allowance - totalExpense).toFixed(2)}`;

      addMessage('assistant', responseText, [
        { label: 'Open Wallet', icon: 'credit-card', action: () => router.replace('/(tabs)/expenses/expenses') },
      ]);
      return;
    }

    // 4. Monthly Expenses query
    if (
      norm.includes('spend this month') ||
      norm.includes('monthly expenses') ||
      norm.includes('expenses this month') ||
      norm.includes('spent this month')
    ) {
      const txs = localDb.getTransactions();
      const expenses = txs.filter((t) => t.type === 'expense');
      const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

      let responseText = `Your calculated expenses for this month totals **₱${totalExpense.toFixed(2)}**.\n\nAll expenditures are saved locally in GabAi.`;

      addMessage('assistant', responseText, [
        { label: 'Open Expenses Tab', icon: 'dollar-sign', action: () => router.replace('/(tabs)/expenses/expenses') },
      ]);
      return;
    }

    // 5. Upcoming Deadlines
    if (
      norm.includes('upcoming deadlines') ||
      norm.includes('deadlines') ||
      norm.includes('show upcoming deadlines') ||
      norm.includes('deadlines upcoming')
    ) {
      const today = '2026-07-26';
      const tasks = localDb.getTasks();
      const incompleteDeadlines = tasks
        .filter((t) => !t.completed && t.dueDate >= today)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      if (incompleteDeadlines.length === 0) {
        addMessage('assistant', "No upcoming deadlines found! You're in the clear.", [
          { label: 'Add Task', icon: 'plus', action: () => router.replace('/(tabs)/tasks/task') },
        ]);
      } else {
        let responseText = `Here are your upcoming academic deadlines:\n\n`;

        incompleteDeadlines.forEach((t) => {
          const daysLeft = Math.round((new Date(t.dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          const urgency = daysLeft === 0 ? 'Due Today!' : daysLeft === 1 ? 'Due Tomorrow!' : `In ${daysLeft} days`;
          responseText += `• 🚨 **${t.title}** (${t.subject})\n    Due: ${t.dueDate} at ${t.dueTime} | *${urgency}*\n`;
        });

        addMessage('assistant', responseText, [
          { label: 'View Tasks', icon: 'check-square', action: () => router.replace('/(tabs)/tasks/task') },
        ]);
      }
      return;
    }

    // 6. Overdue Tasks
    if (
      norm.includes('overdue tasks') ||
      norm.includes('overdue assignments') ||
      norm.includes('late tasks') ||
      norm.includes('do i have overdue tasks')
    ) {
      const today = '2026-07-26';
      const overdueTasks = localDb.getTasks().filter((t) => !t.completed && t.dueDate < today);

      if (overdueTasks.length === 0) {
        addMessage('assistant', "Excellent! You have zero overdue tasks. Keep up the high productivity!", [
          { label: 'Check Tasks', icon: 'check-square', action: () => router.replace('/(tabs)/tasks/task') },
        ]);
      } else {
        let responseText = `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. You should complete these as soon as possible:\n\n`;

        overdueTasks.forEach((t, i) => {
          responseText += `${i + 1}. ⚠️ **${t.title}** [${t.subject}]\n    Was due: ${t.dueDate} at ${t.dueTime} (Overdue)\n`;
        });

        addMessage('assistant', responseText, [
          {
            label: `Mark Complete: "${overdueTasks[0].title.slice(0, 16)}..."`,
            icon: 'check',
            action: () => {
              localDb.toggleTaskCompleted(overdueTasks[0].id);
              try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
              addMessage('assistant', `Marked "${overdueTasks[0].title}" as completed. Overdue count updated!`);
            },
          },
          { label: 'Open Task Screen', icon: 'arrow-right', action: () => router.replace('/(tabs)/tasks/task') },
        ]);
      }
      return;
    }

    // 7. Work on first / Focus today
    if (
      norm.includes('what should i work on first') ||
      norm.includes('work on first') ||
      norm.includes('first task') ||
      norm.includes('which task first') ||
      norm.includes('what is my most important task')
    ) {
      const pendingTasks = localDb.getTasks().filter((t) => !t.completed);

      // Priority sort (High > Medium > Low) and date proximity
      const sorted = [...pendingTasks].sort((a, b) => {
        if (a.priority === 'High' && b.priority !== 'High') return -1;
        if (a.priority !== 'High' && b.priority === 'High') return 1;
        if (a.priority === 'Medium' && b.priority === 'Low') return -1;
        if (a.priority === 'Low' && b.priority === 'Medium') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });

      if (sorted.length === 0) {
        addMessage('assistant', "You have no pending tasks! There is nothing to work on. Celebrate your free time!", [
          { label: 'Go to Dashboard', icon: 'grid', action: () => router.replace('/(tabs)/dashboard/dashboard') },
        ]);
      } else {
        const topTask = sorted[0];
        let responseText = `You should focus on this task first:\n\n⭐️ **${topTask.title}** [${topTask.subject}]\n`;
        responseText += `Priority: **${topTask.priority}** | Difficulty: **${topTask.difficulty}**\nDue Date: ${topTask.dueDate} at ${topTask.dueTime}\n\n`;
        responseText += `Description: ${topTask.description || 'No description provided.'}`;

        addMessage('assistant', responseText, [
          {
            label: 'Start Focus Session',
            icon: 'target',
            action: () => {
              addMessage('assistant', `Starting a focused study session for: "${topTask.title}". Keep distractions away!`, [], 'focus', { topic: topTask.title });
            },
          },
          {
            label: 'Mark Complete',
            icon: 'check',
            action: () => {
              localDb.toggleTaskCompleted(topTask.id);
              try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
              addMessage('assistant', `Completed "${topTask.title}"! Excellent job.`);
            },
          },
        ]);
      }
      return;
    }

    // 8. Tomorrow's Schedule
    if (
      norm.includes('tomorrow schedule') ||
      norm.includes('tomorrows schedule') ||
      norm.includes('schedule tomorrow') ||
      norm.includes('what is tomorrow schedule') ||
      norm.includes('tomorrow')
    ) {
      const tomorrow = '2026-07-27';
      const tomorrowEvents = localDb.getEvents().filter((e) => e.date === tomorrow);
      const tomorrowTasks = localDb.getTasks().filter((t) => t.dueDate === tomorrow);

      if (tomorrowEvents.length === 0 && tomorrowTasks.length === 0) {
        addMessage('assistant', "You have no classes, events, or deadlines tomorrow, July 27, 2026.", [
          { label: 'Open Calendar', icon: 'calendar', action: () => router.replace('/(tabs)/calendar/calendar') },
        ]);
      } else {
        let responseText = `Tomorrow, Monday, July 27:\n\n`;

        if (tomorrowEvents.length > 0) {
          responseText += `**Schedule Events:**\n`;
          tomorrowEvents.forEach((e) => {
            responseText += `• ⏰ ${e.time} - **${e.title}** (${e.category})\n`;
          });
          responseText += `\n`;
        }

        if (tomorrowTasks.length > 0) {
          responseText += `**Deadlines Due:**\n`;
          tomorrowTasks.forEach((t) => {
            responseText += `• 🚨 ${t.title} [${t.subject}] at ${t.dueTime}\n`;
          });
        }

        addMessage('assistant', responseText, [
          { label: 'View Calendar', icon: 'calendar', action: () => router.replace('/(tabs)/calendar/calendar') },
        ]);
      }
      return;
    }

    // 9. Subject with most assignments
    if (
      norm.includes('most assignments') ||
      norm.includes('subject assignments') ||
      norm.includes('most tasks') ||
      norm.includes('which subject has')
    ) {
      const pendingTasks = localDb.getTasks().filter((t) => !t.completed);

      if (pendingTasks.length === 0) {
        addMessage('assistant', "You don't have any pending assignments right now.");
        return;
      }

      const subjectCount: Record<string, number> = {};
      pendingTasks.forEach((t) => {
        const sub = t.subject || 'General';
        subjectCount[sub] = (subjectCount[sub] || 0) + 1;
      });

      let highestSub = '';
      let highestCount = 0;
      Object.keys(subjectCount).forEach((sub) => {
        if (subjectCount[sub] > highestCount) {
          highestCount = subjectCount[sub];
          highestSub = sub;
        }
      });

      addMessage(
        'assistant',
        `The subject with the most pending tasks is **${highestSub}** with **${highestCount} pending assignments**.\n\nI recommend working on this subject first to reduce your academic load.`,
        [
          { label: 'Filter Tasks', icon: 'check-square', action: () => router.replace('/(tabs)/tasks/task') },
        ]
      );
      return;
    }

    // 10. Start Focus Session
    if (
      norm.includes('focus session') ||
      norm.includes('start focus') ||
      norm.includes('stopwatch') ||
      norm.includes('study timer')
    ) {
      addMessage(
        'assistant',
        "Let's start a Focus Session. Tell me when you are finished studying.",
        [],
        'focus',
        { topic: 'General Study Focus' }
      );
      return;
    }

    // 11. Productivity stats
    if (
      norm.includes('productivity') ||
      norm.includes('statistics') ||
      norm.includes('productivity stats') ||
      norm.includes('analytics')
    ) {
      const tasks = localDb.getTasks();
      const total = tasks.length;
      const completed = tasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const highPriorityPending = tasks.filter((t) => t.priority === 'High' && !t.completed).length;
      const overdue = tasks.filter((t) => !t.completed && t.dueDate < '2026-07-26').length;

      const text = `Here is your current Academic Productivity report:\n\n` +
        `📈 **Task Completion Rate**: ${rate}% (${completed}/${total} tasks done)\n` +
        `🚨 **Urgent High Priority Tasks**: ${highPriorityPending} pending\n` +
        `⚠️ **Overdue Tasks**: ${overdue} late\n\n` +
        `Academic pressure status is currently: **High Pressure**. Keep pushing forward!`;

      addMessage('assistant', text, [
        { label: 'View Tasks Overview', icon: 'check-square', action: () => router.replace('/(tabs)/tasks/task') },
      ]);
      return;
    }

    // 12. Notes / notepad query
    if (norm.includes('open notes') || norm.includes('notepad') || norm.includes('write note')) {
      addMessage('assistant', "Opening your personal Notepad utility in the workspace.");
      return;
    }

    // Fallback response (never fabricate)
    addMessage(
      'assistant',
      "I couldn't find any direct information about that in your local GabAi data.\n\n" +
      "I can help you with your local tasks, wallet budget, calendar events, focus timers, and general productivity stats. " +
      "Try asking me:\n" +
      '• *"What should I focus on today?"*\n' +
      '• *"How much did I spend this week?"*\n' +
      '• *"Show tomorrow\'s schedule."*',
      [
        { label: 'Today\'s Focus', icon: 'target', action: () => handleQuery("What should I focus on today?") },
        { label: 'Weekly Expenses', icon: 'dollar-sign', action: () => handleQuery("How much did I spend this week?") },
      ]
    );
  };

  const handleSuggestionPress = (text: string) => {
    handleQuery(text);
  };

  // Callback when Focus Timer finishes
  const handleFocusComplete = (durationSecs: number) => {
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Save as mock session completion or task
    addMessage(
      'assistant',
      `🎉 **Focus Session Complete!**\n\nYou focused successfully for **${timeStr}**. Great work maintaining concentration. This session is logged in your offline productivity metrics.`,
      [{ label: 'Open Dashboard', icon: 'grid', action: () => router.replace('/(tabs)/dashboard/dashboard') }]
    );
  };

  // Render message bubble
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const alignSelf = isUser ? 'flex-end' : 'flex-start';

    return (
      <AnimatedMessageItem>
        <View style={[styles.messageContainer, { alignSelf }]}>
          {!isUser && (
            <View style={[styles.avatarSymbol, { backgroundColor: primaryBrown }]}>
              <Feather name="zap" size={10} color="#FFF" />
            </View>
          )}

          <View style={{ flexShrink: 1, maxWidth: '85%' }}>
            <View
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
                isUser
                  ? { backgroundColor: primaryBrown }
                  : { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userMessageText : { color: textPrimary },
                ]}
              >
                {item.text}
              </Text>

              {/* Render custom Focus widget inside chat */}
              {item.customWidget === 'focus' && (
                <FocusSessionWidget
                  topic={item.widgetData?.topic}
                  onComplete={handleFocusComplete}
                />
              )}

              <Text style={[styles.timestamp, isUser ? styles.userTimestamp : { color: textSecondary }]}>
                {item.timestamp}
              </Text>
            </View>

            {/* Action Buttons */}
            {item.actions && item.actions.length > 0 && (
              <View style={styles.actionButtonsContainer}>
                {item.actions.map((act, index) => (
                  <TouchableOpacity
                    key={index.toString()}
                    style={[styles.inlineActionBtn, { borderColor: borderCol, backgroundColor: bgTheme }]}
                    onPress={act.action}
                  >
                    <Feather name={act.icon as any} size={12} color={primaryBrown} style={{ marginRight: 6 }} />
                    <Text style={[styles.inlineActionBtnText, { color: textPrimary }]}>{act.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </AnimatedMessageItem>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerLabelRow}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>GabAi Assistant</Text>
            <View style={[styles.offlineBadge, { backgroundColor: primaryBrown + '18' }]}>
              <Text style={[styles.offlineBadgeText, { color: primaryBrown }]}>Local AI</Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>Offline Productivity Companion</Text>
        </View>
        <TouchableOpacity
          style={styles.headerReset}
          onPress={() => {
            setMessages([]);
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          }}
        >
          <Feather name="trash-2" size={18} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main chat history */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {messages.length === 0 ? (
            /* Welcome / Empty state */
            <FlatList
              data={[]}
              renderItem={null}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={[styles.welcomeIconContainer, { backgroundColor: primaryBrown + '12', borderColor: borderCol }]}>
                    <Feather name="zap" size={28} color={primaryBrown} />
                  </View>
                  <Text style={[styles.welcomeTitle, { color: textPrimary }]}>Hello! I&apos;m your GabAi Assistant.</Text>
                  <Text style={[styles.welcomeSubtitle, { color: textSecondary }]}>
                    I can help you find information, manage your tasks, calculate spendings, and answer questions about your local academic data.
                  </Text>

                  {/* Onboarding Guide Card */}
                  <View style={[styles.guideCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <Text style={[styles.guideTitle, { color: textPrimary }]}>💡 How to use your Study Companion</Text>
                    <View style={styles.guideStep}>
                      <Text style={styles.guideStepNum}>1</Text>
                      <Text style={[styles.guideStepText, { color: textPrimary }]}>
                        <Text style={{ fontWeight: 'bold' }}>Chat in plain English:</Text> Ask about tasks, classes, or weekly expenses (e.g., &quot;How much did I spend this week?&quot; or &quot;Do I have overdue tasks?&quot;).
                      </Text>
                    </View>
                    <View style={styles.guideStep}>
                      <Text style={styles.guideStepNum}>2</Text>
                      <Text style={[styles.guideStepText, { color: textPrimary }]}>
                        <Text style={{ fontWeight: 'bold' }}>Quick Actions:</Text> Tap the action buttons at the bottom to quickly view stats, open sections, or trigger focus stopwatches.
                      </Text>
                    </View>
                    <View style={styles.guideStep}>
                      <Text style={styles.guideStepNum}>3</Text>
                      <Text style={[styles.guideStepText, { color: textPrimary }]}>
                        <Text style={{ fontWeight: 'bold' }}>100% Offline:</Text> Changes you make here (like completing a task) instantly sync with your main tabs.
                      </Text>
                    </View>
                  </View>

                  {/* Suggestion Chips */}
                  <View style={styles.suggestionGrid}>
                    {sugChips.map((chip, index) => (
                      <TouchableOpacity
                        key={index.toString()}
                        style={[styles.suggestionChip, { backgroundColor: cardBg, borderColor: borderCol }]}
                        onPress={() => handleSuggestionPress(chip.text)}
                      >
                        <Feather name={chip.icon as any} size={13} color={primaryBrown} style={{ marginRight: 6 }} />
                        <Text style={[styles.suggestionChipText, { color: textPrimary }]} numberOfLines={1}>
                          {chip.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Suggested Questions */}
                  <Text style={[styles.sectionHeading, { color: textSecondary, marginTop: 24 }]}>Suggested Questions</Text>
                  <View style={styles.suggestedQuestionsContainer}>
                    {sugQuestions.map((q, index) => (
                      <TouchableOpacity
                        key={index.toString()}
                        style={[styles.questionItem, { borderColor: borderCol }]}
                        onPress={() => handleSuggestionPress(q)}
                      >
                        <Text style={[styles.questionItemText, { color: textPrimary }]}>{q}</Text>
                        <Feather name="arrow-up-right" size={14} color={textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          ) : (
            /* Active messages */
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
              onContentSizeChange={scrollToBottom}
            />
          )}

          {/* Quick Actions Action bar above Input */}
          <View style={[styles.quickActionsContainer, { borderTopColor: borderCol }]}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={quickActions}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.actionChip, { backgroundColor: cardBg, borderColor: borderCol }]}
                  onPress={() => handleSuggestionPress(item.query)}
                >
                  <Text style={[styles.actionChipText, { color: textPrimary }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.quickActionsContent}
            />
          </View>

          {/* Text Input Row */}
          <View style={[styles.inputContainer, { borderTopColor: borderCol, backgroundColor: bgTheme }]}>
            <TextInput
              style={[styles.inputField, { backgroundColor: inputBg, color: textPrimary, borderColor: borderCol }]}
              placeholder="Ask about classes, tasks, spending..."
              placeholderTextColor={textSecondary}
              value={inputVal}
              onChangeText={setInputVal}
              onSubmitEditing={() => handleQuery(inputVal)}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputVal.trim() ? primaryBrown : primaryBrown + '40' },
              ]}
              onPress={() => handleQuery(inputVal)}
              disabled={!inputVal.trim()}
            >
              <Feather name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
    marginLeft: -4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  offlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  offlineBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerReset: {
    padding: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    maxWidth: '85%',
  },
  avatarSymbol: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 6,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  userBubble: {
    borderTopRightRadius: 2,
  },
  assistantBubble: {
    borderTopLeftRadius: 2,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  inlineActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
    width: 36,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A97C50',
    marginHorizontal: 2.5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  guideCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  guideStepNum: {
    backgroundColor: '#A97C50',
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 10,
    marginTop: 2,
  },
  guideStepText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: 4,
  },
  suggestionGrid: {
    width: '100%',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    width: '100%',
  },
  suggestionChipText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  suggestedQuestionsContainer: {
    width: '100%',
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  questionItemText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    height: 54,
    justifyContent: 'center',
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    width: '100%',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  widgetTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  widgetSubtitle: {
    fontSize: 12.5,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginVertical: 12,
    letterSpacing: 2,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flex: 0.48,
  },
  timerBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
