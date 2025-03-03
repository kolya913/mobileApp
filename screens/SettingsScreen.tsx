import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Animated } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { useTickets } from '../hooks/useTickets';
import { useRuleDetails } from '../hooks/useRules';

const SettingsScreen = (): React.JSX.Element => {
  const {
    theme,
    setTheme,
    currentTheme,
    autoNavigateOnCorrect,
    setAutoNavigateOnCorrect,
    shuffleAnswers,
    setShuffleAnswers,
  } = useTheme();
  const colors = themes[currentTheme];
  const [openTheme, setOpenTheme] = useState(false);
  const [themesList] = useState([
    { label: 'По умолчанию (Система)', value: 'default' },
    { label: 'Светлая', value: 'light' },
    { label: 'Тёмная', value: 'dark' },
  ]);

  const { clearUserProgress, clearExamResults } = useTickets();
  const { clearAllSavedItems } = useRuleDetails(0);

  const handleClearProgress = async () => {
    try {
      await clearUserProgress();
      console.log('Статистика прохождения билетов очищена!');
    } catch (error) {
      console.error('Ошибка при очистке статистики:', error);
    }
  };

  const handleClearRules = async () => {
    try {
      await clearAllSavedItems();
      console.log('Данные правил очищены!');
    } catch (error) {
      console.error('Ошибка при очистке данных правил:', error);
    }
  };

  const handleClearExamResults = async () => {
    try {
      await clearExamResults();
      console.log('Статистика прохождения экзаменов очищена!');
    } catch (error) {
      console.error('Ошибка при очистке статистики экзаменов:', error);
    }
  };

  const animatedAutoNavigate = useState(new Animated.Value(autoNavigateOnCorrect ? 1 : 0))[0];
  const animatedShuffleAnswers = useState(new Animated.Value(shuffleAnswers ? 1 : 0))[0];

  useEffect(() => {
    Animated.timing(animatedAutoNavigate, {
      toValue: autoNavigateOnCorrect ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [autoNavigateOnCorrect]);

  useEffect(() => {
    Animated.timing(animatedShuffleAnswers, {
      toValue: shuffleAnswers ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [shuffleAnswers]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.groupTitle, { color: colors.text }]}>Оформление</Text>
      <View style={styles.optionGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Тема:</Text>
        <DropDownPicker
          open={openTheme}
          value={theme}
          items={themesList}
          setOpen={setOpenTheme}
          setValue={(callback) => {
            const newTheme = typeof callback === 'function' ? callback(theme) : callback;
            setTheme(newTheme);
          }}
          placeholder="Выберите тему"
          style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.background }]}
          textStyle={{ color: colors.text }}
          dropDownContainerStyle={{
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
          theme={currentTheme === 'dark' ? 'DARK' : 'LIGHT'}
        />
      </View>

      <Text style={[styles.groupTitle, { color: colors.text }]}>Правила</Text>
      <View style={styles.optionGroup}>
        <TouchableOpacity style={[styles.clearButton, { backgroundColor: 'red' }]} onPress={handleClearRules}>
          <Text style={styles.clearButtonText}>Очистить данные правил</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.groupTitle, { color: colors.text }]}>Билеты</Text>
      <View style={styles.optionGroup}>
        <View style={styles.switchContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Автопереход при правильном ответе</Text>
          <Animated.View
            style={[
              styles.animatedSwitchContainer,
              {
                backgroundColor: animatedAutoNavigate.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.border, colors.primary],
                }),
              },
            ]}
          >
            <Switch
              value={autoNavigateOnCorrect}
              onValueChange={setAutoNavigateOnCorrect}
              trackColor={{ false: 'transparent', true: 'transparent' }}
              thumbColor={colors.text}
            />
          </Animated.View>
        </View>
        <View style={styles.switchContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Перемешивать ответы</Text>
          <Animated.View
            style={[
              styles.animatedSwitchContainer,
              {
                backgroundColor: animatedShuffleAnswers.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.border, colors.primary],
                }),
              },
            ]}
          >
            <Switch
              value={shuffleAnswers}
              onValueChange={setShuffleAnswers}
              trackColor={{ false: 'transparent', true: 'transparent' }}
              thumbColor={colors.text}
            />
          </Animated.View>
        </View>
        <TouchableOpacity style={[styles.clearButton, { backgroundColor: 'red' }]} onPress={handleClearProgress}>
          <Text style={styles.clearButtonText}>Очистить статистику прохождения билетов</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.clearButton, { backgroundColor: 'red' }]} onPress={handleClearExamResults}>
          <Text style={styles.clearButtonText}>Очистить статистику прохождения экзаменов</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  dropdown: {
    width: '100%',
    height: 40,
    borderWidth: 1,
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  animatedSwitchContainer: {
    borderRadius: 16,
    padding: 2,
  },
});

export default SettingsScreen;
