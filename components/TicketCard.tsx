import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { useFocusEffect } from '@react-navigation/native';
import ProgressBar from './TicketProgressBar';

interface TicketCardProps {
  ticketNumber: number;
  questionNumbers: number;
  onPress: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticketNumber, questionNumbers, onPress }) => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const [viewedCount, setViewedCount] = useState<number>(0);
  const [progress, setProgress] = useState<{ questionStates: (boolean | null)[] }>({ questionStates: Array(20).fill(null) });
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const getViewedItems = async () => {
    try {
      const viewedItems = await AsyncStorage.getItem(`viewedItemsForTicket_${ticketNumber}`);
      const viewedItemsArray = viewedItems ? JSON.parse(viewedItems) : [];
      setViewedCount(viewedItemsArray.length);
    } catch (error) {
      console.error('Error loading viewed items:', error);
    }
  };

  const getProgress = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user_answers');
      const answers = storedData ? JSON.parse(storedData) : [];
      const filteredAnswers = answers.filter((a: any) => a.ticketNumber === ticketNumber);

      const questionStates = Array(20).fill(null);

      filteredAnswers.forEach((answer: any) => {
        const questionIndex = answer.questionNumber - 1;
        questionStates[questionIndex] = answer.isCorrect;
      });

      setProgress({ questionStates });
      setHasAnswered(filteredAnswers.length > 0);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  useEffect(() => {
    getViewedItems();
    getProgress();
  }, [ticketNumber]);

  useFocusEffect(
    React.useCallback(() => {
      getViewedItems();
      getProgress();
    }, [])
  );

  return (
    <TouchableOpacity style={[styles.card, { borderColor: colors.border }]} onPress={onPress}>
      <Text style={[styles.title, { color: colors.text }]}>Билет {ticketNumber}</Text>
      <Text style={[styles.text, { color: colors.text }]}>Вопросов: {questionNumbers}</Text>
      <Text style={[styles.progressText, { color: colors.text }]}>
        {viewedCount} / {questionNumbers}
      </Text>

      {hasAnswered ? (
        <ProgressBar questionStates={progress.questionStates} colors={colors} />
      ) : (
        <Text style={[styles.noProgressText, { color: colors.text }]}>Прогресс не завершен</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    marginTop: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  noProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    color: 'gray',
  },
});

export default TicketCard;