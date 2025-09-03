import apiClient from './api';
import { Agent, AgentLog, AgentTask } from '../store/slices/agentSlice';

export interface AgentConfigUpdate {
  [key: string]: any;
}

export interface TaskExecutionRequest {
  type: string;
  input: any;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
}

export interface LogQueryParams {
  agentId?: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export const agentAPI = {
  // 获取所有Agent
  getAgents: (): Promise<Agent[]> => {
    return apiClient.get('/agents')
      .then(response => {
        // 后端返回的数据结构: { success: true, data: { agents: [...], statistics: {...}, performance: {...} } }
        if (response.data && response.data.data && response.data.data.agents) {
          return response.data.data.agents;
        }
        // 如果数据结构不符合预期，返回空数组
        return [];
      });
  },

  // 获取单个Agent
  getAgent: (id: string): Promise<Agent> => {
    return apiClient.get<Agent>(`/agents/${id}`)
      .then(response => response.data);
  },

  // 更新Agent配置
  updateAgentConfig: (id: string, config: AgentConfigUpdate): Promise<Agent> => {
    return apiClient.patch<Agent>(`/agents/${id}/config`, config)
      .then(response => response.data);
  },

  // 启动Agent
  startAgent: (id: string): Promise<Agent> => {
    return apiClient.post<Agent>(`/agents/${id}/start`)
      .then(response => response.data);
  },

  // 停止Agent
  stopAgent: (id: string): Promise<Agent> => {
    return apiClient.post<Agent>(`/agents/${id}/stop`)
      .then(response => response.data);
  },

  // 重启Agent
  restartAgent: (id: string): Promise<Agent> => {
    return apiClient.post<Agent>(`/agents/${id}/restart`)
      .then(response => response.data);
  },

  // 获取Agent状态
  getAgentStatus: (id: string): Promise<any> => {
    return apiClient.get(`/agents/${id}/status`)
      .then(response => response.data);
  },

  // 获取Agent性能指标
  getAgentPerformance: (id: string, timeRange?: string): Promise<any> => {
    const params = timeRange ? { timeRange } : {};
    return apiClient.get(`/agents/${id}/performance`, { params })
      .then(response => response.data);
  },

  // 执行Agent任务
  executeTask: (agentId: string, taskType: string, input: any): Promise<AgentTask> => {
    const data: TaskExecutionRequest = { type: taskType, input };
    return apiClient.post<AgentTask>(`/agents/${agentId}/tasks`, data)
      .then(response => response.data);
  },

  // 获取任务列表
  getTasks: (agentId?: string): Promise<AgentTask[]> => {
    const params = agentId ? { agentId } : {};
    return apiClient.get<AgentTask[]>('/agents/tasks', { params })
      .then(response => response.data);
  },

  // 获取单个任务
  getTask: (taskId: string): Promise<AgentTask> => {
    return apiClient.get<AgentTask>(`/agents/tasks/${taskId}`)
      .then(response => response.data);
  },

  // 取消任务
  cancelTask: (taskId: string): Promise<void> => {
    return apiClient.post(`/agents/tasks/${taskId}/cancel`).then(() => {});
  },

  // 重试任务
  retryTask: (taskId: string): Promise<AgentTask> => {
    return apiClient.post<AgentTask>(`/agents/tasks/${taskId}/retry`)
      .then(response => response.data);
  },

  // 获取日志
  getLogs: (params: LogQueryParams = {}): Promise<AgentLog[]> => {
    return apiClient.get<AgentLog[]>('/agents/logs', { params })
      .then(response => response.data);
  },

  // 清理日志
  clearLogs: (agentId?: string, beforeDate?: string): Promise<void> => {
    const data = { agentId, beforeDate };
    return apiClient.post('/agents/logs/clear', data).then(() => {});
  },

  // 获取系统状态
  getSystemStatus: (): Promise<any> => {
    return apiClient.get('/agents/system/status')
      .then(response => response.data);
  },

  // 获取系统指标
  getSystemMetrics: (timeRange?: string): Promise<any> => {
    const params = timeRange ? { timeRange } : {};
    return apiClient.get('/agents/system/metrics', { params })
      .then(response => response.data);
  },

  // 获取Agent类型定义
  getAgentTypes: (): Promise<any[]> => {
    return apiClient.get('/agents/types')
      .then(response => response.data);
  },

  // 获取任务类型定义
  getTaskTypes: (agentType?: string): Promise<any[]> => {
    const params = agentType ? { agentType } : {};
    return apiClient.get('/agents/task-types', { params })
      .then(response => response.data);
  },

  // 测试Agent连接
  testAgentConnection: (id: string): Promise<{ success: boolean; message: string; latency?: number }> => {
    return apiClient.post(`/agents/${id}/test`)
      .then(response => response.data);
  },

  // 获取Agent配置模板
  getAgentConfigTemplate: (agentType: string): Promise<any> => {
    return apiClient.get(`/agents/config-template/${agentType}`)
      .then(response => response.data);
  },

  // 验证Agent配置
  validateAgentConfig: (agentType: string, config: any): Promise<{ valid: boolean; errors?: string[] }> => {
    return apiClient.post(`/agents/validate-config/${agentType}`, config)
      .then(response => response.data);
  },

  // 导出Agent配置
  exportAgentConfig: (id: string): Promise<void> => {
    return apiClient.download(`/agents/${id}/export-config`, `agent_${id}_config.json`);
  },

  // 导入Agent配置
  importAgentConfig: (id: string, file: File): Promise<Agent> => {
    return apiClient.upload<Agent>(`/agents/${id}/import-config`, file)
      .then(response => response.data);
  },

  // 获取Agent使用统计
  getAgentUsageStats: (id: string, timeRange?: string): Promise<any> => {
    const params = timeRange ? { timeRange } : {};
    return apiClient.get(`/agents/${id}/usage-stats`, { params })
      .then(response => response.data);
  },
};
