import type {
  EnumerationQuestion,
  IdentificationQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
} from "@/features/questions/schemas/question.schema";

const base = {
  id: "q1",
  quizId: "quiz1",
  position: 0,
  points: 1,
  sourceExcerpt: null,
} as const;

export const multipleChoiceQuestion: MultipleChoiceQuestion = {
  ...base,
  type: "MULTIPLE_CHOICE",
  payload: {
    prompt: "Which organelle produces ATP?",
    options: ["Nucleus", "Mitochondrion", "Ribosome"],
    correctOptionIndex: 1,
    explanation: "Mitochondria carry out aerobic respiration.",
  },
};

export const trueFalseQuestion: TrueFalseQuestion = {
  ...base,
  id: "q2",
  position: 1,
  type: "TRUE_FALSE",
  payload: {
    statement: "Mitochondria are found in eukaryotic cells.",
    answer: true,
    explanation: "They are membrane-bound organelles.",
  },
};

export const identificationQuestion: IdentificationQuestion = {
  ...base,
  id: "q3",
  position: 2,
  type: "IDENTIFICATION",
  payload: {
    prompt: "Name the organelle responsible for aerobic respiration.",
    acceptedAnswers: ["mitochondrion", "mitochondria"],
    caseSensitive: false,
    explanation: "Singular and plural forms are accepted.",
  },
};

export const enumerationQuestion: EnumerationQuestion = {
  ...base,
  id: "q4",
  position: 3,
  type: "ENUMERATION",
  payload: {
    prompt: "Name three organelles found in a eukaryotic cell.",
    expectedItems: ["mitochondrion", "ribosome", "nucleus"],
    requiredCount: 3,
    orderMatters: false,
    explanation: "Any three of the listed organelles.",
  },
};
