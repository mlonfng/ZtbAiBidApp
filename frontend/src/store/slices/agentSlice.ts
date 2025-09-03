import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { agentAPI } from '../../services/agentAPI';

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'busy';
  config: any;
  performance: {
    tasksCompleted: number;
    averageTime: number;
    successRate: number;
    lastActive: string;
  };
  logs: AgentLog[];
}

export interface AgentLog {
  id: string;
  agentId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: any;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  tasks: AgentTask[];
  logs: AgentLog[];
  loading: boolean;
  error: string | null;
  realTimeData: {
    systemStatus: any;
    performance: any;
  };
}

const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  tasks: [],
  logs: [],
  loading: false,
  error: null,
  realTimeData: {
    systemStatus: null,
    performance: null,
  },
};

export const fetchAgents = createAsyncThunk(
  'agent/fetchAgents',
  async () => {
    const response = await agentAPI.getAgents();
    return response;
  }
);

export const getAgent = createAsyncThunk(
  'agent/getAgent',
  async (id: string) => {
    const response = await agentAPI.getAgent(id);
    return response;
  }
);

export const updateAgentConfig = createAsyncThunk(
  'agent/updateAgentConfig',
  async ({ id, config }: { id: string; config: any }) => {
    const response = await agentAPI.updateAgentConfig(id, config);
    return response;
  }
);

export const startAgent = createAsyncThunk(
  'agent/startAgent',
  async (id: string) => {
    const response = await agentAPI.startAgent(id);
    return response;
  }
);

export const stopAgent = createAsyncThunk(
  'agent/stopAgent',
  async (id: string) => {
    const response = await agentAPI.stopAgent(id);
    return response;
  }
);

export const restartAgent = createAsyncThunk(
  'agent/restartAgent',
  async (id: string) => {
    const response = await agentAPI.restartAgent(id);
    return response;
  }
);

export const fetchAgentTasks = createAsyncThunk(
  'agent/fetchAgentTasks',
  async (agentId?: string) => {
    const response = await agentAPI.getTasks(agentId);
    return response;
  }
);

export const fetchAgentLogs = createAsyncThunk(
  'agent/fetchAgentLogs',
  async (params: { agentId?: string; level?: string; limit?: number }) => {
    const response = await agentAPI.getLogs({
      ...params,
      level: params.level as "error" | "info" | "warn" | "debug" | undefined
    });
    return response;
  }
);

export const executeAgentTask = createAsyncThunk(
  'agent/executeAgentTask',
  async ({ agentId, taskType, input }: { agentId: string; taskType: string; input: any }) => {
    const response = await agentAPI.executeTask(agentId, taskType, input);
    return response;
  }
);

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateRealTimeData: (state, action) => {
      state.realTimeData = { ...state.realTimeData, ...action.payload };
    },
    addLog: (state, action) => {
      state.logs.unshift(action.payload);
      // 限制日志数量
      if (state.logs.length > 1000) {
        state.logs = state.logs.slice(0, 1000);
      }
    },
    updateAgentStatus: (state, action) => {
      const { agentId, status } = action.payload;
      const agent = state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取Agent列表失败';
      })
      .addCase(getAgent.fulfilled, (state, action) => {
        state.currentAgent = action.payload;
      })
      .addCase(updateAgentConfig.fulfilled, (state, action) => {
        const index = state.agents.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
        if (state.currentAgent?.id === action.payload.id) {
          state.currentAgent = action.payload;
        }
      })
      .addCase(fetchAgentTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
      })
      .addCase(fetchAgentLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      .addCase(executeAgentTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      });
  },
});

export const { clearError, updateRealTimeData, addLog, updateAgentStatus } = agentSlice.actions;
export default agentSlice.reducer;
