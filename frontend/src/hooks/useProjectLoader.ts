import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { getProject, setCurrentProject } from '../store/slices/projectSlice';

export const useProjectLoader = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const { currentProject, loading, error } = useAppSelector(state => state.project);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (projectId) {
      if (currentProject?.id !== projectId) {
        setIsInitializing(true);
        dispatch(getProject(projectId)).finally(() => {
          setIsInitializing(false);
        });
      } else {
        setIsInitializing(false);
      }
    } else {
      setIsInitializing(false);
      if (currentProject) {
        const NON_PROJECT_PAGES = ['/projects', '/dashboard', '/'];
        if (NON_PROJECT_PAGES.includes(window.location.pathname)) {
          dispatch(setCurrentProject(null));
        }
      }
    }
  }, [projectId, currentProject, dispatch]);

  return {
    projectId,
    project: currentProject,
    isLoading: loading || isInitializing,
    error,
  };
};
