import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchProjects, getProject } from '../store/slices/projectSlice';

interface UseProjectDataOptions {
  autoFetch?: boolean;
  pageSize?: number;
  refetchInterval?: number;
}

interface UseProjectDataReturn {
  projects: any[];
  currentProject: any;
  loading: boolean;
  error: string | null;
  fetchProjectsData: (params?: any) => void;
  fetchProjectData: (id: string) => void;
  refetch: () => void;
}

/**
 * 统一的项目数据管理Hook
 * 避免重复的API调用，提供缓存和智能刷新机制
 */
export const useProjectData = (options: UseProjectDataOptions = {}): UseProjectDataReturn => {
  const {
    autoFetch = true,
    pageSize = 50,
    refetchInterval = 0
  } = options;

  const dispatch = useAppDispatch();
  const { projects, currentProject, loading, error } = useAppSelector(state => state.project);
  
  // 使用ref来跟踪是否已经获取过数据，避免重复请求
  const hasFetchedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取项目列表
  const fetchProjectsData = useCallback((params: any = {}, force = false) => {
    // 如果正在加载中且不是强制刷新，跳过请求
    if (!force && loading) {
      return;
    }

    dispatch(fetchProjects({ pageSize, ...params }));
    hasFetchedRef.current = true;
    lastFetchTimeRef.current = Date.now();
  }, [dispatch, loading, pageSize]);

  // 获取单个项目
  const fetchProjectData = useCallback((id: string) => {
    dispatch(getProject(id));
  }, [dispatch]);

  // 手动刷新
  const refetch = useCallback(() => {
    hasFetchedRef.current = false;
    fetchProjectsData({}, true); // 强制刷新
  }, [fetchProjectsData]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchProjectsData({}, true); // 初始加载时强制获取
    }
  }, [autoFetch, fetchProjectsData]);

  // 定时刷新
  useEffect(() => {
    if (refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [useProjectData] Auto refetch triggered');
        }
        refetch();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, refetch]);

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    projects,
    currentProject,
    loading,
    error,
    fetchProjectsData,
    fetchProjectData,
    refetch
  };
};

/**
 * 简化版Hook，只获取项目列表
 */
export const useProjects = (options: UseProjectDataOptions = {}) => {
  const { projects, loading, error, fetchProjectsData, refetch } = useProjectData(options);
  
  return {
    projects,
    loading,
    error,
    fetchProjects: fetchProjectsData,
    refetch
  };
};

/**
 * 获取单个项目的Hook
 */
export const useProject = (projectId?: string) => {
  const { currentProject, loading, error, fetchProjectData } = useProjectData({ autoFetch: false });
  
  useEffect(() => {
    if (projectId && projectId !== currentProject?.id) {
      fetchProjectData(projectId);
    }
  }, [projectId, currentProject?.id, fetchProjectData]);

  return {
    project: currentProject,
    loading,
    error,
    refetch: () => projectId && fetchProjectData(projectId)
  };
};
