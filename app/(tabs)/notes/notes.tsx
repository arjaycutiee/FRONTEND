import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Share,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';
import { localDb, Note, Task, CalendarEvent } from '@/app/services/localDb';

export const CATEGORIES = [
  { name: 'All', icon: 'grid', color: '#A97C50' },
  { name: 'School', icon: 'book', color: '#6366F1' },
  { name: 'Study Note', icon: 'file-text', color: '#10B981' },
  { name: 'Review', icon: 'award', color: '#F59E0B' },
  { name: 'Projects', icon: 'code', color: '#A97C50' },
  { name: 'Ideas', icon: 'zap', color: '#EC4899' },
  { name: 'Personal', icon: 'user', color: '#14B8A6' },
];

export const TEMPLATES = [
  {
    id: 'lecture-notes',
    title: 'Lecture Notes',
    category: 'Study Note',
    description: 'Structured Cornell-style notes with core concepts, deep dives, and takeaways.',
    content: `# [Course Code]: [Lecture Topic]
**Date:** ${new Date().toLocaleDateString()} | **Professor:** [Name]

## Key Concepts
- Concept 1: [Brief explanation]
- Concept 2: [Brief explanation]

## Detailed Notes
1. [Important formula or theorem]
2. [Example covered in class]

## Questions / Clarifications
- [ ] Ask prof about [Topic] during office hours
- [ ] Review textbook page [XX-YY]

## Summary
[One or two sentence takeaway of today's lecture]`,
  },
  {
    id: 'exam-review',
    title: 'Exam Review',
    category: 'Review',
    description: 'High-yield topics, formula cheat sheets, common traps, and practice problem checklists.',
    content: `# [Subject] Midterm/Final Review

## High-Yield Topics
- [ ] Topic A (Definitions & Core Concepts)
- [ ] Topic B (Formulas & Step-by-Step Solves)
- [ ] Topic C (Case Studies / Examples)

## Important Formulas & Cheat Sheet
\`\`\`
Formula 1: ...
Formula 2: ...
\`\`\`

## Common Mistakes & Traps
> Warning: Pay close attention to unit conversions and sign rules!

## Practice Problem Checklist
- [ ] Problem Set 1
- [ ] Past Year Exam 2025`,
  },
  {
    id: 'project-roadmap',
    title: 'Project Roadmap',
    category: 'Projects',
    description: 'Milestones, team deliverables, sprint objectives, and spec checklists.',
    content: `# [Project Title] Roadmap

## Project Objective
[Brief description of project goal and deliverables]

## Team & Responsibilities
- **Lead / Backend:** [Name]
- **Frontend / UI:** [Name]
- **Documentation:** [Name]

## Phase 1: Planning & Specs
- [x] Initial brainstorm & requirements
- [ ] Architecture diagram finalized

## Phase 2: Implementation
- [ ] Milestone 1 Delivery
- [ ] Testing & Integration`,
  },
  {
    id: 'study-plan',
    title: 'Study Plan',
    category: 'School',
    description: 'Timed study blocks, active recall checklists, and review targets.',
    content: `# Study Session Plan (${new Date().toLocaleDateString()})

- [ ] Block 1 (45 mins): Review Chapter Notes
- [ ] Break (10 mins): Stretch & Hydrate
- [ ] Block 2 (45 mins): Practice Questions Set #3
- [ ] Block 3 (30 mins): Flashcards & Active Recall`,
  },
];

export default function NotesScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // GabAI Design Palette
  const primaryBrown = '#A97C50';
  const successGreen = '#10B981';
  const errorRed = '#EF4444';
  const warningOrange = '#F59E0B';
  const infoBlue = '#3B82F6';

  const bgTheme = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const cardBgElevated = isDark ? '#262626' : '#FFFFFF';
  const borderCol = isDark ? '#2A2A2A' : '#E2E8F0';
  const inputBg = isDark ? '#1A1A1A' : '#F1F5F9';
  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';

  // Responsive layout
  const screenWidth = Dimensions.get('window').width;
  const isWide = screenWidth > 600;

  // Central Database Notes State
  const [notes, setNotesState] = useState<Note[]>(() => localDb.getNotes());

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setNotesState(localDb.getNotes());
    });
    return unsubscribe;
  }, []);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'pinned' | 'favorites' | 'archived'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent_edit' | 'recent_create' | 'title' | 'category'>('recent_edit');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Bottom Sheets & Popups
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isEditorMoreMenuOpen, setIsEditorMoreMenuOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCategory, setEditorCategory] = useState('School');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorTagInput, setEditorTagInput] = useState('');
  const [editorIsFavorite, setEditorIsFavorite] = useState(false);
  const [editorIsPinned, setEditorIsPinned] = useState(false);
  const [editorIsArchived, setEditorIsArchived] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Undo / Redo History
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Convert to Task State
  const [convertTaskModalOpen, setConvertTaskModalOpen] = useState(false);
  const [convertTargetNote, setConvertTargetNote] = useState<Note | null>(null);
  const [taskSubjectInput, setTaskSubjectInput] = useState('General');
  const [taskPriorityInput, setTaskPriorityInput] = useState<Task['priority']>('Medium');
  const [taskCategoryInput, setTaskCategoryInput] = useState<Task['category']>('Academic');

  // Link to Schedule State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTargetNote, setScheduleTargetNote] = useState<Note | null>(null);
  const [scheduleDateInput, setScheduleDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleTimeInput, setScheduleTimeInput] = useState('14:00');

  // Haptic feedback trigger helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch {
      // Ignored on web/unsupported
    }
  };

  // Collect all unique tags
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      if (!n.isArchived) {
        n.tags?.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [notes]);

  // Check how many non-default filters are active
  const activeCustomFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedTag !== null) count++;
    if (sortBy !== 'recent_edit') count++;
    return count;
  }, [selectedCategory, selectedTag, sortBy]);

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Tab Filter
        if (activeTabFilter === 'archived') {
          if (!note.isArchived) return false;
        } else {
          if (note.isArchived) return false;
          if (activeTabFilter === 'pinned' && !note.isPinned) return false;
          if (activeTabFilter === 'favorites' && !note.isFavorite) return false;
        }

        // Category Filter
        if (selectedCategory !== 'All' && note.category !== selectedCategory) {
          return false;
        }

        // Tag Filter
        if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
          return false;
        }

        // Search Query (title, content, category, tags)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title?.toLowerCase().includes(q);
          const matchContent = note.content?.toLowerCase().includes(q);
          const matchCategory = note.category?.toLowerCase().includes(q);
          const matchTags = note.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchCategory && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent_edit') return b.updatedAt - a.updatedAt;
        if (sortBy === 'recent_create') return b.createdAt - a.createdAt;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [notes, activeTabFilter, selectedCategory, selectedTag, searchQuery, sortBy]);

  // Separate Pinned and Regular notes for clean presentation
  const pinnedNotes = useMemo(() => {
    if (activeTabFilter === 'archived' || activeTabFilter === 'pinned') return [];
    return filteredNotes.filter((n) => n.isPinned);
  }, [filteredNotes, activeTabFilter]);

  const unpinnedNotes = useMemo(() => {
    if (activeTabFilter === 'archived' || activeTabFilter === 'pinned') return filteredNotes;
    return filteredNotes.filter((n) => !n.isPinned);
  }, [filteredNotes, activeTabFilter]);

  // Open New Note
  const handleOpenNewNote = (category = 'School', templateContent?: string, templateTitle?: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsFabMenuOpen(false);
    setEditingNoteId(null);
    setEditorTitle(templateTitle || '');
    setEditorContent(templateContent || '');
    setEditorCategory(category);
    setEditorTags([]);
    setEditorTagInput('');
    setEditorIsFavorite(false);
    setEditorIsPinned(false);
    setEditorIsArchived(false);
    setSaveStatus('saved');
    setIsPreviewMode(false);
    historyRef.current = [templateContent || ''];
    historyIndexRef.current = 0;
    setIsEditorOpen(true);
  };

  // Open Quick Note
  const handleOpenQuickNote = () => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    handleOpenNewNote('Ideas', `## Quick Jot (${timeString})\n- `, `Quick Note - ${dateString}`);
  };

  // Open Existing Note
  const handleOpenNote = (note: Note) => {
    triggerHaptic();
    setEditingNoteId(note.id);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorCategory(note.category);
    setEditorTags(note.tags || []);
    setEditorTagInput('');
    setEditorIsFavorite(note.isFavorite);
    setEditorIsPinned(note.isPinned);
    setEditorIsArchived(note.isArchived);
    setSaveStatus('saved');
    setIsPreviewMode(false);
    historyRef.current = [note.content];
    historyIndexRef.current = 0;
    setIsEditorOpen(true);
  };

  // Debounced auto-save
  const autoSaveTimerRef = useRef<any>(null);

  const saveCurrentNote = (
    title = editorTitle,
    content = editorContent,
    category = editorCategory,
    tags = editorTags,
    isFav = editorIsFavorite,
    isPin = editorIsPinned,
    isArch = editorIsArchived
  ) => {
    if (!title.trim() && !content.trim()) return;

    const cleanTitle = title.trim() || 'Untitled Note';

    if (editingNoteId) {
      localDb.updateNote(editingNoteId, {
        title: cleanTitle,
        content,
        category,
        tags,
        isFavorite: isFav,
        isPinned: isPin,
        isArchived: isArch,
      });
    } else {
      const created = localDb.addNote({
        title: cleanTitle,
        content,
        category,
        tags,
        isFavorite: isFav,
        isPinned: isPin,
        isArchived: isArch,
      });
      setEditingNoteId(created.id);
    }
    setSaveStatus('saved');
  };

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);
    setSaveStatus('saving');

    // Add to history stack
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    if (historyRef.current[historyRef.current.length - 1] !== newContent) {
      historyRef.current.push(newContent);
      historyIndexRef.current = historyRef.current.length - 1;
    }

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentNote(editorTitle, newContent);
    }, 600);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditorTitle(newTitle);
    setSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentNote(newTitle, editorContent);
    }, 600);
  };

  const handleCloseEditor = () => {
    triggerHaptic();
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (editorTitle.trim() || editorContent.trim()) {
      saveCurrentNote();
    }
    setIsEditorOpen(false);
    setIsEditorMoreMenuOpen(false);
  };

  // Formatting Toolbar Actions
  const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
    triggerHaptic();
    const updated = editorContent + `\n${prefix}${placeholder}${suffix}`;
    handleContentChange(updated);
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      triggerHaptic();
      historyIndexRef.current -= 1;
      const prevContent = historyRef.current[historyIndexRef.current];
      setEditorContent(prevContent);
      saveCurrentNote(editorTitle, prevContent);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      triggerHaptic();
      historyIndexRef.current += 1;
      const nextContent = historyRef.current[historyIndexRef.current];
      setEditorContent(nextContent);
      saveCurrentNote(editorTitle, nextContent);
    }
  };

  // Add Tag in Editor
  const handleAddTag = () => {
    if (!editorTagInput.trim()) return;
    let tag = editorTagInput.trim();
    if (!tag.startsWith('#')) tag = `#${tag}`;
    if (!editorTags.includes(tag)) {
      const updated = [...editorTags, tag];
      setEditorTags(updated);
      saveCurrentNote(editorTitle, editorContent, editorCategory, updated);
    }
    setEditorTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = editorTags.filter((t) => t !== tagToRemove);
    setEditorTags(updated);
    saveCurrentNote(editorTitle, editorContent, editorCategory, updated);
  };

  // Note Actions
  const handleToggleFavorite = (noteId?: string) => {
    triggerHaptic();
    const id = noteId || editingNoteId;
    if (id) {
      localDb.toggleNoteFavorite(id);
      if (editingNoteId === id) {
        setEditorIsFavorite((prev) => !prev);
      }
    }
  };

  const handleTogglePin = (noteId?: string) => {
    triggerHaptic();
    const id = noteId || editingNoteId;
    if (id) {
      localDb.toggleNotePinned(id);
      if (editingNoteId === id) {
        setEditorIsPinned((prev) => !prev);
      }
    }
  };

  const handleToggleArchive = (noteId?: string) => {
    triggerHaptic();
    const id = noteId || editingNoteId;
    if (id) {
      localDb.toggleNoteArchived(id);
      if (editingNoteId === id) {
        setEditorIsArchived((prev) => !prev);
        setIsEditorMoreMenuOpen(false);
        setIsEditorOpen(false);
      }
    }
  };

  const handleDeleteNote = (noteId?: string) => {
    const id = noteId || editingNoteId;
    if (!id) return;
    setIsEditorMoreMenuOpen(false);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to permanently delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
            localDb.deleteNote(id);
            if (editingNoteId === id) {
              setIsEditorOpen(false);
            }
          },
        },
      ]
    );
  };

  const handleShareNote = async (note?: Note | null) => {
    triggerHaptic();
    setIsEditorMoreMenuOpen(false);
    const target = note || (editingNoteId ? localDb.getNotes().find((n) => n.id === editingNoteId) : null);
    if (!target) return;
    try {
      await Share.share({
        title: target.title,
        message: `${target.title}\n\n${target.content}`,
      });
    } catch {
      // Handled
    }
  };

  // Convert Note to Task
  const handleOpenConvertTask = (note?: Note | null) => {
    triggerHaptic();
    setIsEditorMoreMenuOpen(false);
    const target = note || (editingNoteId ? localDb.getNotes().find((n) => n.id === editingNoteId) : null);
    if (!target) return;
    setConvertTargetNote(target);
    setTaskSubjectInput(target.tags[0] ? target.tags[0].replace('#', '') : 'General');
    setTaskPriorityInput(target.isPinned ? 'High' : 'Medium');

    let taskCat: Task['category'] = 'Academic';
    if (target.category === 'Personal') taskCat = 'Personal';
    else if (target.category === 'Projects') taskCat = 'Projects';
    else if (target.category === 'Review') taskCat = 'Exams';
    else if (target.category === 'Ideas') taskCat = 'Activities';
    setTaskCategoryInput(taskCat);
    setConvertTaskModalOpen(true);
  };

  const handleConfirmConvertTask = () => {
    if (!convertTargetNote) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const createdTask = localDb.convertNoteToTask(convertTargetNote.id, {
      subject: taskSubjectInput,
      priority: taskPriorityInput,
      category: taskCategoryInput,
    });
    setConvertTaskModalOpen(false);

    Alert.alert(
      'Task Created!',
      `"${createdTask?.title}" has been successfully added to your Task Manager.`,
      [
        { text: 'Keep Browsing Notes', style: 'cancel' },
        { text: 'View Tasks', onPress: () => router.push('/(tabs)/tasks/task') },
      ]
    );
  };

  // Link Note to Calendar
  const handleOpenScheduleLink = (note?: Note | null) => {
    triggerHaptic();
    setIsEditorMoreMenuOpen(false);
    const target = note || (editingNoteId ? localDb.getNotes().find((n) => n.id === editingNoteId) : null);
    if (!target) return;
    setScheduleTargetNote(target);
    setScheduleDateInput(new Date().toISOString().split('T')[0]);
    setScheduleTimeInput('14:00');
    setScheduleModalOpen(true);
  };

  const handleConfirmScheduleLink = () => {
    if (!scheduleTargetNote) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const createdEvent = localDb.linkNoteToSchedule(scheduleTargetNote.id, {
      date: scheduleDateInput,
      time: scheduleTimeInput,
    });
    setScheduleModalOpen(false);

    Alert.alert(
      'Event Scheduled!',
      `"${createdEvent?.title}" scheduled for ${scheduleDateInput} at ${scheduleTimeInput}.`,
      [
        { text: 'OK', style: 'cancel' },
        { text: 'Open Calendar', onPress: () => router.push('/(tabs)/calendar/calendar') },
      ]
    );
  };

  // Format relative timestamp
  const formatTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Category Color resolver
  const getCategoryColor = (categoryName: string) => {
    const found = CATEGORIES.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    return found ? found.color : primaryBrown;
  };

  // Clean preview snippet without markdown formatting symbols
  const getCleanSnippet = (content: string) => {
    return content
      .replace(/^#+\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/```[\s\S]*?```/g, '[Code Block]')
      .replace(/^>\s+/gm, '')
      .replace(/- \[[ x]\]\s+/gm, '• ')
      .replace(/^[*-]\s+/gm, '• ')
      .trim();
  };

  // Clear all filters
  const handleClearFilters = () => {
    triggerHaptic();
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTag(null);
    setSortBy('recent_edit');
    setActiveTabFilter('all');
    setIsFilterSheetOpen(false);
  };

  // Render Note Card Item
  const renderNoteCard = (note: Note) => {
    const categoryColor = getCategoryColor(note.category);
    const snippet = getCleanSnippet(note.content);
    const isGridView = !isWide && viewMode === 'grid';

    return (
      <TouchableOpacity
        key={note.id}
        activeOpacity={0.82}
        onPress={() => handleOpenNote(note)}
        style={[
          styles.noteCard,
          {
            backgroundColor: cardBgElevated,
            borderColor: note.isPinned ? primaryBrown + '70' : borderCol,
            width: isGridView ? '48.5%' : '100%',
          },
        ]}
      >
        {/* Top Card Meta: Category Tag & Pin / Favorite indicators */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.categoryBadgeText, { color: categoryColor }]} numberOfLines={1}>
              {note.category}
            </Text>
          </View>

          <View style={styles.cardHeaderIcons}>
            {note.isPinned && (
              <View style={[styles.cardIconIndicator, { backgroundColor: primaryBrown + '18' }]}>
                <Feather name="anchor" size={11} color={primaryBrown} />
              </View>
            )}
            {note.isFavorite && (
              <TouchableOpacity
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => handleToggleFavorite(note.id)}
              >
                <Feather name="star" size={13} color={warningOrange} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Note Title */}
        <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={2}>
          {note.title || 'Untitled Note'}
        </Text>

        {/* Content Snippet */}
        <Text style={[styles.cardSnippet, { color: textSecondary }]} numberOfLines={isGridView ? 3 : 2}>
          {snippet || 'No additional text'}
        </Text>

        {/* Tags Row */}
        {note.tags && note.tags.length > 0 && (
          <View style={styles.cardTagsRow}>
            {note.tags.slice(0, isGridView ? 2 : 3).map((tag, idx) => (
              <View key={idx} style={[styles.cardTagChip, { backgroundColor: inputBg }]}>
                <Text style={[styles.cardTagText, { color: textSecondary }]}>{tag}</Text>
              </View>
            ))}
            {note.tags.length > (isGridView ? 2 : 3) && (
              <Text style={[styles.cardMoreTags, { color: textSecondary }]}>
                +{note.tags.length - (isGridView ? 2 : 3)}
              </Text>
            )}
          </View>
        )}

        {/* Card Footer: Timestamp */}
        <View style={[styles.cardFooter, { borderTopColor: borderCol }]}>
          <View style={styles.timestampRow}>
            <Feather name="clock" size={11} color={textSecondary} />
            <Text style={[styles.timestampText, { color: textSecondary }]}>
              {formatTime(note.updatedAt)}
            </Text>
          </View>

          <View style={styles.cardQuickActions}>
            <TouchableOpacity
              style={styles.cardActionIconBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={() => handleOpenConvertTask(note)}
            >
              <Feather name="check-square" size={12} color={textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionIconBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={() => handleOpenScheduleLink(note)}
            >
              <Feather name="calendar" size={12} color={textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* 1. Header Bar */}
      <View style={[styles.topHeader, { borderBottomColor: borderCol }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: cardBg, borderColor: borderCol }]}
            onPress={openDrawer}
            activeOpacity={0.7}
          >
            <Feather name="menu" size={19} color={textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>Notes</Text>
              <View style={[styles.counterBadge, { backgroundColor: primaryBrown + '18' }]}>
                <Text style={[styles.counterText, { color: primaryBrown }]}>
                  {filteredNotes.length}
                </Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              Academic & Personal Notes
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.primaryHeaderBtn, { backgroundColor: primaryBrown }]}
            activeOpacity={0.85}
            onPress={() => handleOpenNewNote()}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.primaryHeaderBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Prominent Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: borderCol }]}>
          <Feather name="search" size={16} color={textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search your notes..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Compact Smart Filter Strip */}
      <View style={styles.smartFilterStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.smartFilterScroll}
        >
          {/* All */}
          <TouchableOpacity
            style={[
              styles.compactTab,
              activeTabFilter === 'all'
                ? { backgroundColor: primaryBrown }
                : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTabFilter('all');
            }}
          >
            <Text
              style={[
                styles.compactTabText,
                { color: activeTabFilter === 'all' ? '#FFFFFF' : textSecondary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Pinned */}
          <TouchableOpacity
            style={[
              styles.compactTab,
              activeTabFilter === 'pinned'
                ? { backgroundColor: primaryBrown }
                : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTabFilter('pinned');
            }}
          >
            <Feather
              name="anchor"
              size={12}
              color={activeTabFilter === 'pinned' ? '#FFFFFF' : textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.compactTabText,
                { color: activeTabFilter === 'pinned' ? '#FFFFFF' : textSecondary },
              ]}
            >
              Pinned
            </Text>
          </TouchableOpacity>

          {/* Favorites */}
          <TouchableOpacity
            style={[
              styles.compactTab,
              activeTabFilter === 'favorites'
                ? { backgroundColor: primaryBrown }
                : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTabFilter('favorites');
            }}
          >
            <Feather
              name="star"
              size={12}
              color={activeTabFilter === 'favorites' ? '#FFFFFF' : warningOrange}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.compactTabText,
                { color: activeTabFilter === 'favorites' ? '#FFFFFF' : textSecondary },
              ]}
            >
              Favorites
            </Text>
          </TouchableOpacity>

          {/* Archived */}
          <TouchableOpacity
            style={[
              styles.compactTab,
              activeTabFilter === 'archived'
                ? { backgroundColor: primaryBrown }
                : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
            ]}
            onPress={() => {
              triggerHaptic();
              setActiveTabFilter('archived');
            }}
          >
            <Feather
              name="archive"
              size={12}
              color={activeTabFilter === 'archived' ? '#FFFFFF' : textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.compactTabText,
                { color: activeTabFilter === 'archived' ? '#FFFFFF' : textSecondary },
              ]}
            >
              Archived
            </Text>
          </TouchableOpacity>

          {/* Filter Bottom Sheet Trigger */}
          <TouchableOpacity
            style={[
              styles.compactTab,
              styles.filterSheetTrigger,
              activeCustomFiltersCount > 0
                ? { backgroundColor: primaryBrown + '20', borderColor: primaryBrown, borderWidth: 1 }
                : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
            ]}
            onPress={() => {
              triggerHaptic();
              setIsFilterSheetOpen(true);
            }}
          >
            <Feather
              name="sliders"
              size={12}
              color={activeCustomFiltersCount > 0 ? primaryBrown : textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.compactTabText,
                {
                  color: activeCustomFiltersCount > 0 ? primaryBrown : textSecondary,
                  fontWeight: activeCustomFiltersCount > 0 ? '700' : '500',
                },
              ]}
            >
              Filters
            </Text>
            {activeCustomFiltersCount > 0 && (
              <View style={[styles.filterBadgeCount, { backgroundColor: primaryBrown }]}>
                <Text style={styles.filterBadgeCountText}>{activeCustomFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Active Filter Hint Banner (if filters applied) */}
      {activeCustomFiltersCount > 0 && (
        <View style={[styles.activeFiltersBanner, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.activeFiltersLeft}>
            <Text style={[styles.activeFiltersText, { color: textSecondary }]}>
              Active:{' '}
              {selectedCategory !== 'All' ? `Category: ${selectedCategory}` : ''}
              {selectedTag ? ` • Tag: ${selectedTag}` : ''}
              {sortBy !== 'recent_edit' ? ` • Sorted` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={[styles.clearFiltersBtnText, { color: primaryBrown }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Notes List / Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredNotes.length === 0 ? (
          /* Clean & Minimal Empty State */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: primaryBrown + '12' }]}>
              <Feather
                name={searchQuery || activeCustomFiltersCount > 0 ? 'search' : 'edit-3'}
                size={32}
                color={primaryBrown}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>
              {searchQuery || activeCustomFiltersCount > 0
                ? 'No notes found'
                : 'Nothing here yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
              {searchQuery || activeCustomFiltersCount > 0
                ? 'No notes matched your search query or filter criteria.'
                : 'Capture your thoughts, university lectures, and study cheat sheets in one calm workspace.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyPrimaryBtn, { backgroundColor: primaryBrown }]}
              activeOpacity={0.85}
              onPress={() => {
                if (searchQuery || activeCustomFiltersCount > 0) {
                  handleClearFilters();
                } else {
                  handleOpenNewNote();
                }
              }}
            >
              <Feather
                name={searchQuery || activeCustomFiltersCount > 0 ? 'refresh-cw' : 'plus'}
                size={15}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.emptyPrimaryBtnText}>
                {searchQuery || activeCustomFiltersCount > 0 ? 'Clear Filters' : 'Create Note'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notesContainer}>
            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="anchor" size={13} color={primaryBrown} style={{ marginRight: 6 }} />
                  <Text style={[styles.sectionHeaderText, { color: primaryBrown }]}>
                    PINNED ({pinnedNotes.length})
                  </Text>
                </View>
                <View style={[styles.notesGridWrapper, isWide || viewMode === 'list' ? styles.notesListLayout : styles.notesGridLayout]}>
                  {pinnedNotes.map(renderNoteCard)}
                </View>
              </View>
            )}

            {/* Regular / Recent Notes Section */}
            {unpinnedNotes.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="file-text" size={13} color={textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.sectionHeaderText, { color: textSecondary }]}>
                    {pinnedNotes.length > 0 ? `RECENT NOTES (${unpinnedNotes.length})` : `ALL NOTES (${unpinnedNotes.length})`}
                  </Text>
                </View>
                <View style={[styles.notesGridWrapper, isWide || viewMode === 'list' ? styles.notesListLayout : styles.notesGridLayout]}>
                  {unpinnedNotes.map(renderNoteCard)}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 5. Floating Action Button (FAB) Speed Dial */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {isFabMenuOpen && (
          <View style={styles.fabSpeedDial}>
            <TouchableOpacity
              style={[styles.fabSpeedDialItem, { backgroundColor: cardBgElevated, borderColor: borderCol }]}
              activeOpacity={0.85}
              onPress={handleOpenQuickNote}
            >
              <Text style={[styles.fabSpeedDialLabel, { color: textPrimary }]}>Quick Note</Text>
              <View style={[styles.fabSpeedDialIconCircle, { backgroundColor: warningOrange + '20' }]}>
                <Feather name="zap" size={15} color={warningOrange} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabSpeedDialItem, { backgroundColor: cardBgElevated, borderColor: borderCol }]}
              activeOpacity={0.85}
              onPress={() => {
                setIsFabMenuOpen(false);
                setIsTemplateModalOpen(true);
              }}
            >
              <Text style={[styles.fabSpeedDialLabel, { color: textPrimary }]}>From Template</Text>
              <View style={[styles.fabSpeedDialIconCircle, { backgroundColor: infoBlue + '20' }]}>
                <Feather name="layers" size={15} color={infoBlue} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabSpeedDialItem, { backgroundColor: cardBgElevated, borderColor: borderCol }]}
              activeOpacity={0.85}
              onPress={() => handleOpenNewNote()}
            >
              <Text style={[styles.fabSpeedDialLabel, { color: textPrimary }]}>New Note</Text>
              <View style={[styles.fabSpeedDialIconCircle, { backgroundColor: successGreen + '20' }]}>
                <Feather name="edit-3" size={15} color={successGreen} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.fabMainBtn, { backgroundColor: primaryBrown }]}
          activeOpacity={0.88}
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            setIsFabMenuOpen(!isFabMenuOpen);
          }}
        >
          <Feather
            name={isFabMenuOpen ? 'x' : 'plus'}
            size={24}
            color="#FFFFFF"
            style={{ transform: [{ rotate: isFabMenuOpen ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* 6. Filter & View Bottom Sheet Modal */}
      <Modal
        visible={isFilterSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterSheetOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.bottomSheetCard, { backgroundColor: sheetBg, borderColor: borderCol }]}>
                <View style={styles.sheetHandleBar}>
                  <View style={[styles.sheetHandle, { backgroundColor: borderCol }]} />
                </View>

                <View style={styles.sheetHeader}>
                  <View style={styles.sheetHeaderLeft}>
                    <Feather name="sliders" size={17} color={primaryBrown} style={{ marginRight: 8 }} />
                    <Text style={[styles.sheetTitle, { color: textPrimary }]}>Filter & View Options</Text>
                  </View>
                  <TouchableOpacity onPress={handleClearFilters}>
                    <Text style={[styles.sheetResetBtn, { color: primaryBrown }]}>Reset All</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  {/* Categories */}
                  <Text style={[styles.sheetSectionTitle, { color: textSecondary }]}>CATEGORIES</Text>
                  <View style={styles.sheetPillsGrid}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <TouchableOpacity
                          key={cat.name}
                          style={[
                            styles.sheetCategoryChip,
                            isSelected
                              ? { backgroundColor: cat.color + '20', borderColor: cat.color, borderWidth: 1.5 }
                              : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
                          ]}
                          onPress={() => {
                            triggerHaptic();
                            setSelectedCategory(cat.name);
                          }}
                        >
                          <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                          <Text
                            style={[
                              styles.sheetCategoryChipText,
                              { color: isSelected ? cat.color : textSecondary, fontWeight: isSelected ? '700' : '500' },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Tags */}
                  {allUniqueTags.length > 0 && (
                    <>
                      <Text style={[styles.sheetSectionTitle, { color: textSecondary, marginTop: 16 }]}>TAGS</Text>
                      <View style={styles.sheetPillsGrid}>
                        <TouchableOpacity
                          style={[
                            styles.sheetTagChip,
                            !selectedTag
                              ? { backgroundColor: primaryBrown + '20', borderColor: primaryBrown, borderWidth: 1.5 }
                              : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
                          ]}
                          onPress={() => {
                            triggerHaptic();
                            setSelectedTag(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.sheetTagText,
                              { color: !selectedTag ? primaryBrown : textSecondary, fontWeight: !selectedTag ? '700' : '500' },
                            ]}
                          >
                            # All Tags
                          </Text>
                        </TouchableOpacity>

                        {allUniqueTags.map((tag) => {
                          const isSelected = selectedTag === tag;
                          return (
                            <TouchableOpacity
                              key={tag}
                              style={[
                                styles.sheetTagChip,
                                isSelected
                                  ? { backgroundColor: primaryBrown + '20', borderColor: primaryBrown, borderWidth: 1.5 }
                                  : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
                              ]}
                              onPress={() => {
                                triggerHaptic();
                                setSelectedTag(isSelected ? null : tag);
                              }}
                            >
                              <Text
                                style={[
                                  styles.sheetTagText,
                                  { color: isSelected ? primaryBrown : textSecondary, fontWeight: isSelected ? '700' : '500' },
                                ]}
                              >
                                {tag}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Sort By */}
                  <Text style={[styles.sheetSectionTitle, { color: textSecondary, marginTop: 16 }]}>SORT BY</Text>
                  <View style={styles.sheetPillsGrid}>
                    {[
                      { id: 'recent_edit', label: 'Last Edited' },
                      { id: 'recent_create', label: 'Date Created' },
                      { id: 'title', label: 'Title (A-Z)' },
                      { id: 'category', label: 'Category' },
                    ].map((s) => {
                      const isSelected = sortBy === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.sheetSortChip,
                            isSelected
                              ? { backgroundColor: primaryBrown + '20', borderColor: primaryBrown, borderWidth: 1.5 }
                              : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
                          ]}
                          onPress={() => {
                            triggerHaptic();
                            setSortBy(s.id as any);
                          }}
                        >
                          <Text
                            style={[
                              styles.sheetSortText,
                              { color: isSelected ? primaryBrown : textSecondary, fontWeight: isSelected ? '700' : '500' },
                            ]}
                          >
                            {s.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* View Mode */}
                  <Text style={[styles.sheetSectionTitle, { color: textSecondary, marginTop: 16 }]}>LAYOUT VIEW</Text>
                  <View style={styles.sheetViewModeRow}>
                    <TouchableOpacity
                      style={[
                        styles.sheetViewModeBtn,
                        viewMode === 'grid'
                          ? { backgroundColor: primaryBrown }
                          : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setViewMode('grid');
                      }}
                    >
                      <Feather name="grid" size={15} color={viewMode === 'grid' ? '#FFFFFF' : textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.sheetViewModeText, { color: viewMode === 'grid' ? '#FFFFFF' : textSecondary }]}>
                        Grid View
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sheetViewModeBtn,
                        viewMode === 'list'
                          ? { backgroundColor: primaryBrown }
                          : { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 },
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setViewMode('list');
                      }}
                    >
                      <Feather name="list" size={15} color={viewMode === 'list' ? '#FFFFFF' : textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.sheetViewModeText, { color: viewMode === 'list' ? '#FFFFFF' : textSecondary }]}>
                        List View
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.sheetDoneBtn, { backgroundColor: primaryBrown }]}
                  onPress={() => setIsFilterSheetOpen(false)}
                >
                  <Text style={styles.sheetDoneBtnText}>Apply & Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 7. Note Editor Modal (Focused Writing Experience) */}
      <Modal
        visible={isEditorOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseEditor}
      >
        <SafeAreaView style={[styles.editorContainer, { backgroundColor: bgTheme }]} edges={['top', 'bottom']}>
          {/* Editor Header Bar */}
          <View style={[styles.editorHeader, { borderBottomColor: borderCol }]}>
            <TouchableOpacity
              style={[styles.editorHeaderBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={handleCloseEditor}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="chevron-down" size={20} color={textPrimary} />
            </TouchableOpacity>

            {/* Auto-save Status Indicator */}
            <View style={styles.saveStatusBadge}>
              <View
                style={[
                  styles.saveStatusDot,
                  { backgroundColor: saveStatus === 'saved' ? successGreen : warningOrange },
                ]}
              />
              <Text style={[styles.saveStatusText, { color: textSecondary }]}>
                {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
              </Text>
            </View>

            {/* Editor Right Actions */}
            <View style={styles.editorHeaderRight}>
              {/* Preview Toggle */}
              <TouchableOpacity
                style={[
                  styles.editorIconBtn,
                  { backgroundColor: isPreviewMode ? primaryBrown + '20' : cardBg, borderColor: borderCol },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setIsPreviewMode(!isPreviewMode);
                }}
              >
                <Feather
                  name={isPreviewMode ? 'edit-3' : 'eye'}
                  size={16}
                  color={isPreviewMode ? primaryBrown : textSecondary}
                />
              </TouchableOpacity>

              {/* More (...) Menu */}
              <TouchableOpacity
                style={[styles.editorIconBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
                onPress={() => {
                  triggerHaptic();
                  setIsEditorMoreMenuOpen(true);
                }}
              >
                <Feather name="more-horizontal" size={17} color={textPrimary} />
              </TouchableOpacity>

              {/* Done Button */}
              <TouchableOpacity
                style={[styles.editorDoneBtn, { backgroundColor: primaryBrown }]}
                onPress={handleCloseEditor}
              >
                <Text style={styles.editorDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.editorScroll}
              contentContainerStyle={{ paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Category Selector Chips */}
              <View style={styles.editorCategorySection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editorCategoryScroll}>
                  {CATEGORIES.filter((c) => c.name !== 'All').map((cat) => {
                    const isSelected = editorCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        style={[
                          styles.editorCategoryChip,
                          {
                            backgroundColor: isSelected ? cat.color + '22' : cardBg,
                            borderColor: isSelected ? cat.color : borderCol,
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setEditorCategory(cat.name);
                          saveCurrentNote(editorTitle, editorContent, cat.name);
                        }}
                      >
                        <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                        <Text
                          style={[
                            styles.editorCategoryChipText,
                            { color: isSelected ? cat.color : textSecondary, fontWeight: isSelected ? '700' : '500' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Large Note Title Input */}
              <TextInput
                style={[styles.editorTitleInput, { color: textPrimary }]}
                placeholder="Note Title..."
                placeholderTextColor={textSecondary + '70'}
                value={editorTitle}
                onChangeText={handleTitleChange}
                multiline={false}
                returnKeyType="next"
              />

              {/* Tags Interactive Section */}
              <View style={styles.editorTagsSection}>
                {editorTags.map((tag) => (
                  <View
                    key={tag}
                    style={[styles.editorTagBadge, { backgroundColor: cardBg, borderColor: borderCol }]}
                  >
                    <Text style={[styles.editorTagBadgeText, { color: primaryBrown }]}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="x" size={12} color={textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={[styles.tagInputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <Feather name="hash" size={11} color={textSecondary} />
                  <TextInput
                    style={[styles.tagTextInput, { color: textPrimary }]}
                    placeholder="Add tag..."
                    placeholderTextColor={textSecondary}
                    value={editorTagInput}
                    onChangeText={setEditorTagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  {editorTagInput.length > 0 && (
                    <TouchableOpacity onPress={handleAddTag}>
                      <Feather name="plus-circle" size={14} color={primaryBrown} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Note Content Area / Preview */}
              {isPreviewMode ? (
                <View style={[styles.previewContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <Text style={[styles.previewContent, { color: textPrimary }]}>
                    {editorContent || 'No content written yet.'}
                  </Text>
                </View>
              ) : (
                <TextInput
                  style={[styles.editorContentInput, { color: textPrimary }]}
                  placeholder="Start typing your notes here... You can use markdown or the formatting toolbar below."
                  placeholderTextColor={textSecondary + '70'}
                  value={editorContent}
                  onChangeText={handleContentChange}
                  multiline
                  textAlignVertical="top"
                  scrollEnabled={false}
                />
              )}
            </ScrollView>

            {/* 8. Compact Formatting Toolbar */}
            {!isPreviewMode && (
              <View style={[styles.formattingToolbar, { backgroundColor: cardBgElevated, borderTopColor: borderCol }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarScroll}>
                  {/* Undo */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={handleUndo}
                    disabled={historyIndexRef.current <= 0}
                  >
                    <Feather
                      name="rotate-ccw"
                      size={15}
                      color={historyIndexRef.current > 0 ? textPrimary : textSecondary + '50'}
                    />
                  </TouchableOpacity>

                  {/* Redo */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={handleRedo}
                    disabled={historyIndexRef.current >= historyRef.current.length - 1}
                  >
                    <Feather
                      name="rotate-cw"
                      size={15}
                      color={historyIndexRef.current < historyRef.current.length - 1 ? textPrimary : textSecondary + '50'}
                    />
                  </TouchableOpacity>

                  <View style={[styles.toolbarDivider, { backgroundColor: borderCol }]} />

                  {/* Bold */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('**', '**', 'bold text')}
                  >
                    <Feather name="bold" size={15} color={textPrimary} />
                  </TouchableOpacity>

                  {/* Italic */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('*', '*', 'italic text')}
                  >
                    <Feather name="italic" size={15} color={textPrimary} />
                  </TouchableOpacity>

                  {/* H1 */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('# ', '', 'Heading 1')}
                  >
                    <Text style={[styles.toolbarTextBtn, { color: textPrimary }]}>H1</Text>
                  </TouchableOpacity>

                  {/* H2 */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('## ', '', 'Heading 2')}
                  >
                    <Text style={[styles.toolbarTextBtn, { color: textPrimary }]}>H2</Text>
                  </TouchableOpacity>

                  {/* Checklist */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('- [ ] ', '', 'Task item')}
                  >
                    <Feather name="check-square" size={15} color={primaryBrown} />
                  </TouchableOpacity>

                  {/* Bullet list */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('- ', '', 'Bullet point')}
                  >
                    <Feather name="list" size={15} color={textPrimary} />
                  </TouchableOpacity>

                  {/* Numbered list */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('1. ', '', 'Numbered point')}
                  >
                    <Text style={[styles.toolbarTextBtn, { color: textPrimary }]}>1.</Text>
                  </TouchableOpacity>

                  {/* Quote */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('> ', '', 'Important quote')}
                  >
                    <Feather name="message-circle" size={15} color={textPrimary} />
                  </TouchableOpacity>

                  {/* Code */}
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => insertFormatting('```\n', '\n```', 'code block')}
                  >
                    <Feather name="code" size={15} color={textPrimary} />
                  </TouchableOpacity>

                  <View style={[styles.toolbarDivider, { backgroundColor: borderCol }]} />

                  {/* Template Picker Inserter */}
                  <TouchableOpacity
                    style={[styles.templateInsertBtn, { backgroundColor: primaryBrown + '18' }]}
                    onPress={() => {
                      triggerHaptic();
                      setIsTemplateModalOpen(true);
                    }}
                  >
                    <Feather name="layers" size={12} color={primaryBrown} style={{ marginRight: 4 }} />
                    <Text style={[styles.templateInsertText, { color: primaryBrown }]}>Template</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 9. Editor More Options Bottom Sheet */}
      <Modal
        visible={isEditorMoreMenuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditorMoreMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsEditorMoreMenuOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.bottomSheetCard, { backgroundColor: sheetBg, borderColor: borderCol }]}>
                <View style={styles.sheetHandleBar}>
                  <View style={[styles.sheetHandle, { backgroundColor: borderCol }]} />
                </View>

                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: textPrimary }]}>Note Options</Text>
                  <TouchableOpacity onPress={() => setIsEditorMoreMenuOpen(false)}>
                    <Feather name="x" size={18} color={textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.moreMenuList}>
                  {/* Pin */}
                  <TouchableOpacity
                    style={[styles.moreMenuItem, { borderBottomColor: borderCol }]}
                    onPress={() => {
                      handleTogglePin();
                    }}
                  >
                    <View style={[styles.moreMenuIconCircle, { backgroundColor: primaryBrown + '15' }]}>
                      <Feather name="anchor" size={16} color={primaryBrown} />
                    </View>
                    <View style={styles.moreMenuTextBlock}>
                      <Text style={[styles.moreMenuLabel, { color: textPrimary }]}>
                        {editorIsPinned ? 'Unpin Note' : 'Pin Note'}
                      </Text>
                      <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                        Keep note pinned at top of your notes workspace
                      </Text>
                    </View>
                    <Feather name={editorIsPinned ? 'check-circle' : 'circle'} size={18} color={editorIsPinned ? primaryBrown : textSecondary} />
                  </TouchableOpacity>

                  {/* Favorite */}
                  <TouchableOpacity
                    style={[styles.moreMenuItem, { borderBottomColor: borderCol }]}
                    onPress={() => {
                      handleToggleFavorite();
                    }}
                  >
                    <View style={[styles.moreMenuIconCircle, { backgroundColor: warningOrange + '15' }]}>
                      <Feather name="star" size={16} color={warningOrange} />
                    </View>
                    <View style={styles.moreMenuTextBlock}>
                      <Text style={[styles.moreMenuLabel, { color: textPrimary }]}>
                        {editorIsFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      </Text>
                      <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                        Bookmark for fast access in Favorites tab
                      </Text>
                    </View>
                    <Feather name={editorIsFavorite ? 'check-circle' : 'circle'} size={18} color={editorIsFavorite ? warningOrange : textSecondary} />
                  </TouchableOpacity>

                  {/* Convert to Task */}
                  <TouchableOpacity
                    style={[styles.moreMenuItem, { borderBottomColor: borderCol }]}
                    onPress={() => handleOpenConvertTask()}
                  >
                    <View style={[styles.moreMenuIconCircle, { backgroundColor: infoBlue + '15' }]}>
                      <Feather name="check-square" size={16} color={infoBlue} />
                    </View>
                    <View style={styles.moreMenuTextBlock}>
                      <Text style={[styles.moreMenuLabel, { color: textPrimary }]}>Convert to Task</Text>
                      <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                        Add directly to your GabAI Task Manager
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={textSecondary} />
                  </TouchableOpacity>

                  {/* Link to Calendar */}
                  <TouchableOpacity
                    style={[styles.moreMenuItem, { borderBottomColor: borderCol }]}
                    onPress={() => handleOpenScheduleLink()}
                  >
                    <View style={[styles.moreMenuIconCircle, { backgroundColor: successGreen + '15' }]}>
                      <Feather name="calendar" size={16} color={successGreen} />
                    </View>
                    <View style={styles.moreMenuTextBlock}>
                      <Text style={[styles.moreMenuLabel, { color: textPrimary }]}>Link to Calendar</Text>
                      <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                        Schedule study time or revision blocks
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={textSecondary} />
                  </TouchableOpacity>

                  {/* Share */}
                  <TouchableOpacity
                    style={[styles.moreMenuItem, { borderBottomColor: borderCol }]}
                    onPress={() => handleShareNote()}
                  >
                    <View style={[styles.moreMenuIconCircle, { backgroundColor: textSecondary + '15' }]}>
                      <Feather name="share-2" size={16} color={textPrimary} />
                    </View>
                    <View style={styles.moreMenuTextBlock}>
                      <Text style={[styles.moreMenuLabel, { color: textPrimary }]}>Share Note</Text>
                      <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                        Export content to other apps
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={textSecondary} />
                  </TouchableOpacity>

                  {/* Archive */}
                  <TouchableOpacity
                    style={[styles.moreMenuItem, { borderBottomColor: borderCol }]}
                    onPress={() => handleToggleArchive()}
                  >
                    <View style={[styles.moreMenuIconCircle, { backgroundColor: warningOrange + '15' }]}>
                      <Feather name="archive" size={16} color={warningOrange} />
                    </View>
                    <View style={styles.moreMenuTextBlock}>
                      <Text style={[styles.moreMenuLabel, { color: textPrimary }]}>
                        {editorIsArchived ? 'Unarchive Note' : 'Archive Note'}
                      </Text>
                      <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                        Move note to archive without deleting
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={textSecondary} />
                  </TouchableOpacity>

                  {/* Delete */}
                  {editingNoteId && (
                    <TouchableOpacity
                      style={[styles.moreMenuItem, { borderBottomWidth: 0 }]}
                      onPress={() => handleDeleteNote()}
                    >
                      <View style={[styles.moreMenuIconCircle, { backgroundColor: errorRed + '15' }]}>
                        <Feather name="trash-2" size={16} color={errorRed} />
                      </View>
                      <View style={styles.moreMenuTextBlock}>
                        <Text style={[styles.moreMenuLabel, { color: errorRed }]}>Delete Note</Text>
                        <Text style={[styles.moreMenuDesc, { color: textSecondary }]}>
                          Permanently remove this note
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={errorRed} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 10. Templates Selection Modal */}
      <Modal
        visible={isTemplateModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTemplateModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsTemplateModalOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.bottomSheetCard, { backgroundColor: sheetBg, borderColor: borderCol }]}>
                <View style={styles.sheetHandleBar}>
                  <View style={[styles.sheetHandle, { backgroundColor: borderCol }]} />
                </View>

                <View style={styles.sheetHeader}>
                  <View style={styles.sheetHeaderLeft}>
                    <Feather name="layers" size={17} color={primaryBrown} style={{ marginRight: 8 }} />
                    <Text style={[styles.sheetTitle, { color: textPrimary }]}>Student Templates</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsTemplateModalOpen(false)}>
                    <Feather name="x" size={18} color={textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  {TEMPLATES.map((tmpl) => {
                    const catColor = getCategoryColor(tmpl.category);
                    return (
                      <TouchableOpacity
                        key={tmpl.id}
                        style={[styles.templateCardItem, { backgroundColor: cardBg, borderColor: borderCol }]}
                        activeOpacity={0.82}
                        onPress={() => {
                          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                          setIsTemplateModalOpen(false);
                          if (isEditorOpen) {
                            setEditorTitle(tmpl.title);
                            setEditorCategory(tmpl.category);
                            handleContentChange(tmpl.content);
                          } else {
                            handleOpenNewNote(tmpl.category, tmpl.content, tmpl.title);
                          }
                        }}
                      >
                        <View style={styles.templateCardTop}>
                          <Text style={[styles.templateCardTitle, { color: textPrimary }]}>{tmpl.title}</Text>
                          <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
                            <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                            <Text style={[styles.categoryBadgeText, { color: catColor }]}>{tmpl.category}</Text>
                          </View>
                        </View>
                        <Text style={[styles.templateCardDesc, { color: textSecondary }]}>
                          {tmpl.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 11. Convert Note to Task Modal */}
      <Modal
        visible={convertTaskModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setConvertTaskModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardBgElevated, borderColor: borderCol }]}>
            <View style={styles.modalCardHeader}>
              <View style={styles.modalCardHeaderLeft}>
                <Feather name="check-square" size={18} color={primaryBrown} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Convert Note to Task</Text>
              </View>
              <TouchableOpacity onPress={() => setConvertTaskModalOpen(false)}>
                <Feather name="x" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
              Create a synced task in your GabAI Task Manager from this note.
            </Text>

            {convertTargetNote && (
              <View style={[styles.convertNoteSummary, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.convertNoteTitle, { color: textPrimary }]} numberOfLines={1}>
                  {convertTargetNote.title}
                </Text>
                <Text style={[styles.convertNoteSnippet, { color: textSecondary }]} numberOfLines={2}>
                  {getCleanSnippet(convertTargetNote.content)}
                </Text>
              </View>
            )}

            {/* Subject Input */}
            <Text style={[styles.inputLabel, { color: textSecondary }]}>Subject / Course</Text>
            <TextInput
              style={[styles.modalTextInput, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
              placeholder="e.g. Capstone, Economics, General"
              placeholderTextColor={textSecondary}
              value={taskSubjectInput}
              onChangeText={setTaskSubjectInput}
            />

            {/* Priority Selector */}
            <Text style={[styles.inputLabel, { color: textSecondary }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['High', 'Medium', 'Low'] as Task['priority'][]).map((p) => {
                const isSelected = taskPriorityInput === p;
                const pColor = p === 'High' ? errorRed : p === 'Medium' ? warningOrange : successGreen;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor: isSelected ? pColor + '20' : cardBg,
                        borderColor: isSelected ? pColor : borderCol,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setTaskPriorityInput(p);
                    }}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        { color: isSelected ? pColor : textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: borderCol }]}
                onPress={() => setConvertTaskModalOpen(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: primaryBrown }]}
                onPress={handleConfirmConvertTask}
              >
                <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalConfirmBtnText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 12. Link Note to Schedule Modal */}
      <Modal
        visible={scheduleModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setScheduleModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardBgElevated, borderColor: borderCol }]}>
            <View style={styles.modalCardHeader}>
              <View style={styles.modalCardHeaderLeft}>
                <Feather name="calendar" size={18} color={primaryBrown} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Link Note to Calendar</Text>
              </View>
              <TouchableOpacity onPress={() => setScheduleModalOpen(false)}>
                <Feather name="x" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
              Schedule a study session or revision block for this note in your calendar.
            </Text>

            {/* Date Input */}
            <Text style={[styles.inputLabel, { color: textSecondary }]}>Event Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.modalTextInput, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={textSecondary}
              value={scheduleDateInput}
              onChangeText={setScheduleDateInput}
            />

            {/* Time Input */}
            <Text style={[styles.inputLabel, { color: textSecondary }]}>Time (HH:MM)</Text>
            <TextInput
              style={[styles.modalTextInput, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
              placeholder="14:00"
              placeholderTextColor={textSecondary}
              value={scheduleTimeInput}
              onChangeText={setScheduleTimeInput}
            />

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: borderCol }]}
                onPress={() => setScheduleModalOpen(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: primaryBrown }]}
                onPress={handleConfirmScheduleLink}
              >
                <Feather name="calendar" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalConfirmBtnText}>Schedule</Text>
              </TouchableOpacity>
            </View>
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
  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBlock: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  counterBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  primaryHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Prominent Search Bar
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },

  // Smart Compact Filter Strip
  smartFilterStrip: {
    paddingBottom: 6,
  },
  smartFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  compactTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
  },
  compactTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterSheetTrigger: {
    paddingHorizontal: 12,
  },
  filterBadgeCount: {
    marginLeft: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // Active filters banner
  activeFiltersBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFiltersLeft: {
    flex: 1,
  },
  activeFiltersText: {
    fontSize: 11,
  },
  clearFiltersBtnText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Scroll Content & Layout
  scrollContent: {
    paddingBottom: 90,
  },
  notesContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  notesGridWrapper: {
    width: '100%',
  },
  notesGridLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  notesListLayout: {
    flexDirection: 'column',
    gap: 10,
  },

  // Note Card
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardIconIndicator: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardSnippet: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  cardTagChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardMoreTags: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionIconBtn: {
    padding: 2,
  },

  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
  },
  fabSpeedDial: {
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  fabSpeedDialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  fabSpeedDialLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fabSpeedDialIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMainBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A97C50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Bottom Sheets Generic
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 10,
  },
  sheetHandleBar: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sheetResetBtn: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sheetPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  sheetCategoryChipText: {
    fontSize: 12,
  },
  sheetTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheetTagText: {
    fontSize: 11,
  },
  sheetSortChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  sheetSortText: {
    fontSize: 12,
  },
  sheetViewModeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetViewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  sheetViewModeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetDoneBtn: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Focused Editor Screen
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editorHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  saveStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editorIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorDoneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editorDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editorScroll: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  editorCategorySection: {
    marginBottom: 12,
  },
  editorCategoryScroll: {
    gap: 8,
  },
  editorCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  editorCategoryChipText: {
    fontSize: 12,
  },
  editorTitleInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 10,
    paddingVertical: 4,
  },
  editorTagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  editorTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  editorTagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    gap: 4,
  },
  tagTextInput: {
    fontSize: 11,
    padding: 0,
    minWidth: 60,
  },
  editorContentInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 300,
  },
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 250,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Formatting Toolbar
  formattingToolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  toolbarScroll: {
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 4,
  },
  toolbarBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTextBtn: {
    fontSize: 13,
    fontWeight: '800',
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  templateInsertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 2,
  },
  templateInsertText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // More Options Menu Items
  moreMenuList: {
    gap: 4,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  moreMenuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMenuTextBlock: {
    flex: 1,
  },
  moreMenuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreMenuDesc: {
    fontSize: 11,
    marginTop: 2,
  },

  // Template Modal Cards
  templateCardItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  templateCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  templateCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  templateCardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Convert to Task & Schedule Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  convertNoteSummary: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  convertNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  convertNoteSnippet: {
    fontSize: 11,
    lineHeight: 15,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  modalTextInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 14,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 12,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
