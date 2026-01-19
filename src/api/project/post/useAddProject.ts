import { useState } from 'react';
import type { ProjectPayload } from '@/api/project/types';

const useAddProject = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const addProject = async (payload: ProjectPayload) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const response = await fetch('/api/project/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('프로젝트 저장에 실패했습니다.');
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로젝트 저장에 실패했습니다.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { addProject, isSubmitting, errorMessage };
};

export { useAddProject };
