import { useState } from 'react';

interface IntroducePayload {
  activityId: string;
  description: string;
  activityImage: string;
}

const useAddIntroduce = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const addIntroduce = async (payload: IntroducePayload) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const response = await fetch('/api/introduce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('활동 소개 저장에 실패했습니다.');
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '활동 소개 저장에 실패했습니다.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { addIntroduce, isSubmitting, errorMessage };
};

export { useAddIntroduce };
