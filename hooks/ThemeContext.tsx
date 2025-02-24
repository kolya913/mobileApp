import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'default' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: 'light' | 'dark';
  autoNavigateOnCorrect: boolean;
  setAutoNavigateOnCorrect: (value: boolean) => void;
  shuffleAnswers: boolean;
  setShuffleAnswers: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('default');
  const [autoNavigateOnCorrect, setAutoNavigateOnCorrectState] = useState<boolean>(false);
  const [shuffleAnswers, setShuffleAnswersState] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        const savedAutoNavigate = await AsyncStorage.getItem('autoNavigateOnCorrect');
        const savedShuffleAnswers = await AsyncStorage.getItem('shuffleAnswers');

        if (savedTheme && ['default', 'light', 'dark'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        }
        setAutoNavigateOnCorrectState(savedAutoNavigate === 'true' ? true : false);
        setShuffleAnswersState(savedShuffleAnswers === 'true' ? true : false);
      } catch (error) {
        console.error('Ошибка при загрузке настроек:', error);
      }
    };
    loadSettings();
  }, []);

  const setTheme = async (selectedTheme: Theme) => {
    setThemeState(selectedTheme);
    try {
      await AsyncStorage.setItem('userTheme', selectedTheme);
    } catch (error) {
      console.error('Ошибка при сохранении темы:', error);
    }
  };

  const setAutoNavigateOnCorrect = async (value: boolean) => {
    setAutoNavigateOnCorrectState(value);
    try {
      await AsyncStorage.setItem('autoNavigateOnCorrect', value.toString());
    } catch (error) {
      console.error('Ошибка при сохранении автоперехода:', error);
    }
  };

  const setShuffleAnswers = async (value: boolean) => {
    setShuffleAnswersState(value);
    try {
      await AsyncStorage.setItem('shuffleAnswers', value.toString());
    } catch (error) {
      console.error('Ошибка при сохранении перемешивания ответов:', error);
    }
  };

  const currentTheme: 'light' | 'dark' = theme === 'default' ? systemTheme || 'light' : theme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentTheme,
        autoNavigateOnCorrect,
        setAutoNavigateOnCorrect,
        shuffleAnswers,
        setShuffleAnswers
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
