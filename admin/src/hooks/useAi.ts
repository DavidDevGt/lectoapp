import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../services/ai.service';
import { questionKeys } from './useQuestions';
import { readingKeys } from './useReadings';

export function useGenerateQuestions(readingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count?: number) => aiService.generateQuestions(readingId, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.byReading(readingId) });
      queryClient.invalidateQueries({ queryKey: readingKeys.all });
    },
  });
}
