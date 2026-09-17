import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CalendarEvent } from '../types';
import { CATEGORY_COLORS, WEEKDAYS } from '../constants/calendarConfig';
import { calendarStyles as styles } from '../styles/calendar.styles';
import { getMonthGrid, shiftMonthISO, todayISO, parseISODate } from '@/utils/date';

interface MonthViewProps {
  events: CalendarEvent[];
  selectedDate: string;
  rescheduleMode: boolean;
  onSelectDate: (date: string) => void;
  onCompleteRescheduling: (date: string) => void;
  cardTheme: string;
  borderTheme: string;
  textTheme: string;
  textSubTheme: string;
  primaryAccent: string;
}

export default function MonthView({
  events,
  selectedDate,
  rescheduleMode,
  onSelectDate,
  onCompleteRescheduling,
  cardTheme,
  borderTheme,
  textTheme,
  textSubTheme,
  primaryAccent,
}: MonthViewProps) {
  const today = todayISO();
  const grid = getMonthGrid(selectedDate);

  return (
    <View style={[styles.calendarCard, { backgroundColor: cardTheme, borderColor: borderTheme }]}>
      <View style={styles.calendarMonthHeader}>
        <Text style={[styles.monthLabel, { color: textTheme }]}>{grid.label}</Text>
        <View style={styles.monthHeaderActions}>
          <TouchableOpacity style={styles.arrowButton} onPress={() => onSelectDate(shiftMonthISO(selectedDate, -1))}>
            <Feather name="chevron-left" size={20} color={textTheme} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowButton} onPress={() => onSelectDate(shiftMonthISO(selectedDate, 1))}>
            <Feather name="chevron-right" size={20} color={textTheme} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, idx) => (
          <Text key={idx} style={[styles.weekdayLabel, { color: textSubTheme }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid days */}
      <View style={styles.calendarGrid}>
        {grid.cells.map((dayString, idx) => {
          if (!dayString) {
            return <View key={idx} style={styles.emptyGridCell} />;
          }

          const cellDay = parseISODate(dayString).getDate();
          const isSelected = selectedDate === dayString;
          const isToday = dayString === today;

          // Get events for this specific date
          const dayEvents = events.filter((e) => e.date === dayString);

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                if (rescheduleMode) {
                  onCompleteRescheduling(dayString);
                } else {
                  onSelectDate(dayString);
                }
              }}
              style={[
                styles.gridCell,
                {
                  backgroundColor: isSelected ? primaryAccent : 'transparent',
                  borderColor: isToday ? primaryAccent : 'transparent',
                  borderWidth: isToday ? 1.5 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellDayText,
                  { color: isSelected ? '#FFFFFF' : isToday ? primaryAccent : textTheme },
                ]}
              >
                {cellDay}
              </Text>
              {/* Event color indicators */}
              <View style={styles.indicatorRow}>
                {dayEvents.slice(0, 3).map((evt) => (
                  <View
                    key={evt.id}
                    style={[styles.indicatorDot, { backgroundColor: CATEGORY_COLORS[evt.category] }]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
