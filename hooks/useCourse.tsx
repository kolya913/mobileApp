import { useState, useEffect } from 'react';
import api from '../config/axios';
import { useAuthInternetConnection } from '../hooks/useAuthInternetConnection';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface GroupDTO {
  id: number;
  groupName: string;
}



const useCourse = (userId) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userId: authUserId, isAuthenticated } = useAuthInternetConnection();

  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    const fetchCourse = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');

        const response = await api.get(`/v1/courses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCourse(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        console.log(`err ${err}`);
        setLoading(false);
      }
    };

    fetchCourse();
  }, [userId, isAuthenticated]);

  const toggleElementVisibility = async (elementId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await api.post(
        `/v1/courses/element/visible/${elementId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setCourse(prev => {
        if (!prev) return prev;
        
        const updatedElements = prev.elements.map(element => 
          element.id === elementId 
            ? { ...element, visible: response.data } 
            : element
        );
        
        return { ...prev, elements: updatedElements };
      });
  
    } catch (err) {
      console.log(err);
    }
  };

  const getGroupsByCourseId = async (courseId: number): Promise<GroupDTO[]> => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Токен отсутствует');
      }
  
      const response = await api.get(`/v1/courses/groups/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении групп:', error);
      throw error;
    }
  };

  return { course, loading, error, toggleElementVisibility,getGroupsByCourseId };
};

export default useCourse;
