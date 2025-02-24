import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/axios';
import { useTheme } from '../hooks/ThemeContext';

interface AnswerDTO {
  id: number;
  answerNumber: number;
  answerText: string;
  questionId: number;
}

interface ImageDTO {
  id: number;
  name: string;
  imagePath: string;
}

interface QuestionDTO {
  id: number;
  ticketNumber: number;
  questionNumber: number;
  questionText: string;
  correctAnswer: AnswerDTO;
  answers: AnswerDTO[];
  image: ImageDTO | null;
}

interface QuestionNumberDTO {
  ticketNumber: number;
  questionNumbers: number;
}

interface UserAnswerDTO {
  ticketNumber: number;
  questionNumber: number;
  selectedAnswerId: number;
  isCorrect: boolean;
}

interface ExamResultDTO {
  ticketNumber: number;
  examDate: string;
  correctAnswers: number;
  incorrectAnswers: number;
  passed: boolean;
}

export const useTickets = () => {
  const { shuffleAnswers } = useTheme();
  const [tickets, setTickets] = useState<QuestionNumberDTO[]>([]);
  const [ticketDetails, setTicketDetails] = useState<QuestionDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [randomQuestions, setRandomQuestions] = useState<QuestionDTO[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/v1/tickets');
        setTickets(response.data);
      } catch (err) {
        setError('Ошибка загрузки билетов: сервер не доступен');
        console.error('Ticket Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const fetchTicketDetails = useCallback(async (ticketNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/v1/tickets/${ticketNumber}`);
      const sortedQuestions = response.data.map((question: QuestionDTO) => ({
        ...question,
        answers: shuffleAnswers
          ? [...question.answers].sort(() => Math.random() - 0.5)
          : [...question.answers].sort((a, b) => a.answerNumber - b.answerNumber),
      }));
      setTicketDetails(sortedQuestions);
    } catch (err) {
      setError('Ошибка загрузки деталей билета: сервер не доступен');
    } finally {
      setLoading(false);
    }
  }, [shuffleAnswers]);

  const saveUserAnswer = async (
    ticketNumber: number,
    questionNumber: number,
    selectedAnswer: AnswerDTO,
    correctAnswer: AnswerDTO
  ) => {
    try {
      const userAnswer: UserAnswerDTO = {
        ticketNumber,
        questionNumber,
        selectedAnswerId: selectedAnswer.id,
        isCorrect: selectedAnswer.id === correctAnswer.id,
      };
      const storedData = await AsyncStorage.getItem('user_answers');
      const answers: UserAnswerDTO[] = storedData ? JSON.parse(storedData) : [];
      const updatedAnswers = answers.filter(
        (a) => !(a.ticketNumber === ticketNumber && a.questionNumber === questionNumber)
      );
      updatedAnswers.push(userAnswer);
      await AsyncStorage.setItem('user_answers', JSON.stringify(updatedAnswers));
    } catch (err) {
      console.error('Ошибка сохранения ответа:', err);
    }
  };

  const clearUserProgress = async () => {
    try {
      await AsyncStorage.removeItem('user_answers');
    } catch (err) {
      console.error('Ошибка очистки прогресса:', err);
    }
  };

  const getTicketProgress = async (ticketNumber: number): Promise<{ questionStates: (boolean | null)[] }> => {
    try {
      const storedData = await AsyncStorage.getItem('user_answers');
      const answers: UserAnswerDTO[] = storedData ? JSON.parse(storedData) : [];
      const filteredAnswers = answers.filter((a) => a.ticketNumber === ticketNumber);
      const questionStates = Array(20).fill(null);
      filteredAnswers.forEach((answer) => {
        const questionIndex = answer.questionNumber - 1;
        if (answer.isCorrect) {
          questionStates[questionIndex] = true;
        } else {
          questionStates[questionIndex] = false;
        }
      });
      return { questionStates };
    } catch (err) {
      console.error('Ошибка получения прогресса:', err);
      return { questionStates: Array(20).fill(null) };
    }
  };

  const getAllTicketsProgress = async (): Promise<{ [key: number]: { questionStates: (boolean | null)[] } }> => {
    try {
      const storedData = await AsyncStorage.getItem('user_answers');
      const answers: UserAnswerDTO[] = storedData ? JSON.parse(storedData) : [];
  
      const ticketsProgress: { [key: number]: { questionStates: (boolean | null)[] } } = {};
  
      answers.forEach((answer) => {
        const { ticketNumber, questionNumber, isCorrect } = answer;
  
        if (!ticketsProgress[ticketNumber]) {
          ticketsProgress[ticketNumber] = { questionStates: Array(20).fill(null) };
        }
  
        const questionIndex = questionNumber - 1;
        ticketsProgress[ticketNumber].questionStates[questionIndex] = isCorrect;
      });
  
      return ticketsProgress;
    } catch (err) {
      console.error('Ошибка получения прогресса всех билетов:', err);
      return {};
    }
  };

  const updateTicketDetails = (newTicketDetails: QuestionDTO[]) => {
    setTicketDetails(newTicketDetails);
  };
  

  const getRandomQuestions = async (count: number = 5, excludedTicketNumber: number, lastQuestionNumber: number): Promise<QuestionDTO[]> => {
    try {
        const response = await api.get(`/v1/tickets/random?count=${count}&exclude=${excludedTicketNumber}`);
        const fetchedQuestions = response.data;

        const cleanedQuestions = fetchedQuestions.map((question, index) => ({
            ...question,
            selectedAnswer: null,
            questionNumber: lastQuestionNumber + index + 1,
        }));

        updateTicketDetails((prevTicketDetails) => [...prevTicketDetails, ...cleanedQuestions]);

        return cleanedQuestions;
    } catch (err) {
        console.error('Ошибка загрузки случайных вопросов:', err);
        return [];
    }
};

  
  
  

  const saveExamResult = async (
    ticketNumber: number,
    correctAnswers: number,
    incorrectAnswers: number,
    passed: boolean
  ) => {
    try {
      const examResult: ExamResultDTO = {
        ticketNumber,
        examDate: new Date().toISOString(),
        correctAnswers,
        incorrectAnswers,
        passed,
      };

      const storedResults = await AsyncStorage.getItem('exam_results');
      const results: ExamResultDTO[] = storedResults ? JSON.parse(storedResults) : [];

      results.push(examResult);
      console.log('Сохранение');
      await AsyncStorage.setItem('exam_results', JSON.stringify(results));
    } catch (err) {
      console.error('Ошибка сохранения результата экзамена:', err);
    }
  };

  const getAllExamResults = async (): Promise<ExamResultDTO[]> => {
    try {
      const storedResults = await AsyncStorage.getItem('exam_results');
      const results: ExamResultDTO[] = storedResults ? JSON.parse(storedResults) : [];
      return results;
    } catch (err) {
      console.error('Ошибка получения всех результатов экзаменов:', err);
      return [];
    }
  };

  const clearExamResults = async () => {
    try {
      await AsyncStorage.removeItem('exam_results');
      console.log('Результаты экзаменов успешно очищены.');
    } catch (err) {
      console.error('Ошибка при очистке результатов экзаменов:', err);
    }
  };

  return {
    tickets,
    ticketDetails,
    fetchTicketDetails,
    saveUserAnswer,
    getTicketProgress,
    clearUserProgress,
    getRandomQuestions,
    updateTicketDetails,
    getAllTicketsProgress,
    getAllExamResults,
    clearExamResults,
    randomQuestions,
    loading,
    error,
    saveExamResult,
  };
};
