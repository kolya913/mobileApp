import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
} from 'react-native';
import SidebarMenu from './components/app/SidebarMenu';
import LoginForm from './components/app/LoginForm';
import { useAuthInternetConnection } from './hooks/useAuthInternetConnection';
import { useTheme } from './hooks/ThemeContext';
import { themes } from './theme/Styles';
import 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTickets } from './hooks/useTickets';
import { useRules, useRuleDetails } from './hooks/useRules';

const SCREEN_WIDTH = Dimensions.get('window').width;

function App(): React.JSX.Element {
  const { isAuthenticated } = useAuthInternetConnection();
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [readRulesCount, setReadRulesCount] = useState<number | null>(null);
  const [solvedTicketsCount, setSolvedTicketsCount] = useState<number | null>(null);
  const [lastExamResult, setLastExamResult] = useState<string | null>(null);

  const navigation = useNavigation<any>();
  const menuAnimation = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  
  const { getAllTicketsProgress, getAllExamResults } = useTickets();
  const { rules } = useRules();
  const { getSavedItemIdsForChapter } = useRuleDetails(0);

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsMenuOpen(false));
  };

  const handleProfilePress = () => {
    if (isAuthenticated) {
      navigation.navigate("Profile");
    } else {
      setIsLoginModalVisible(true);
    }
  };

  const loadReadRulesCount = useCallback(async () => {
    let totalViewed = 0;
    for (const rule of rules) {
      const viewedItems = await getSavedItemIdsForChapter(rule.id);
      totalViewed += viewedItems.length;
    }
    setReadRulesCount(totalViewed);
  }, [rules]);

  const loadSolvedTicketsCount = useCallback(async () => {
    try {
      const allProgress = await getAllTicketsProgress();
      const solvedCount = Object.values(allProgress).reduce(
        (sum, data: any) => sum + (data.questionStates.length > 0 ? 1 : 0),
        0
      );
      setSolvedTicketsCount(solvedCount);
    } catch (err) {
      console.error('Ошибка загрузки статистики по билетам:', err);
    }
  }, [getAllTicketsProgress]);

  const loadLastExamResult = useCallback(async () => {
    try {
      const results = await getAllExamResults();
      if (results.length === 0) {
        setLastExamResult("Нет данных");
        return;
      }
      const lastExam = results.sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())[0];
      setLastExamResult(lastExam.passed ? "Сдан" : "Не сдан");
    } catch (err) {
      console.error('Ошибка загрузки статистики по экзаменам:', err);
    }
  }, [getAllExamResults]);

  useFocusEffect(
    useCallback(() => {
      loadReadRulesCount();
      loadSolvedTicketsCount();
      loadLastExamResult();
    }, [loadReadRulesCount, loadSolvedTicketsCount, loadLastExamResult])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <TouchableOpacity onPress={isMenuOpen ? closeMenu : openMenu}>
          <Text style={[styles.icon, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleProfilePress}>
          <Text style={[styles.icon, { color: colors.text }]}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <StatisticsCard title="Прочитано правил" value={readRulesCount} colors={colors} />
        <StatisticsCard title="Решено билетов" value={solvedTicketsCount} colors={colors} />
        <StatisticsCard title="Результат последнего экзамена" value={lastExamResult} colors={colors} />
      </View>

      {isMenuOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View
              style={[
                styles.overlay,
                {
                  backgroundColor: colors.overlay,
                  opacity: menuAnimation.interpolate({
                    inputRange: [-SCREEN_WIDTH, 0],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            />
          </TouchableWithoutFeedback>
          <SidebarMenu onClose={closeMenu} menuAnimation={menuAnimation} isAuthenticated={isAuthenticated} />
        </>
      )}

      <Modal animationType="fade" transparent visible={isLoginModalVisible && !isAuthenticated} onRequestClose={() => setIsLoginModalVisible(false)}>
        <LoginForm onSubmit={() => setIsLoginModalVisible(false)} onClose={() => setIsLoginModalVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const StatisticsCard = ({ title, value, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
    <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
    {value === null ? (
      <ActivityIndicator color={colors.text} />
    ) : (
      <Text style={[styles.cardValue, { color: colors.primary }]}>{value}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  icon: { fontSize: 32 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  card: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardValue: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
});

export default App;
