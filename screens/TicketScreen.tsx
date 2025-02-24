import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useTickets } from '../hooks/useTickets';
import TicketDetails from '../components/TicketDetails';

type TicketScreenRouteProp = RouteProp<{ Ticket: { ticketNumber: number; exam?: boolean } }, 'Ticket'>;

const TicketScreen = (): React.JSX.Element => {
  const { currentTheme, autoNavigateOnCorrect } = useTheme();
  const colors = themes[currentTheme];
  const route = useRoute<TicketScreenRouteProp>();
  const navigation = useNavigation();
  const { ticketNumber, exam = false } = route.params;
  const { ticketDetails, fetchTicketDetails, saveUserAnswer, loading, error, saveExamResult, getRandomQuestions, updateTicketDetails } = useTickets();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, AnswerDTO>>(new Map());
  const [errorCount, setErrorCount] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<boolean>(false);
  const [answerCount, setAnswerCount] = useState<number>(0);
  const [isAddingQuestions, setIsAddingQuestions] = useState<boolean>(false);

  useEffect(() => {
    fetchTicketDetails(ticketNumber);
  }, [ticketNumber, fetchTicketDetails]);

  useEffect(() => {
    if (exam) {
      if (errorCount >= 3) {
        const passed = false;
        setExamResult(passed);
        setShowResultModal(true);
        saveExamResult(ticketNumber, answerCount, errorCount, passed);
      }
      else if (!isAddingQuestions && answeredQuestions.size === ticketDetails?.length && ticketDetails?.length > 0) {
        const passed = errorCount < 3;
        setExamResult(passed);
        setShowResultModal(true);
        saveExamResult(ticketNumber, answerCount, errorCount, passed);
      }
    } else {
      if (answeredQuestions.size === ticketDetails?.length) {
        setShowResultModal(true);
      }
    }
  }, [exam, errorCount, answeredQuestions, ticketDetails, answerCount, isAddingQuestions]);

  const handleAnswerSelect = async (answer: AnswerDTO) => {
    const currentQuestion = ticketDetails[currentQuestionIndex];
    const isCorrect = answer.id === currentQuestion.correctAnswer.id;

    setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion.id)));
    setSelectedAnswers((prev) => new Map(prev.set(currentQuestion.questionNumber, answer)));
    setAnswerCount((prev) => prev + 1);

    if (!isCorrect) {
      setErrorCount((prev) => prev + 1);

      if (exam) {
        try {
          setIsAddingQuestions(true);
          updateTicketDetails([...ticketDetails, ...await getRandomQuestions(5, ticketNumber, ticketDetails.length)]);
        } catch (err) {
          console.error('Ошибка при добавлении дополнительных вопросов:', err);
        } finally {
          setIsAddingQuestions(false);
        }
      }
    }

    if (!exam) {
      try {
        await saveUserAnswer(ticketNumber, currentQuestion.questionNumber, answer, currentQuestion.correctAnswer);
      } catch (err) {
        console.error('Ошибка при сохранении ответа:', err);
      }

      if (answeredQuestions.size === ticketDetails.length) {
        setShowResultModal(true);
      }
    }

    if (autoNavigateOnCorrect && isCorrect && currentQuestionIndex < ticketDetails.length - 1) {
      setTimeout(() => handleNextQuestion(), 1000);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < ticketDetails.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (isAddingQuestions) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    navigation.goBack();
  };

  if (!ticketDetails || ticketDetails?.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Нет данных о билете</Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  const currentQuestion = ticketDetails[currentQuestionIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TicketDetails
          questionNumber={currentQuestion.questionNumber}
          questionText={currentQuestion.questionText}
          image={currentQuestion.image}
          answers={currentQuestion.answers}
          correctAnswer={currentQuestion.correctAnswer}
          ticketNumber={ticketNumber}
          colors={colors}
          isAnswered={answeredQuestions.has(currentQuestion.id)}
          selectedAnswer={selectedAnswers.get(currentQuestion.questionNumber) || null}
          onAnswerSelect={handleAnswerSelect}
        />
      </ScrollView>
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          onPress={handlePreviousQuestion}
          style={[styles.arrowButton, currentQuestionIndex === 0 && styles.invisibleButton]}
          disabled={currentQuestionIndex === 0}
        >
          <Text
            style={[styles.arrowText, { color: colors.text }, currentQuestionIndex === 0 && styles.invisibleText]}
          >
            ←
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextQuestion}
          style={[styles.arrowButton, currentQuestionIndex === ticketDetails.length - 1 && styles.invisibleButton]}
          disabled={currentQuestionIndex === ticketDetails.length - 1}
        >
          <Text
            style={[styles.arrowText, { color: colors.text }, currentQuestionIndex === ticketDetails.length - 1 && styles.invisibleText]}
          >
            →
          </Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showResultModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalText, { color: colors.text }]}>
              {exam ? (examResult ? 'Экзамен сдан!' : 'Экзамен не сдан.') : 'Билет пройден!'}
            </Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.modalButton}>
              <Text style={[styles.modalButtonText, { color: colors.text }]}>ОК</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  scrollContent: { paddingBottom: 80 },
  errorText: { fontSize: 18, textAlign: 'center' },
  navigationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  arrowButton: { padding: 10 },
  arrowText: { fontSize: 24 },
  invisibleButton: { opacity: 0 },
  invisibleText: { opacity: 0 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
  },
});

export default TicketScreen;