import { MOCK_READINGS, MOCK_READING_DETAILS, MOCK_STUDENT } from './mockData';
import { QuizAttemptResult, ReadingDetail, ReadingListItem, User } from '../types/api';
import { API_BASE_URL } from '../config/env';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const apiClient = {
  setToken(token: string | null) {
    authToken = token;
  },

  async login(email: string, _pass: string): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _pass }),
      });
      if (response.ok) {
        const json = await response.json();
        const token = json.data.token || json.data.accessToken;
        setAuthToken(token);
        return { user: json.data.user, token };
      }
    } catch {
      // Fallback a modo demostración para prototipado rápido sin servidor activo
    }
    const mockToken = 'mock-jwt-token-12345';
    setAuthToken(mockToken);
    return {
      user: { ...MOCK_STUDENT, email: email || MOCK_STUDENT.email },
      token: mockToken,
    };
  },

  async getReadings(comprehensionLevel?: string, progressionLevel?: string): Promise<ReadingListItem[]> {
    try {
      let url = `${API_BASE_URL}/readings`;
      const params: string[] = [];
      if (comprehensionLevel && comprehensionLevel !== 'ALL') {
        params.push(`comprehensionLevel=${comprehensionLevel}`);
      }
      if (progressionLevel && progressionLevel !== 'ALL') {
        params.push(`progressionLevel=${progressionLevel}`);
      }
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data.items || json.data;
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
      const res = await fetch(`${API_BASE_URL}/readings/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
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
      const formattedAnswers = Object.entries(userAnswers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await fetch(`${API_BASE_URL}/progress/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          readingId,
          answers: formattedAnswers,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        return {
          score: Math.round(data.percentage ?? data.score ?? 100),
          passed: data.passed,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers ?? Math.round(((data.percentage || 100) / 100) * data.totalQuestions),
          pointsEarned: data.pointsEarned ?? (data.passed ? 100 : 20),
          newTotalPoints: data.newTotalPoints ?? (MOCK_STUDENT.totalPoints + 100),
          streak: data.streak ?? (MOCK_STUDENT.streak + 1),
        };
      }
    } catch {
      // Fallback a evaluación local offline
    }

    const reading = MOCK_READING_DETAILS[readingId] || MOCK_READING_DETAILS['r1-popol-vuh'];
    const questions = reading.questions || [];
    let correctCount = 0;

    questions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      if (userAnswer) {
        // En mock, considerar respuestas coherentes como correctas
        const firstOpt = typeof q.options[0] === 'string' ? q.options[0] : q.options[0]?.text;
        const thirdOpt = typeof q.options[2] === 'string' ? q.options[2] : q.options[2]?.text;
        if (
          userAnswer === firstOpt ||
          userAnswer === thirdOpt ||
          userAnswer === 'Falso' ||
          userAnswer.includes('maíz') ||
          userAnswer.includes('deshacía') ||
          userAnswer.includes('Tepeu') ||
          userAnswer.includes('sangre')
        ) {
          correctCount++;
        }
      }
    });

    const totalQuestions = questions.length || 1;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;
    const pointsEarned = passed ? 100 : 20;

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
