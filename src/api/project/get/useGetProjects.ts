import { useCallback, useEffect, useState } from 'react';
import type { Project } from '@/api/project/types';

const useGetProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await fetch('/api/project');
      if (!response.ok) {
        throw new Error('프로젝트 데이터를 불러오지 못했습니다.');
      }
      const data = (await response.json()) as Project[];
      setProjects(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로젝트 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, errorMessage, refetch: fetchProjects };
};

export { useGetProjects };
