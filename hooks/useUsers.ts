import { useState, useEffect } from 'react';
import api from '../config/axios';
import { useAuthInternetConnection } from './useAuthInternetConnection';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserLicenseCategoryDTO {
  code: string;
  licenseCategoryName: string;
  status: 'TEACHING' | 'TRAINING' | 'PAUSED' | 'GRADUATED';
}

interface UserDTO {
  id: number;
  firstName: string;
  lastName: string;
}

interface GroupDTO {
  id: number;
  name: string;
  instructor: UserDTO;
}

interface UserDetailsDTO {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phoneNumber: string;
  payForStudying: number;
  licenseCategories: UserLicenseCategoryDTO[];
  groups?: GroupDTO[] | null;
  practicalInstructor: UserDTO | null;
  students?: UserDTO[] | null;
}

interface PaymentDTO {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  paymentDate: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH';
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

export const useUsers = () => {
  const [userDetails, setUserDetails] = useState<UserDetailsDTO | null>(null);
  const [userPayments, setUserPayments] = useState<PaymentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, userId } = useAuthInternetConnection();

  const getUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await api.get(`/v1/users/${userId}/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData: UserDetailsDTO = response.data;
      setUserDetails(userData);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching user details');
    } finally {
      setLoading(false);
    }
  };

  const getUserPayments = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await api.get(`/v1/users/${userId}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payments: PaymentDTO[] = response.data;
      setUserPayments(payments);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (paymentData: {
    amount: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
  }) => {
    try {
      console.log('[makePayment] Начало выполнения функции');
      setLoading(true);
      setError(null);
  
      console.log('[makePayment] Получение токена из AsyncStorage');
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error('[makePayment] Токен не найден');
        throw new Error('Token not found');
      }
  
      if (!userId) {
        console.error('[makePayment] User ID не доступен');
        throw new Error('User ID is not available');
      }
  
      const paymentRequest = {
        amount: paymentData.amount,
        paymentMethod: 'CARD',
        cardNumber: paymentData.cardNumber,
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv,
      };
  
      console.log('[makePayment] Тело запроса:', paymentRequest);
  
      console.log('[makePayment] Отправка запроса на сервер');
      const response = await api.post(
        `/v1/users/pay/${userId}`,
        paymentRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      console.log('[makePayment] Ответ от сервера:', response.data);
  
      console.log('[makePayment] Обновление данных пользователя');
      await getUserDetails(userId);
      await getUserPayments(userId);
  
      console.log('[makePayment] Оплата успешно завершена');
      return response.data;
    } catch (err) {
      console.error('[makePayment] Ошибка:', err.message || err);
      setError(err.message || 'An error occurred while making payment');
      throw err;
    } finally {
      console.log('[makePayment] Завершение функции');
      setLoading(false);
    }
  };

  const resetUserDetails = () => {
    setUserDetails(null);
    setUserPayments([]);
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      getUserDetails(userId);
      getUserPayments(userId);
    }
  }, [isAuthenticated, userId]);

  return {
    userDetails,
    userPayments,
    loading,
    error,
    getUserDetails,
    resetUserDetails,
    getUserPayments,
    makePayment,
  };
};