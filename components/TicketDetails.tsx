import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { IMAGE_BASE_URL } from '../config/axios';

interface AnswerDTO {
  id: number;
  answerNumber: number;
  answerText: string;
}

interface TicketDetailsProps {
  questionNumber: number;
  questionText: string;
  image: { imagePath: string } | null;
  answers: AnswerDTO[];
  correctAnswer: AnswerDTO;
  colors: any;
  isAnswered: boolean;
  selectedAnswer: AnswerDTO | null;
  onAnswerSelect: (answer: AnswerDTO) => void;
}

const TicketDetails = ({
  questionNumber,
  questionText,
  image,
  answers,
  correctAnswer,
  colors,
  isAnswered,
  selectedAnswer,
  onAnswerSelect,
}: TicketDetailsProps): React.JSX.Element => {


  
  const getAnswerStyle = (answer: AnswerDTO) => {
    if (!isAnswered) return {};
    if (answer.id === correctAnswer.id) return { backgroundColor: '#4CAF50', borderColor: '#388E3C', color: '#fff' };
    if (answer.id === selectedAnswer?.id) return { backgroundColor: '#F44336', borderColor: '#D32F2F', color: '#fff' };
    return {};
  };

  return (
    <View style={styles.questionContainer}>
      {image ? (
        <Image source={{ uri: `${IMAGE_BASE_URL}/${image.imagePath}` }} style={styles.questionImage} />
      ) : (
        <View style={[styles.imagePlaceholder, { borderColor: colors.text }]}>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            Вопрос без изображения
          </Text>
        </View>
      )}

      <Text style={[styles.questionText, { color: colors.text }]}>
        Вопрос {questionNumber}: {questionText}
      </Text>

      <View style={styles.answersContainer}>
        {answers.map((answer) => (
          <TouchableOpacity
            key={answer.id}
            style={[styles.answerContainer, getAnswerStyle(answer)]}
            onPress={() => onAnswerSelect(answer)}
            disabled={isAnswered}
          >
            <Text style={[styles.answerText, getAnswerStyle(answer)]}>{answer.answerText}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    marginTop: 10,
  },
  questionImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  answersContainer: {
    marginTop: 10,
  },
  answerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  answerText: {
    fontSize: 16,
  },
});

export default TicketDetails;
