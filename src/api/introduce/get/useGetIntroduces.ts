import { useCallback, useEffect, useState } from 'react';
import type { Introduce, IntroduceApiResponse } from '@/api/introduce/types';

const useGetIntroduces = () => {
  const [introduces, setIntroduces] = useState<Introduce[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchIntroduces = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await fetch('/api/introduce');
      if (!response.ok) {
        throw new Error('주요 활동 데이터를 불러오지 못했습니다.');
      }
      const payload = (await response.json()) as IntroduceApiResponse<Introduce[]>;
      if (!payload.success) {
        throw new Error(payload.error?.message ?? '주요 활동 데이터를 불러오지 못했습니다.');
      }
      setIntroduces(payload.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '주요 활동 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIntroduces();
  }, [fetchIntroduces]);

  return { introduces, isLoading, errorMessage, refetch: fetchIntroduces };
};

export { useGetIntroduces };
