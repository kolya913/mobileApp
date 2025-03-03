import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Button,
  ActivityIndicator,
} from 'react-native';
import { ScheduleDTO } from '../../hooks/useSchedule';
import { useAuthInternetConnection } from '../../hooks/useAuthInternetConnection';
import { useSchedule } from '../../hooks/useSchedule';

interface DayScheduleProps {
  daySchedule: ScheduleDTO[];
  colors: any;
  loadingAttendanceIds?: number[];
  onAttendanceUpdate: (updatedItems: ScheduleDTO[]) => void;
}

const DaySchedule: React.FC<DayScheduleProps> = ({
  daySchedule,
  colors,
  loadingAttendanceIds = [],
  onAttendanceUpdate,
}) => {
  const { roles } = useAuthInternetConnection();
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  const { updateAttendanceStatus } = useSchedule();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<ScheduleDTO | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const isPracticeInstructor = normalizedRoles.includes('PRACTICAL_INSTRUCTOR');

  const handleAttendanceChange = async (status: 'PRESENT' | 'ABSENT') => {
    if (selectedAttendance?.id) {
      setIsUpdating(true);
      try {
        const updatedDaySchedule = await updateAttendanceStatus(
          selectedAttendance.id,
          status === 'PRESENT',
          daySchedule
        );
        onAttendanceUpdate(updatedDaySchedule);
      } catch (err) {
        console.error('Ошибка обновления:', err);
      } finally {
        setIsUpdating(false);
      }
    }
    setIsModalVisible(false);
  };

  const handleOpenModal = (scheduleItem: ScheduleDTO) => {
    setSelectedAttendance(scheduleItem);
    setIsModalVisible(true);
  };

  const isFutureOrCurrentDate = (dateTime?: string | null) => {
    if (!dateTime) { return false; }
    const scheduleDate = new Date(dateTime);
    const currentDate = new Date();
    scheduleDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return scheduleDate >= currentDate;
  };

  if (daySchedule.length === 0) {
    return <Text style={[styles.info, { color: colors.text }]}>Нет расписания на этот день.</Text>;
  }

  return (
    <View style={styles.scheduleList}>
      {daySchedule.map((item) => {
        const isLoading = loadingAttendanceIds.includes(item.id!);
        const isFutureOrCurrent = isFutureOrCurrentDate(item.dateTime);

        return (
          <View
            key={item.id}
            style={[
              styles.scheduleItem,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.itemLoader}
              />
            )}

            {item.dateTime && (
              <Text style={[styles.scheduleText, { color: colors.text }]}>
                Время: {new Date(item.dateTime).toLocaleTimeString()}
              </Text>
            )}
            {item.type && (
              <Text style={[styles.scheduleText, { color: colors.text }]}>
                Тип: {item.type === 'THEORY' ? 'Теоретическое занятие' : 'Практическое занятие'}
              </Text>
            )}
            {item.groupName && (
              <Text style={[styles.scheduleText, { color: colors.text }]}>
                Группа: {item.groupName}
              </Text>
            )}
            {item.studentName && (
              <Text style={[styles.scheduleText, { color: colors.text }]}>
                Студент: {item.studentName}
              </Text>
            )}
            {item.instructorName && (
              <Text style={[styles.scheduleText, { color: colors.text }]}>
                Инструктор: {item.instructorName}
              </Text>
            )}

            {item.attendance && (
              <View style={[
                styles.attendanceContainer,
                { backgroundColor: colors.attendanceBackground },
              ]}>
                <Text style={[styles.attendanceTitle, { color: colors.text }]}>
                  Посещаемость:
                </Text>
                {isLoading ? (
                  <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
                    Загрузка...
                  </Text>
                ) : item.attendance.length === 0 ? (
                  <Text style={[styles.attendanceText, { color: colors.secondaryText }]}>
                    Нет данных
                  </Text>
                ) : (
                  item.attendance.map((attendance) => (
                    <Text
                      key={attendance.id}
                      style={[styles.attendanceText, { color: colors.text }]}
                    >
                      {attendance.studentId && `Студент ${attendance.studentId}: `}
                      {attendance.status === 'PRESENT' ? 'Присутствовал' : 'Отсутствовал'}
                    </Text>
                  ))
                )}
              </View>
            )}

            {isPracticeInstructor && isFutureOrCurrent && (
              <TouchableOpacity
                onPress={() => handleOpenModal(item)}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.buttonText }}>
                  Изменить посещаемость
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={[
          styles.modalOverlay,
          { backgroundColor: colors.overlay },
        ]}>
          <View style={[
            styles.modalContainer,
            {
              backgroundColor: colors.card,
              shadowColor: colors.text,
            },
          ]}>
            <Text style={[
              styles.modalTitle,
              { color: colors.text },
            ]}>
              Изменить статус посещаемости
            </Text>

            <Button
              title="Присутствовал"
              onPress={() => handleAttendanceChange('PRESENT')}
              color={colors.primary}
              disabled={isUpdating}
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Отсутствовал"
              onPress={() => handleAttendanceChange('ABSENT')}
              color={colors.error}
              disabled={isUpdating}
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Отмена"
              onPress={() => setIsModalVisible(false)}
              color={colors.border}
              disabled={isUpdating}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scheduleList: {
    width: '100%',
  },
  scheduleItem: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleText: {
    fontSize: 16,
    marginBottom: 5,
  },
  info: {
    fontSize: 18,
    marginTop: 5,
    textAlign: 'center',
  },
  attendanceContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  attendanceText: {
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 15,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonSpacer: {
    height: 10,
  },
  itemLoader: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DaySchedule;
