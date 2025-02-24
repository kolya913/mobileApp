export interface AnswerDTO {
    id: number;
    answerNumber: number;
    answerText: string;
    questionId: number;
  }
  
  export interface ImageDTO {
    id: number;
    imagePath: string;
    name: string;
  }
  
  export interface QuestionDTO {
    id: number;
    ticketNumber: number;
    questionNumber: number;
    questionText: string;
    correctAnswer: AnswerDTO;
    answers: AnswerDTO[];
    image: ImageDTO | null;
  }
  