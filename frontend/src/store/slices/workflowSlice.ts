import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 工作流状态类型
export type WorkflowStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

// 任务状态类型
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// 任务接口
export interface Task {
  id: string;
  name: string;
  type: string;
  status: TaskStatus;
  agentId?: string;
  input?: any;
  output?: any;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  dependencies: string[];
  position: { x: number; y: number };
}

// 工作流接口
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  templateId?: string;
  projectId?: string;
  tasks: Task[];
  connections: Array<{ from: string; to: string }>;
  variables: Record<string, any>;
  createTime: Date;
  updateTime: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  successRate: number;
}

// 工作流模板接口
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tasks: Omit<Task, 'id' | 'status' | 'startTime' | 'endTime' | 'duration' | 'error'>[];
  connections: Array<{ from: string; to: string }>;
  variables: Record<string, any>;
  isPublic: boolean;
  createTime: Date;
}

// 状态接口
interface WorkflowState {
  workflows: Workflow[];
  templates: WorkflowTemplate[];
  currentWorkflow: Workflow | null;
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
  executionLogs: Array<{
    id: string;
    workflowId: string;
    taskId?: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

// 初始状态
const initialState: WorkflowState = {
  workflows: [],
  templates: [],
  currentWorkflow: null,
  selectedTask: null,
  loading: false,
  error: null,
  executionLogs: [],
};

// 异步操作：获取工作流列表
export const fetchWorkflows = createAsyncThunk(
  'workflow/fetchWorkflows',
  async (params?: { projectId?: string; status?: WorkflowStatus }) => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockWorkflows: Workflow[] = [
      {
        id: 'workflow_1',
        name: '商务投标工作流',
        description: '商务类投标文件生成工作流',
        status: 'completed',
        templateId: 'template_1',
        projectId: params?.projectId || 'project_1',
        tasks: [
          {
            id: 'task_1',
            name: '需求分析',
            type: 'requirement_analysis',
            status: 'completed',
            agentId: 'requirement_analyzer',
            dependencies: [],
            position: { x: 100, y: 100 },
            startTime: new Date(Date.now() - 3600000),
            endTime: new Date(Date.now() - 3000000),
            duration: 600000,
          },
          {
            id: 'task_2',
            name: '内容生成',
            type: 'content_generation',
            status: 'completed',
            agentId: 'content_generator',
            dependencies: ['task_1'],
            position: { x: 300, y: 100 },
            startTime: new Date(Date.now() - 3000000),
            endTime: new Date(Date.now() - 1800000),
            duration: 1200000,
          },
          {
            id: 'task_3',
            name: '文档生成',
            type: 'document_generation',
            status: 'completed',
            agentId: 'technical_writer',
            dependencies: ['task_2'],
            position: { x: 500, y: 100 },
            startTime: new Date(Date.now() - 1800000),
            endTime: new Date(Date.now() - 600000),
            duration: 1200000,
          },
        ],
        connections: [
          { from: 'task_1', to: 'task_2' },
          { from: 'task_2', to: 'task_3' },
        ],
        variables: {
          project_type: 'commercial',
          deadline: '2024-08-15',
        },
        createTime: new Date(Date.now() - 86400000),
        updateTime: new Date(Date.now() - 600000),
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 600000),
        duration: 3000000,
        progress: 100,
        successRate: 100,
      },
    ];
    
    return mockWorkflows;
  }
);

// 异步操作：获取工作流模板
export const fetchWorkflowTemplates = createAsyncThunk(
  'workflow/fetchWorkflowTemplates',
  async () => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockTemplates: WorkflowTemplate[] = [
      {
        id: 'template_1',
        name: '商务投标模板',
        description: '适用于商务类投标项目的标准工作流模板',
        category: 'commercial',
        tasks: [
          {
            name: '需求分析',
            type: 'requirement_analysis',
            dependencies: [],
            position: { x: 100, y: 100 },
          },
          {
            name: '内容生成',
            type: 'content_generation',
            dependencies: ['task_1'],
            position: { x: 300, y: 100 },
          },
          {
            name: '文档生成',
            type: 'document_generation',
            dependencies: ['task_2'],
            position: { x: 500, y: 100 },
          },
        ],
        connections: [
          { from: 'task_1', to: 'task_2' },
          { from: 'task_2', to: 'task_3' },
        ],
        variables: {},
        isPublic: true,
        createTime: new Date(Date.now() - 7 * 86400000),
      },
    ];
    
    return mockTemplates;
  }
);

// 异步操作：创建工作流
export const createWorkflow = createAsyncThunk(
  'workflow/createWorkflow',
  async (data: { name: string; description: string; templateId?: string; projectId: string }) => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: data.name,
      description: data.description,
      status: 'draft',
      templateId: data.templateId,
      projectId: data.projectId,
      tasks: [],
      connections: [],
      variables: {},
      createTime: new Date(),
      updateTime: new Date(),
      progress: 0,
      successRate: 0,
    };
    
    return newWorkflow;
  }
);

// 异步操作：执行工作流
export const executeWorkflow = createAsyncThunk(
  'workflow/executeWorkflow',
  async (workflowId: string) => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { workflowId, status: 'running' as WorkflowStatus };
  }
);

// 创建slice
const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    // 设置当前工作流
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },
    
    // 选择任务
    selectTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    
    // 更新任务状态
    updateTaskStatus: (state, action: PayloadAction<{ taskId: string; status: TaskStatus }>) => {
      if (state.currentWorkflow) {
        const task = state.currentWorkflow.tasks.find(t => t.id === action.payload.taskId);
        if (task) {
          task.status = action.payload.status;
          if (action.payload.status === 'running') {
            task.startTime = new Date();
          } else if (action.payload.status === 'completed' || action.payload.status === 'failed') {
            task.endTime = new Date();
            if (task.startTime) {
              task.duration = task.endTime.getTime() - task.startTime.getTime();
            }
          }
        }
      }
    },
    
    // 更新工作流状态
    updateWorkflowStatus: (state, action: PayloadAction<{ workflowId: string; status: WorkflowStatus }>) => {
      const workflow = state.workflows.find(w => w.id === action.payload.workflowId);
      if (workflow) {
        workflow.status = action.payload.status;
        workflow.updateTime = new Date();
        
        if (action.payload.status === 'running') {
          workflow.startTime = new Date();
        } else if (action.payload.status === 'completed' || action.payload.status === 'failed') {
          workflow.endTime = new Date();
          if (workflow.startTime) {
            workflow.duration = workflow.endTime.getTime() - workflow.startTime.getTime();
          }
        }
      }
      
      if (state.currentWorkflow && state.currentWorkflow.id === action.payload.workflowId) {
        state.currentWorkflow.status = action.payload.status;
      }
    },
    
    // 添加执行日志
    addExecutionLog: (state, action: PayloadAction<{
      workflowId: string;
      taskId?: string;
      level: 'info' | 'warning' | 'error';
      message: string;
    }>) => {
      state.executionLogs.push({
        id: `log_${Date.now()}`,
        ...action.payload,
        timestamp: new Date(),
      });
    },
    
    // 清空错误
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取工作流列表
      .addCase(fetchWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取工作流列表失败';
      })
      
      // 获取工作流模板
      .addCase(fetchWorkflowTemplates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkflowTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchWorkflowTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取工作流模板失败';
      })
      
      // 创建工作流
      .addCase(createWorkflow.pending, (state) => {
        state.loading = true;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows.push(action.payload);
        state.currentWorkflow = action.payload;
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '创建工作流失败';
      })
      
      // 执行工作流
      .addCase(executeWorkflow.fulfilled, (state, action) => {
        const { workflowId, status } = action.payload;
        const workflow = state.workflows.find(w => w.id === workflowId);
        if (workflow) {
          workflow.status = status;
          workflow.updateTime = new Date();
        }
        
        if (state.currentWorkflow && state.currentWorkflow.id === workflowId) {
          state.currentWorkflow.status = status;
        }
      });
  },
});

// 导出actions
export const {
  setCurrentWorkflow,
  selectTask,
  updateTaskStatus,
  updateWorkflowStatus,
  addExecutionLog,
  clearError,
} = workflowSlice.actions;

// 导出reducer
export default workflowSlice.reducer;
