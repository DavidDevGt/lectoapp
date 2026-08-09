import { MOCK_READINGS, MOCK_READING_DETAILS, MOCK_STUDENT } from './mockData';
import { QuizAttemptResult, ReadingDetail, ReadingListItem, User } from '../types/api';

// IP o URL de la API del backend
const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android Emulator default (o cambiar según IP local)

export const apiClient = {
  async login(email: string, _pass: string): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _pass }),
      });
      if (response.ok) {
        const json = await response.json();
        return { user: json.data.user, token: json.data.token };
      }
    } catch {
      // Fallback a modo demostración para prototipado rápido sin servidor activo
    }
    return {
      user: { ...MOCK_STUDENT, email: email || MOCK_STUDENT.email },
      token: 'mock-jwt-token-12345',
    };
  },

  async getReadings(comprehensionLevel?: string, progressionLevel?: string): Promise<ReadingListItem[]> {
    try {
      let url = `${API_BASE_URL}/readings`;
      const params: string[] = [];
      if (comprehensionLevel) params.push(`comprehensionLevel=${comprehensionLevel}`);
      if (progressionLevel) params.push(`progressionLevel=${progressionLevel}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback a mock data
    }

    let filtered = [...MOCK_READINGS];
    if (comprehensionLevel && comprehensionLevel !== 'ALL') {
      filtered = filtered.filter((r) => r.comprehensionLevel === comprehensionLevel);
    }
    if (progressionLevel && progressionLevel !== 'ALL') {
      filtered = filtered.filter((r) => r.progressionLevel === progressionLevel);
    }
    return filtered;
  },

  async getReadingById(id: string): Promise<ReadingDetail> {
    try {
      const res = await fetch(`${API_BASE_URL}/readings/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback a mock data
    }
    return MOCK_READING_DETAILS[id] || MOCK_READING_DETAILS['r1-popol-vuh'];
  },

  async submitQuiz(readingId: string, userAnswers: Record<string, string>): Promise<QuizAttemptResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes/${readingId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback a cálculo de puntaje local
    }

    const reading = MOCK_READING_DETAILS[readingId] || MOCK_READING_DETAILS['r1-popol-vuh'];
    const questions = reading.questions || [];
    let correctCount = 0;

    questions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      // Si la respuesta seleccionada coincide con la primera opción o la respuesta esperada
      if (userAnswer === q.options[0] || userAnswer === 'Verdadero' || userAnswer === q.options[2]) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length || 1;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;
    const pointsEarned = passed ? 100 + score : 20;

    return {
      score,
      passed,
      totalQuestions,
      correctAnswers: correctCount,
      pointsEarned,
      newTotalPoints: MOCK_STUDENT.totalPoints + pointsEarned,
      streak: passed ? MOCK_STUDENT.streak + 1 : MOCK_STUDENT.streak,
    };
  },
};
