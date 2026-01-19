import { useState } from 'react';

const useDeleteProject = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const deleteProject = async (projectId: string) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const response = await fetch('/api/project/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      if (!response.ok) {
        throw new Error('프로젝트 삭제에 실패했습니다.');
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { deleteProject, isSubmitting, errorMessage };
};

export { useDeleteProject };
