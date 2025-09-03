import apiClient, { ApiResponse } from './api';

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  successRate: number;
  todayStats: {
    newProjects: number;
    completedProjects: number;
    aiCalls: number;
    documentExports: number;
  };
}

export interface SystemStatus {
  aiService: {
    status: 'normal' | 'degraded' | 'down';
    availability: number;
    message: string;
  };
  database: {
    status: 'normal' | 'degraded' | 'down';
    availability: number;
    message: string;
  };
  storage: {
    status: 'normal' | 'warning' | 'critical';
    used: number; // GB
    total: number; // GB
    percentage: number;
    message: string;
  };
}

export interface RecentActivity {
  id: string;
  type: 'project_created' | 'project_completed' | 'ai_analysis' | 'document_export';
  title: string;
  description: string;
  timestamp: string;
  projectId?: string;
  userId?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  systemStatus: SystemStatus;
  recentActivities: RecentActivity[];
  performanceData: {
    timestamp: string;
    responseTime: number;
    successRate: number;
  }[];
}

export const dashboardAPI = {
  // 获取仪表板数据
  getDashboardData: async (): Promise<ApiResponse<DashboardData>> => {
    try {
      const response = await apiClient.get<DashboardData>('/dashboard');
      return response;
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      throw error;
    }
  },

  // 获取项目统计
  getProjectStats: async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats/projects');
      return response;
    } catch (error) {
      console.error('获取项目统计失败:', error);
      throw error;
    }
  },

  // 获取系统状态
  getSystemStatus: async (): Promise<ApiResponse<SystemStatus>> => {
    try {
      const response = await apiClient.get<SystemStatus>('/dashboard/status/system');
      return response;
    } catch (error) {
      console.error('获取系统状态失败:', error);
      throw error;
    }
  },

  // 获取最近活动
  getRecentActivities: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    try {
      const response = await apiClient.get<RecentActivity[]>('/dashboard/activities/recent', {
        params: { limit }
      });
      return response;
    } catch (error) {
      console.error('获取最近活动失败:', error);
      throw error;
    }
  },

  // 获取性能数据
  getPerformanceData: async (hours: number = 24): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get<any[]>('/dashboard/performance', {
        params: { hours }
      });
      return response;
    } catch (error) {
      console.error('获取性能数据失败:', error);
      throw error;
    }
  }
};

export default dashboardAPI;