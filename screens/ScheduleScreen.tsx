import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { useSchedule } from '../hooks/useSchedule';
import { themes } from '../theme/Styles';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import DaySchedule from '../components/schedule/DaySchedule';

LocaleConfig.locales['ru'] = {
  monthNames: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  monthNamesShort: [
    'Янв',
    'Фев',
    'Мар',
    'Апр',
    'Май',
    'Июн',
    'Июл',
    'Авг',
    'Сен',
    'Окт',
    'Ноя',
    'Дек',
  ],
  dayNames: [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};
LocaleConfig.defaultLocale = 'ru';

const ScheduleScreen = () => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const {
    schedule,
    setSchedule,
    loading,
    error,
    loadingAttendanceIds,
    fetchScheduleAndAttendance,
    fetchAttendanceForDay,
    updateAttendanceStatus,
  } = useSchedule();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadedAttendanceDates, setLoadedAttendanceDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    fetchScheduleAndAttendance(year, month)
      .finally(() => {
        setInitialLoading(false);
      });
  }, [fetchScheduleAndAttendance]);

  useEffect(() => {
    if (!initialLoading && !loadedAttendanceDates.has(selectedDate)) {
      const scheduleIds = schedule
        .filter(item => item.dateTime?.startsWith(selectedDate) && (!item.attendance || item.attendance.length === 0))
        .map(item => item.id)
        .filter((id): id is number => id !== null && id !== undefined);

      if (scheduleIds.length > 0) {
        fetchAttendanceForDay(selectedDate, scheduleIds)
          .then(() => {
            setLoadedAttendanceDates(prev => new Set(prev).add(selectedDate));
          });
      } else {
        setLoadedAttendanceDates(prev => new Set(prev).add(selectedDate));
      }
    }
  }, [selectedDate, schedule, fetchAttendanceForDay, initialLoading, loadedAttendanceDates]);

  const daySchedule = useMemo(() => {
    return schedule.filter(item => item.dateTime?.startsWith(selectedDate));
  }, [schedule, selectedDate]);

  const handleAttendanceUpdate = useCallback((updatedItems: ScheduleDTO[]) => {
    setSchedule(prev =>
      prev.map(item =>
        updatedItems.find(updated => updated.id === item.id) || item
      )
    );
  }, []);

  const markedDates = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const marked = schedule.reduce((acc, item) => {
      const date = item.dateTime?.split('T')[0];
      if (date) {
        acc[date] = { marked: true, dotColor: colors.primary };
      }
      return acc;
    }, {} as { [key: string]: { marked: boolean; dotColor: string } });

    marked[today] = {
      ...marked[today],
      selected: true,
      selectedColor: '#00BFFF',
    };

    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#32CD32',
    };

    return marked;
  }, [schedule, colors.primary, selectedDate]);

  if (initialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Ошибка: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Расписание</Text>
        {loading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}
        <Calendar
          current={selectedDate}
          onDayPress={day => setSelectedDate(day.dateString)}
          onMonthChange={month => fetchScheduleAndAttendance(month.year, month.month)}
          markedDates={markedDates}
          markingType="simple"
          firstDay={1}
          style={[
            styles.calendar,
            {
              borderColor: colors.border,
              borderWidth: 1,
              backgroundColor: colors.card,
            },
          ]}
        />
        <View style={styles.scheduleContainer}>
          <Text style={[styles.scheduleTitle, { color: colors.text }]}>
            Расписание на {selectedDate}
          </Text>
          <DaySchedule
            daySchedule={daySchedule}
            colors={colors}
            loadingAttendanceIds={loadingAttendanceIds}
            onAttendanceUpdate={handleAttendanceUpdate}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scheduleContainer: {
    flex: 1,
    width: '100%',
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  calendar: {
    width: '100%',
    height: 350,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
});

export default ScheduleScreen;