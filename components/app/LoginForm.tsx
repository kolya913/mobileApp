import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useAuthInternetConnection } from '../../hooks/useAuthInternetConnection';
import { useTheme } from '../../hooks/ThemeContext';
import { themes } from '../../theme/Styles';
import styles from '../../theme/LoginForm.styles';

interface LoginFormProps {
  onClose: () => void;
}

const LoginForm = ({ onClose }: LoginFormProps): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scale] = useState(new Animated.Value(1));

  const { login, isServerHealthy } = useAuthInternetConnection();
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) {
      setError('Неверный формат email');
      return;
    }

    if (!password) {
      setError('Введите пароль');
      return;
    }

    if (isServerHealthy === false) {
      setError('Сервер недоступен, попробуйте позже');
      return;
    }

    setError(null);
    const success = await login(email, password);
    if (success) {
      onClose();
    } else {
      setError('Неправильный email или пароль');
    }
  };

  const animatePress = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.modalBackground}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Вход</Text>

        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: currentTheme === 'dark' ? '#333' : '#fff',
            },
          ]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: currentTheme === 'dark' ? '#333' : '#fff',
            },
          ]}
          placeholder="Пароль"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPressIn={() => animatePress(0.95)}
              onPressOut={() => animatePress(1)}
              onPress={handleSubmit}
              style={[styles.button, styles.loginButton]}
            >
              <Text style={styles.buttonText}>Войти</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPressIn={() => animatePress(0.95)}
              onPressOut={() => animatePress(1)}
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.buttonText}>Отмена</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default LoginForm;
