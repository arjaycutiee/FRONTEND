import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TaskTheme, TaskCategory, TaskPriority, TaskDifficulty, TaskRepeat } from '../../types';
import type { useTaskData } from '../../hooks/useTaskData';
import {
  CATEGORIES,
  SUBJECTS,
  PRIORITIES,
  DIFFICULTIES,
  REPEAT_OPTIONS,
} from '../../constants/taskConfig';
import { taskStyles as styles } from '../../styles/task.styles';

interface AddTaskModalProps {
  taskData: ReturnType<typeof useTaskData>;
  theme: TaskTheme;
}

export default function AddTaskModal({ taskData, theme }: AddTaskModalProps) {
  const {
    isAdding,
    setIsAdding,
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
  } = taskData;

  const { cardBg, borderCol, inputBg, textPrimary, textSecondary, primaryBrown } = theme;

  return (
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: borderCol, maxHeight: '90%' },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Create New Task</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>TASK TITLE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
                placeholder="e.g. Chapter 4 Methodology Draft"
                placeholderTextColor={textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* Description */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>DESCRIPTION / NOTES</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary },
                ]}
                placeholder="Add instructions, rubric requirements, links..."
                placeholderTextColor={textSecondary}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline={true}
              />

              {/* Subject */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>SUBJECT / COURSE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subjectRow}
              >
                {SUBJECTS.map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    style={[
                      styles.toggleSelectBtn,
                      {
                        backgroundColor: newSubject === sub ? primaryBrown : inputBg,
                        borderColor: newSubject === sub ? primaryBrown : borderCol,
                      },
                    ]}
                    onPress={() => setNewSubject(sub)}
                  >
                    <Text
                      style={[
                        styles.toggleSelectText,
                        { color: newSubject === sub ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Category */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>CATEGORY</Text>
              <View style={styles.gridRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.gridBtn,
                      {
                        backgroundColor: newCategory === cat ? primaryBrown : inputBg,
                        borderColor: newCategory === cat ? primaryBrown : borderCol,
                      },
                    ]}
                    onPress={() => setNewCategory(cat as TaskCategory)}
                  >
                    <Text
                      style={[
                        styles.gridBtnText,
                        { color: newCategory === cat ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Priority & Difficulty */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>PRIORITY</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {PRIORITIES.map((pri) => (
                      <TouchableOpacity
                        key={pri}
                        style={[
                          styles.gridBtn,
                          {
                            flex: 1,
                            backgroundColor: newPriority === pri ? primaryBrown : inputBg,
                            borderColor: newPriority === pri ? primaryBrown : borderCol,
                          },
                        ]}
                        onPress={() => setNewPriority(pri)}
                      >
                        <Text
                          style={[
                            styles.gridBtnText,
                            { color: newPriority === pri ? '#FFFFFF' : textPrimary },
                          ]}
                        >
                          {pri}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>DIFFICULTY</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {DIFFICULTIES.map((dif) => (
                      <TouchableOpacity
                        key={dif}
                        style={[
                          styles.gridBtn,
                          {
                            flex: 1,
                            backgroundColor: newDifficulty === dif ? primaryBrown : inputBg,
                            borderColor: newDifficulty === dif ? primaryBrown : borderCol,
                          },
                        ]}
                        onPress={() => setNewDifficulty(dif)}
                      >
                        <Text
                          style={[
                            styles.gridBtnText,
                            { color: newDifficulty === dif ? '#FFFFFF' : textPrimary },
                          ]}
                        >
                          {dif}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Estimated Duration & Date/Time */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>
                ESTIMATED TIME (HOURS)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
                placeholder="1.5"
                placeholderTextColor={textSecondary}
                keyboardType="numeric"
                value={newDuration}
                onChangeText={setNewDuration}
              />

              <View style={styles.dateTimeContainer}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>DUE DATE</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={textSecondary}
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>DUE TIME</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textPrimary }]}
                    placeholder="HH:MM"
                    placeholderTextColor={textSecondary}
                    value={newDueTime}
                    onChangeText={setNewDueTime}
                  />
                </View>
              </View>

              {/* Subtasks Builder */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>SUBTASKS / CHECKLIST</Text>
              <View style={styles.subtaskBuilderRow}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginBottom: 0, backgroundColor: inputBg, borderColor: borderCol, color: textPrimary },
                  ]}
                  placeholder="e.g. Gather 5 references"
                  placeholderTextColor={textSecondary}
                  value={newSubTaskInput}
                  onChangeText={setNewSubTaskInput}
                  onSubmitEditing={handleAddSubTaskToList}
                />
                <TouchableOpacity
                  style={[styles.addSubtaskBtn, { backgroundColor: primaryBrown }]}
                  onPress={handleAddSubTaskToList}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {newSubTasksList.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.subtaskBuilderListItem,
                    { backgroundColor: inputBg, borderColor: borderCol },
                  ]}
                >
                  <Text style={[styles.subtaskListItemText, { color: textPrimary }]}>{item}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSubTaskFromList(idx)}>
                    <Feather name="trash-2" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Notification Switch */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Feather name="bell" size={16} color={primaryBrown} style={{ marginRight: 8 }} />
                  <Text style={[styles.switchLabel, { color: textPrimary }]}>Set Reminder</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setNewHasReminder(!newHasReminder)}
                  style={[
                    styles.customSwitch,
                    { backgroundColor: newHasReminder ? primaryBrown : borderCol },
                  ]}
                >
                  <View
                    style={[
                      styles.switchKnob,
                      { alignSelf: newHasReminder ? 'flex-end' : 'flex-start' },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Repeat Options */}
              <Text style={[styles.inputLabel, { color: textSecondary }]}>REPEAT</Text>
              <View style={styles.gridRow}>
                {REPEAT_OPTIONS.map((rep) => (
                  <TouchableOpacity
                    key={rep}
                    style={[
                      styles.gridBtn,
                      {
                        backgroundColor: newRepeat === rep ? primaryBrown : inputBg,
                        borderColor: newRepeat === rep ? primaryBrown : borderCol,
                      },
                    ]}
                    onPress={() => setNewRepeat(rep as TaskRepeat)}
                  >
                    <Text
                      style={[
                        styles.toggleSelectText,
                        { color: newRepeat === rep ? '#FFFFFF' : textPrimary },
                      ]}
                    >
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
  );
}
