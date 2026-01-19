import { useState } from 'react';
import type { ProjectPayload } from '@/api/project/types';

const useEditProject = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const editProject = async (payload: ProjectPayload) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const response = await fetch('/api/project/edit', {
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

  return { editProject, isSubmitting, errorMessage };
};

export { useEditProject };
