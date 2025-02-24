import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { useTickets } from '../hooks/useTickets';
import { useRules, useRuleDetails } from '../hooks/useRules';

const StatisticsScreen = () => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];

  const { getAllTicketsProgress, getAllExamResults } = useTickets();
  const { rules, loading: rulesLoading, error: rulesError } = useRules();
  const { getSavedItemIdsForChapter } = useRuleDetails();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [ticketsProgress, setTicketsProgress] = useState([]);
  const [rulesStatistics, setRulesStatistics] = useState([]);
  const [examResults, setExamResults] = useState([]);

  const ensureNonNegative = (value: number) => Math.max(value, 0);

  const loadTicketsProgress = useCallback(async () => {
    try {
      const allProgress = await getAllTicketsProgress();
      const ticketsStats = Object.entries(allProgress).map(([ticketNumber, data]) => ({
        ticketNumber: parseInt(ticketNumber, 10),
        correct: ensureNonNegative(data.questionStates.filter((state: boolean) => state === true).length),
        incorrect: ensureNonNegative(data.questionStates.filter((state: boolean) => state === false).length),
      }));
      setTicketsProgress(ticketsStats);
    } catch (err) {
      console.error('Ошибка загрузки статистики по билетам:', err);
    }
  }, [getAllTicketsProgress]);

  const loadRulesStatistics = useCallback(async () => {
    if (!rules) return;
    try {
      const stats = await Promise.all(
        rules.map(async (chapter) => {
          const savedItems = await getSavedItemIdsForChapter(chapter.id);
          return { ruleName: chapter.name, viewedCount: savedItems.length };
        })
      );
      setRulesStatistics(stats);
    } catch (err) {
      console.error('Ошибка загрузки статистики по правилам:', err);
    }
  }, [rules, getSavedItemIdsForChapter]);

  const loadExamResults = useCallback(async () => {
    try {
      const results = await getAllExamResults();
      const sanitizedResults = results
        .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())
        .map((item) => ({
          ticketNumber: item.ticketNumber,
          examDate: item.examDate,
          correctAnswers: ensureNonNegative(item.correctAnswers),
          incorrectAnswers: ensureNonNegative(item.incorrectAnswers),
          passed: item.passed,
        }));
      setExamResults(sanitizedResults);
    } catch (err) {
      console.error('Ошибка загрузки статистики по экзаменам:', err);
    }
  }, [getAllExamResults]);

  useEffect(() => {
    loadTicketsProgress();
    loadExamResults();
  }, [loadTicketsProgress, loadExamResults]);

  useEffect(() => {
    loadRulesStatistics();
  }, [rules]);

  const handleToggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatisticsGroup
        title="Экзамены"
        isExpanded={expandedSection === 'exams'}
        toggleExpanded={() => handleToggleSection('exams')}
        colors={colors}
      >
        {examResults.length > 0 ? (
          <FlatList
            data={examResults}
            keyExtractor={(item) => item.examDate}
            renderItem={({ item }) => (
              <StatisticsItem
                title={`Билет №${item.ticketNumber}`}
                details={[
                  { label: 'Дата', value: new Date(item.examDate).toLocaleDateString(), color: colors.secondaryText },
                  { label: 'Правильно', value: Math.max(item.correctAnswers - item.incorrectAnswers, 0), color: colors.success },
                  { label: 'Неправильно', value: item.incorrectAnswers, color: colors.error },
                  { label: item.passed ? 'Сдан' : 'Не сдан', value: '', color: item.passed ? colors.success : colors.error },
                ]}
                colors={colors}
              />
            )}
          />
        ) : (
          <Text style={{ color: colors.text }}>Нет данных о прошедших экзаменах</Text>
        )}
      </StatisticsGroup>

      <StatisticsGroup
        title="Правила"
        isExpanded={expandedSection === 'rules'}
        toggleExpanded={() => handleToggleSection('rules')}
        colors={colors}
      >
        {rulesLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : rulesError ? (
          <Text style={{ color: colors.error }}>Ошибка загрузки данных</Text>
        ) : (
          <FlatList
            data={rulesStatistics}
            keyExtractor={(item) => item.ruleName}
            renderItem={({ item }) => (
              <StatisticsItem
                title={item.ruleName}
                details={[{ label: 'Прочитано', value: item.viewedCount, color: colors.secondaryText }]}
                colors={colors}
              />
            )}
          />
        )}
      </StatisticsGroup>

      <StatisticsGroup
        title="Билеты"
        isExpanded={expandedSection === 'tickets'}
        toggleExpanded={() => handleToggleSection('tickets')}
        colors={colors}
      >
        <FlatList
          data={ticketsProgress}
          keyExtractor={(item) => item.ticketNumber.toString()}
          renderItem={({ item }) => (
            <StatisticsItem
              title={`Билет №${item.ticketNumber}`}
              details={[
                { label: 'Правильно', value: item.correct, color: colors.success },
                { label: 'Неправильно', value: item.incorrect, color: colors.error },
              ]}
              colors={colors}
            />
          )}
        />
      </StatisticsGroup>
    </View>
  );
};

const StatisticsGroup = ({ title, isExpanded, toggleExpanded, colors, children }) => {
  const animatedHeight = new Animated.Value(isExpanded ? 1 : 0);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  return (
    <>
      <TouchableOpacity onPress={toggleExpanded} style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.toggleIcon, { color: colors.text }]}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <Animated.View style={{ overflow: 'hidden', height: animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 250] }) }}>
        {isExpanded && children}
      </Animated.View>
    </>
  );
};

const StatisticsItem = ({ title, details, colors }) => (
  <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
    <Text style={[styles.chapterName, { color: colors.text }]} numberOfLines={1}>
      {title}
    </Text>
    {details.map(({ label, value, color }) => (
      <Text key={label} style={[styles.viewedCount, { color }]}>
        {label}: {value}
      </Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  groupTitle: { fontSize: 20, fontWeight: 'bold' },
  toggleIcon: { fontSize: 20 },
  statItem: { paddingVertical: 10, borderBottomWidth: 1 },
  chapterName: { fontSize: 16, fontWeight: 'bold' },
  viewedCount: { fontSize: 14 },
});

export default StatisticsScreen;
