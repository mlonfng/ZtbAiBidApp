// frontend/src/services/__mocks__/api.js

const mockProjectData = {
  id: '1',
  name: '模拟项目：山西路桥第三工程有限公司办公家具竞争性谈判采购',
  status: 'in_progress',
  service_mode: 'AI智能模式',
  project_path: 'G:\\ZtbAiBidApp_202507210900\\Bid\\Project-1',
  bid_document_name: '招标文件示例.docx',
  current_step: '服务模式',
  created_at: new Date('2025-08-22T10:00:00Z').toISOString(),
  updated_at: new Date('2025-08-23T09:58:10Z').toISOString(),
  files: [{}, {}, {}],
  progress: { total_progress: 75 },
};

// --- Mocks for general API calls ---
export const getProject = async (id) => Promise.resolve({ data: mockProjectData });
export const checkBackendStatus = async () => Promise.resolve({ data: { status: 'ok' } });
export const getSystemStatus = async () => Promise.resolve({ data: { backend: true } });

// --- Mocks for ServiceModePage ---
export const serviceAPI = {
  getServiceModes: async () => Promise.resolve({
    success: true,
    data: {
      ai: { name: 'AI智能模式', description: 'AI驱动', price: 100, features: ['f1'] },
      manual: { name: '人工模式', description: '人工服务', price: 1000, features: ['f1'] },
    }
  }),
};

export const serviceStepAPI = {
  execute: async (projectId, mode) => Promise.resolve({ success: true, data: { projectId, mode } }),
};

// --- Mock for configAPI to prevent crashes ---
export const configAPI = {
  getUnifiedConfig: async () => Promise.resolve({ success: true, data: {} }),
};

// --- Default export to mock the createApi function ---
const createApi = () => ({
  getProject,
  checkBackendStatus,
  getSystemStatus,
  getProjects: async () => Promise.resolve({ data: [] }),
  createProject: async () => Promise.resolve({ data: {} }),
  updateProject: async () => Promise.resolve({ data: {} }),
  deleteProject: async () => Promise.resolve({ data: {} }),
});

export default createApi;

