import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // 主题
  theme: 'light' | 'dark';
  
  // 编辑器
  editorLayout: {
    leftPanelWidth: number;
    rightPanelWidth: number;
    bottomPanelHeight: number;
    leftPanelCollapsed: boolean;
    rightPanelCollapsed: boolean;
    bottomPanelCollapsed: boolean;
  };
  
  // 当前选中的元素
  selectedComponent: string | null;
  selectedPage: string | null;
  
  // 编辑模式
  editMode: 'design' | 'preview' | 'code';
  
  // 缩放级别
  zoomLevel: number;
  
  // 网格显示
  showGrid: boolean;
  gridSize: number;
  
  // 标尺显示
  showRuler: boolean;
  
  // 对齐辅助线
  showGuides: boolean;
  
  // 组件库面板
  componentLibraryExpanded: boolean;
  
  // 属性面板
  propertyPanelTab: 'properties' | 'style' | 'events';
  
  // 页面树面板
  pageTreeExpanded: boolean;
  
  // 历史面板
  historyPanelExpanded: boolean;
  
  // 全局加载状态
  globalLoading: boolean;
  
  // 通知
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    timestamp: number;
  }>;
  
  // 模态框
  modals: {
    [key: string]: {
      visible: boolean;
      data?: any;
    };
  };
  
  // 抽屉
  drawers: {
    [key: string]: {
      visible: boolean;
      data?: any;
    };
  };
}

const initialState: UIState = {
  sidebarCollapsed: false,
  sidebarWidth: 240,
  theme: 'light',
  editorLayout: {
    leftPanelWidth: 280,
    rightPanelWidth: 320,
    bottomPanelHeight: 200,
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    bottomPanelCollapsed: true,
  },
  selectedComponent: null,
  selectedPage: null,
  editMode: 'design',
  zoomLevel: 100,
  showGrid: true,
  gridSize: 10,
  showRuler: true,
  showGuides: true,
  componentLibraryExpanded: true,
  propertyPanelTab: 'properties',
  pageTreeExpanded: true,
  historyPanelExpanded: false,
  globalLoading: false,
  notifications: [],
  modals: {},
  drawers: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // 侧边栏
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload;
    },
    
    // 主题
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    // 编辑器布局
    updateEditorLayout: (state, action: PayloadAction<Partial<UIState['editorLayout']>>) => {
      state.editorLayout = { ...state.editorLayout, ...action.payload };
    },
    
    // 选中元素
    setSelectedComponent: (state, action: PayloadAction<string | null>) => {
      state.selectedComponent = action.payload;
    },
    setSelectedPage: (state, action: PayloadAction<string | null>) => {
      state.selectedPage = action.payload;
    },
    
    // 编辑模式
    setEditMode: (state, action: PayloadAction<'design' | 'preview' | 'code'>) => {
      state.editMode = action.payload;
    },
    
    // 缩放
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(10, Math.min(500, action.payload));
    },
    zoomIn: (state) => {
      state.zoomLevel = Math.min(500, state.zoomLevel + 10);
    },
    zoomOut: (state) => {
      state.zoomLevel = Math.max(10, state.zoomLevel - 10);
    },
    resetZoom: (state) => {
      state.zoomLevel = 100;
    },
    
    // 网格和辅助线
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
    },
    toggleRuler: (state) => {
      state.showRuler = !state.showRuler;
    },
    toggleGuides: (state) => {
      state.showGuides = !state.showGuides;
    },
    
    // 面板
    toggleComponentLibrary: (state) => {
      state.componentLibraryExpanded = !state.componentLibraryExpanded;
    },
    setPropertyPanelTab: (state, action: PayloadAction<'properties' | 'style' | 'events'>) => {
      state.propertyPanelTab = action.payload;
    },
    togglePageTree: (state) => {
      state.pageTreeExpanded = !state.pageTreeExpanded;
    },
    toggleHistoryPanel: (state) => {
      state.historyPanelExpanded = !state.historyPanelExpanded;
    },
    
    // 全局加载
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    
    // 通知
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // 模态框
    showModal: (state, action: PayloadAction<{ key: string; data?: any }>) => {
      state.modals[action.payload.key] = {
        visible: true,
        data: action.payload.data,
      };
    },
    hideModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].visible = false;
      }
    },
    
    // 抽屉
    showDrawer: (state, action: PayloadAction<{ key: string; data?: any }>) => {
      state.drawers[action.payload.key] = {
        visible: true,
        data: action.payload.data,
      };
    },
    hideDrawer: (state, action: PayloadAction<string>) => {
      if (state.drawers[action.payload]) {
        state.drawers[action.payload].visible = false;
      }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarWidth,
  setTheme,
  updateEditorLayout,
  setSelectedComponent,
  setSelectedPage,
  setEditMode,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  toggleGrid,
  setGridSize,
  toggleRuler,
  toggleGuides,
  toggleComponentLibrary,
  setPropertyPanelTab,
  togglePageTree,
  toggleHistoryPanel,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  showModal,
  hideModal,
  showDrawer,
  hideDrawer,
} = uiSlice.actions;

export default uiSlice.reducer;
