import { PrismaClient, Question, QuestionType } from '../../generated/prisma';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { sanitizePlainText } from '../../shared/utils/sanitize-html';

export interface OllamaGeneratedQuestion {
  statement: string;
  type?: QuestionType;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

function formatOllamaUrl(rawHost: string): string {
  let host = (rawHost || '').trim();
  if (!host || host === '0.0.0.0' || host === 'http://0.0.0.0' || host === '0.0.0.0:11434') {
    host = env.OLLAMA_HOST || 'http://localhost:11434';
  }
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `http://${host}`;
  }
  host = host.replace(/\/+$/, '');
  try {
    const urlObj = new URL(host);
    if (!urlObj.port && !host.includes(':')) {
      urlObj.port = '11434';
    }
    return `${urlObj.origin}/api/generate`;
  } catch {
    return `${(env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/+$/, '')}/api/generate`;
  }
}

export class AiService {
  constructor(private readonly prisma: PrismaClient) {}

  async generateQuestionsForReading(readingId: string, count = 5): Promise<Question[]> {
    const reading = await this.prisma.reading.findFirst({
      where: { id: readingId, deletedAt: null },
    });

    if (!reading) {
      throw new NotFoundError('Lectura no encontrada');
    }

    // Obtener la cantidad máxima actual del campo order para esta lectura
    const lastQuestion = await this.prisma.question.findFirst({
      where: { readingId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let currentOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    // Normalizar la URL del servidor Ollama
    const ollamaUrl = formatOllamaUrl(env.OLLAMA_HOST);
    const model = env.OLLAMA_MODEL || 'qwen2.5-coder:14b';

    const prompt = `Eres un profesor experto en evaluación educativa y comprensión lectora en español.
Genera EXACTAMENTE ${count} preguntas distintas de evaluación sobre la siguiente lectura de nivel ${reading.comprehensionLevel}.

Título de la lectura: "${reading.title}"
Contenido de la lectura:
"${reading.content}"

REGLAS DE GENERACIÓN OBLIGATORIAS:
1. Genera EXACTAMENTE ${count} preguntas. Ni más ni menos.
2. Combina preguntas de opción múltiple (con 4 opciones a, b, c, d) y de verdadero/falso.
3. Las opciones deben ser plausibles y basadas directamente en la lectura.
4. Debes devolver ÚNICAMENTE un objeto JSON válido con la propiedad "questions" que contenga la lista de las ${count} preguntas.

Estructura JSON exacta requerida:
{
  "questions": [
    {
      "statement": "Pregunta 1 clara sobre el texto",
      "type": "MULTIPLE_CHOICE",
      "options": [
        { "id": "a", "text": "Texto opción A" },
        { "id": "b", "text": "Texto opción B" },
        { "id": "c", "text": "Texto opción C" },
        { "id": "d", "text": "Texto opción D" }
      ],
      "correctAnswer": "a",
      "explanation": "Explicación basada directamente en la lectura"
    }
  ]
}`;

    let generatedRawList: OllamaGeneratedQuestion[] = [];

    try {
      logger.debug('Conectando a Ollama para generar preguntas', { ollamaUrl, model, count });
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.7,
            num_predict: 3072,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText} (${response.status})`);
      }

      const data = (await response.json()) as { response: string };
      const cleanResponse = data.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      const parsedJSON = JSON.parse(cleanResponse);
      if (Array.isArray(parsedJSON)) {
        generatedRawList = parsedJSON;
      } else if (parsedJSON.questions && Array.isArray(parsedJSON.questions)) {
        generatedRawList = parsedJSON.questions;
      } else if (parsedJSON.preguntas && Array.isArray(parsedJSON.preguntas)) {
        generatedRawList = parsedJSON.preguntas;
      } else if (parsedJSON.data && Array.isArray(parsedJSON.data)) {
        generatedRawList = parsedJSON.data;
      } else if (parsedJSON.items && Array.isArray(parsedJSON.items)) {
        generatedRawList = parsedJSON.items;
      } else {
        const arrayProperty = Object.values(parsedJSON).find((val) => Array.isArray(val));
        if (arrayProperty && Array.isArray(arrayProperty)) {
          generatedRawList = arrayProperty as OllamaGeneratedQuestion[];
        } else {
          generatedRawList = [parsedJSON];
        }
      }
    } catch (err) {
      console.error('Error al generar preguntas con Ollama:', err);
      throw new ValidationError(
        `Error al comunicarse con la IA de Ollama (${model}): ${err instanceof Error ? err.message : 'Error desconocido'}`
      );
    }

    const createdQuestions: Question[] = [];

    for (const q of generatedRawList.slice(0, count)) {
      const questionType: QuestionType =
        q.type === 'TRUE_FALSE' || (Array.isArray(q.options) && q.options.length === 2)
          ? 'TRUE_FALSE'
          : 'MULTIPLE_CHOICE';

      const rawOptions = Array.isArray(q.options) ? q.options : [
        { id: 'a', text: 'Opción A' },
        { id: 'b', text: 'Opción B' },
      ];

      const options = rawOptions.map((opt) => ({
        id: sanitizePlainText(String(opt.id)),
        text: sanitizePlainText(String(opt.text)),
      }));

      const rawStatement = q.statement || 'Pregunta de comprensión lectora';
      const rawExplanation = q.explanation || 'Respuesta basada en la lectura';

      const question = await this.prisma.question.create({
        data: {
          readingId,
          statement: sanitizePlainText(rawStatement),
          type: questionType,
          options,
          correctAnswer: sanitizePlainText(String(q.correctAnswer || (options[0]?.id ?? 'a'))),
          explanation: sanitizePlainText(rawExplanation),
          order: currentOrder++,
          status: 'DRAFT',
          isAiGenerated: true,
        },
      });

      createdQuestions.push(question);
    }

    return createdQuestions;
  }
}
