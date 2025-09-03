import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { dashboardAPI, DashboardData, DashboardStats, SystemStatus, RecentActivity } from '../services/dashboardAPI';

interface UseDashboardDataOptions {
  refreshInterval?: number;
  autoFetch?: boolean;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  stats: DashboardStats | null;
  systemStatus: SystemStatus | null;
  recentActivities: RecentActivity[];
}

// SWR fetcher function
const fetcher = async (url: string) => {
  const response = await dashboardAPI.getDashboardData();
  if (!response.success) {
    throw new Error(response.message || '获取数据失败');
  }
  return response.data;
};

/**
 * 仪表板数据Hook，使用SWR进行缓存和自动刷新
 */
export const useDashboardData = (options: UseDashboardDataOptions = {}): UseDashboardDataReturn => {
  const { refreshInterval = 30000, autoFetch = true } = options;

  const { data, error, isLoading, mutate } = useSWR<DashboardData | null>(
    autoFetch ? '/api/dashboard' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval,
      dedupingInterval: 10000, // 10秒去重
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (err) => {
        console.error('仪表板数据获取失败:', err);
      },
    }
  );

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    data: data || null,
    loading: isLoading,
    error: error || null,
    refetch,
    stats: data?.stats || null,
    systemStatus: data?.systemStatus || null,
    recentActivities: data?.recentActivities || [],
  };
};

/**
 * 独立的项目统计Hook
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getProjectStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.message || '获取统计失败');
      }
    } catch (err) {
      setError(err as Error);
      console.error('获取仪表板统计失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

/**
 * 独立的系统状态Hook
 */
export const useSystemStatus = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getSystemStatus();
      if (response.success && response.data) {
        setStatus(response.data);
      } else {
        throw new Error(response.message || '获取系统状态失败');
      }
    } catch (err) {
      setError(err as Error);
      console.error('获取系统状态失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};

/**
 * 独立的最近活动Hook
 */
export const useRecentActivities = (limit: number = 10) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getRecentActivities(limit);
      if (response.success && response.data) {
        setActivities(response.data);
      } else {
        throw new Error(response.message || '获取最近活动失败');
      }
    } catch (err) {
      setError(err as Error);
      console.error('获取最近活动失败:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
};