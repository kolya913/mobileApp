import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Button, Alert } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { useSchedule } from '../hooks/useSchedule';
import { themes } from '../theme/Styles';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import DaySchedule from '../components/schedule/DaySchedule';
import { useAuthInternetConnection } from '../hooks/useAuthInternetConnection';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    getStudentsForInstructor,
    createSchedule,
  } = useSchedule();

  const { roles, userId } = useAuthInternetConnection();
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  const isPracticalInstructor = normalizedRoles.includes('PRACTICAL_INSTRUCTOR');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadedAttendanceDates, setLoadedAttendanceDates] = useState<Set<string>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [students, setStudents] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

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

  const handleAddLesson = async () => {
    if (!userId) {
      console.error('Пользователь не авторизован');
      return;
    }

    try {
      const students = await getStudentsForInstructor();
      setStudents(students);
      setSelectedStudentIds([]);
      setIsModalVisible(true);
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
    }
  };

  const handleCreateSchedule = async () => {
    if (selectedStudentIds.length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите хотя бы одного студента.');
      return;
    }

    try {
      const timeString = selectedTime.toTimeString().split(' ')[0];
      const dateTime = `${selectedDate}T${timeString}`;

      await createSchedule({
        dateTime,
        studentId: selectedStudentIds,
        instructorId: userId!,
      });

      setIsModalVisible(false);
      setSelectedStudentIds([]);
      setSelectedTime(new Date());

      const currentDate = new Date();
      fetchScheduleAndAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (err) {
      console.error('Ошибка создания занятия:', err);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

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

        {isPracticalInstructor && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
                marginBottom: 10,
              }
            ]}
            onPress={handleAddLesson}
          >
            <Text style={{ color: colors.buttonText }}>
              Назначить занятие
            </Text>
          </TouchableOpacity>
        )}

        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Назначить занятие на {selectedDate}
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>Время:</Text>
              <TouchableOpacity
                style={[styles.timePickerButton, { borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {selectedTime.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}

              <Text style={[styles.label, { color: colors.text }]}>Студенты:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStudentIds}
                  onValueChange={(itemValue) => setSelectedStudentIds(itemValue)}
                  mode="dropdown"
                  style={[styles.picker, { color: colors.text }]}
                  multiple
                >
                  <Picker.Item
                    label="Выберите студента"
                    value={null}
                    enabled={false}
                  />
                  {students.map(student => (
                    <Picker.Item
                      key={student.id}
                      label={`${student.firstName} ${student.lastName}`}
                      value={student.id}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="Отмена"
                  onPress={() => setIsModalVisible(false)}
                  color={colors.border}
                />
                <Button
                  title="Создать"
                  onPress={handleCreateSchedule}
                  color={colors.primary}
                />
              </View>
            </View>
          </View>
        </Modal>

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
  addButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  timePickerButton: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ScheduleScreen;
