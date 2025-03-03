import { useState, useEffect, useCallback } from 'react';
import { useAuthInternetConnection } from './useAuthInternetConnection';
import api from '../config/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduleDTO {
  id?: number | null;
  dateTime?: string | null;
  type?: string | null;
  groupId?: number | null;
  groupName?: string | null;
  studentId?: number | null;
  studentName?: string | null;
  instructorId?: number | null;
  instructorName?: string | null;
  attendance?: AttendanceDTO[];
}

export interface AttendanceDTO {
  id: number;
  scheduleId: number;
  studentId: number;
  instructorId: number;
  status: string;
}

export interface UserDTO {
  id: number;
  firstName: string;
  lastName: string;
}

export const useSchedule = () => {
  const { userId } = useAuthInternetConnection();
  const [schedule, setSchedule] = useState<ScheduleDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAttendanceIds, setLoadingAttendanceIds] = useState<number[]>([]);

  const updateAttendanceStatus = useCallback(
    async (scheduleId: number, status: boolean, daySchedule: ScheduleDTO[]) => {
      try {
  
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.warn('[DEBUG] Токен не найден, запрос не выполнен.');
          return daySchedule;
        }
  
        const response = await api.post<AttendanceDTO>(
          `/v1/schedules/user/attendances/${scheduleId}?status=${status}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
  
        const updatedDaySchedule = daySchedule.map(scheduleItem => {
          if (scheduleItem.id === scheduleId) {
            const existingAttendance = scheduleItem.attendance || [];
            const attendanceIndex = existingAttendance.findIndex(att => att.studentId === response.data.studentId);
  
            const updatedAttendance =
              attendanceIndex !== -1
                ? existingAttendance.map((att, index) =>
                    index === attendanceIndex ? response.data : att
                  )
                : [...existingAttendance, response.data];
  
            return { ...scheduleItem, attendance: updatedAttendance };
          }
          return scheduleItem;
        });
  
  
        return updatedDaySchedule;
      } catch (err) {
        console.error('Ошибка обновления посещаемости:', err);
        throw err;
      }
    },
    []
  );


  const fetchScheduleAndAttendance = useCallback(async (year: number, month: number) => {
    if (!userId) {
      setError('Пользователь не авторизован');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setError('Токен отсутствует');
        setLoading(false);
        return;
      }

      const monthYear = `${String(month).padStart(2, '0')}.${year}`;
      const scheduleResponse = await api.get<ScheduleDTO[]>(
        `/v1/schedules/user/${userId}?month=${monthYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );


      setSchedule(scheduleResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAttendanceForDay = useCallback(async (date: string, scheduleIds: number[]) => {
    if (!userId || scheduleIds.length === 0) {
      console.log('Пользователь не авторизован или отсутствуют scheduleIds');
      return;
    }
  
    setLoadingAttendanceIds(prev => [...prev, ...scheduleIds]);
  
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('Токен отсутствует в AsyncStorage');
        return;
      }
  
  
      const attendancePromises = scheduleIds.map(async (id) => {
        console.log(`Загрузка данных для scheduleId: ${id}`);
        const response = await api.get<AttendanceDTO[]>(
          `/v1/schedules/user/attendances/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { id, attendance: response.data };
      });
  
      const results = await Promise.all(attendancePromises);
  
      setSchedule(prev =>
        prev.map(item => {
          const found = results.find(r => r.id === item.id);
          if (found) {
            console.log(`Обновление данных для scheduleId: ${item.id}`, found.attendance);
            return { ...item, attendance: found.attendance };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Ошибка загрузки посещаемости:', err);
    } finally {
      setLoadingAttendanceIds(prev => prev.filter(id => !scheduleIds.includes(id)));
    }
  }, [userId]);


  const getStudentsForInstructor = async (): Promise<UserDTO[]> => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token || !userId) {
        throw new Error('Authentication error');
      }
  
      const response = await api.get<UserDTO[]>(
        `/v1/users/students/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch students');
    }
  };


  const createSchedule = async (data: {
    dateTime: string;
    studentId: number[];
  }) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }
  
  
      const requestData = {
        ...data,
        instrucktorId:userId,
        type: 'PRACTICE',
      };
  
  
      const response = await api.post('/v1/schedules', requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
  
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create schedule');
    }
  };

  return {
    schedule,
    setSchedule,
    loading,
    error,
    loadingAttendanceIds,
    fetchScheduleAndAttendance,
    getStudentsForInstructor,
    fetchAttendanceForDay,
    updateAttendanceStatus,
    createSchedule,
  };
};