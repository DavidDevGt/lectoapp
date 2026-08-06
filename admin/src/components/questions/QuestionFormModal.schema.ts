import { z } from 'zod';
import { QuestionOption } from '../../types/api';

export const MULTIPLE_CHOICE_OPTIONS = [
  { id: 'a', field: 'optionA' },
  { id: 'b', field: 'optionB' },
  { id: 'c', field: 'optionC' },
  { id: 'd', field: 'optionD' },
] as const;

export const TRUE_FALSE_OPTIONS: QuestionOption[] = [
  { id: 'true', text: 'Verdadero' },
  { id: 'false', text: 'Falso' },
];

export const questionFormSchema = z
  .object({
    statement: z.string().min(5, 'El enunciado debe tener al menos 5 caracteres'),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
    optionA: z.string().optional(),
    optionB: z.string().optional(),
    optionC: z.string().optional(),
    optionD: z.string().optional(),
    correctAnswer: z.string().min(1, 'Selecciona la respuesta correcta'),
    explanation: z.string().optional(),
    order: z.coerce.number().int().min(0),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'MULTIPLE_CHOICE') {
      (['optionA', 'optionB', 'optionC', 'optionD'] as const).forEach((key) => {
        if (!data[key] || data[key]!.trim().length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'La opción no puede estar vacía' });
        }
      });
    }
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

export function optionText(options: QuestionOption[], id: string): string {
  return options.find((option) => option.id === id)?.text ?? '';
}

export function buildOptions(values: QuestionFormValues): QuestionOption[] {
  if (values.type === 'TRUE_FALSE') {
    return TRUE_FALSE_OPTIONS;
  }
  return [
    { id: 'a', text: values.optionA ?? '' },
    { id: 'b', text: values.optionB ?? '' },
    { id: 'c', text: values.optionC ?? '' },
    { id: 'd', text: values.optionD ?? '' },
  ];
}
