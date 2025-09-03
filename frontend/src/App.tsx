import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/Project/ProjectList';
import ProjectEditor from './pages/Project/ProjectEditor';
import BidProjectCreate from './pages/Project/BidProjectCreate';
import ProjectWorkflowStepPage from './pages/Project/ProjectWorkflowStepPage';
import DataStats from './pages/DataStats';
import HelpPage from './pages/Help/HelpPage';
import Settings from './pages/Settings';

// 保留一些重要的功能页面，但不在主导航中显示
import BidAnalysisPage from './pages/BidAnalysis/BidAnalysisPage';

import MaterialManagementPage from './pages/MaterialManagement/MaterialManagementPage';
import ServiceModePage from './pages/ServiceMode/ServiceModePage';
import FilePreviewPage from './pages/FilePreview/FilePreviewPage';
import FrameworkGenerationPage from './pages/FrameworkGeneration/FrameworkGenerationPage';
import ContentGenerationPage from './pages/ContentGeneration/ContentGenerationPage';
import FormatConfigPage from './pages/FormatConfig/FormatConfigPage';
import DocumentExportPage from './pages/DocumentExport/DocumentExportPage';
import PromptManagementPage from './pages/PromptManagement/PromptManagementPage';
import SystemMonitorPage from './pages/SystemMonitor/SystemMonitorPage';
import SystemDiagnosticPage from './pages/SystemDiagnostic/SystemDiagnosticPage';
import FileFormattingPage from './pages/FileFormatting/FileFormattingPage';

// Debug组件
import { ApiTest } from './components/Debug';
import ProjectDataTest from './components/Debug/ProjectDataTest';

import { useAppDispatch, useAppSelector } from './store';
import { loginSync } from './store/slices/authSlice';
import { useDesktopApp } from './hooks/useDesktopApp';

import './App.css';

// 将无ID的文件格式化页改为重定向组件，避免无项目ID访问
const FileFormattingRedirect: React.FC = () => {
  const { currentProject } = useAppSelector(state => state.project);
  if (currentProject?.id) {
    return <Navigate to={`/projects/${currentProject.id}/step/file-formatting`} replace />;
  }
  return <Navigate to="/projects" replace />;
};


// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { checkSystemStatus, appInfo } = useDesktopApp();

  // 检查本地存储的登录状态和自动登录
  useEffect(() => {
    const token = localStorage.getItem('ztb_token');
    const userStr = localStorage.getItem('ztb_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(loginSync({ user, token }));
        console.log('从本地存储恢复登录状态');
      } catch (error) {
        // 清除无效的本地存储
        localStorage.removeItem('ztb_token');
        localStorage.removeItem('ztb_user');
        console.log('清除无效的本地存储');
      }
    }

    // 检查是否在Electron环境中，如果是则自动登录
    const checkElectronAndAutoLogin = () => {
      // 检查window.appInfo是否存在（Electron环境标识）
      if (window.appInfo?.isElectron && !token) {
        console.log('检测到Electron环境，执行自动登录...');
        const autoUser = {
          id: 'desktop_user',
          username: 'desktop',
          displayName: '桌面用户',
          name: '桌面用户',
          email: 'desktop@ztbai.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=desktop',
          role: 'admin',
          permissions: ['all'],
        };
        const autoToken = 'desktop_auto_token_' + Date.now();

        dispatch(loginSync({
          user: autoUser,
          token: autoToken,
        }));

        // 保存到localStorage
        localStorage.setItem('ztb_token', autoToken);
        localStorage.setItem('ztb_user', JSON.stringify(autoUser));

        console.log('桌面应用自动登录完成');
      }
    };

    // 立即检查
    checkElectronAndAutoLogin();

    // 如果window.appInfo还没有加载，等待一下再检查
    if (!window.appInfo) {
      const timer = setTimeout(checkElectronAndAutoLogin, 1000);
      return () => clearTimeout(timer);
    }
  }, [dispatch]);

  // 桌面应用初始化
  useEffect(() => {
    if (window.appInfo?.isElectron) {
      console.log('运行在Electron环境中');
      console.log('应用信息:', appInfo);

      // 检查系统状态
      checkSystemStatus().then(status => {
        if (status) {
          console.log('系统状态:', status);
        }
      });

      // 设置窗口标题
      if (appInfo?.version) {
        document.title = `ZtbAi智能投标系统 v${appInfo.version}`;
      }
    }
  }, [appInfo, checkSystemStatus]);

  // 调试信息（仅在开发环境显示）
  if (process.env.NODE_ENV === 'development') {
    console.log('App render - isAuthenticated:', isAuthenticated);
    console.log('App render - window.appInfo:', window.appInfo);
    console.log('App render - window.electronAPI:', window.electronAPI);
  }

  return (
    <div className="App">
      <Routes>
        {/* 登录路由 */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        {/* 受保护的路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* 主要导航页面 */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<BidProjectCreate />} />
          <Route path="projects/:projectId/edit" element={<ProjectEditor />} />
          <Route path="projects/:projectId/workflow" element={<ProjectWorkflowStepPage />} />
          {/* 为具体步骤提供专用路由，确保能进入真实的功能页面 */}
          {/* Specific step routes must be defined BEFORE the generic :stepKey route */}
          <Route path="projects/:projectId/step/service-mode" element={<ServiceModePage />} />
          <Route path="projects/:projectId/step/file-formatting" element={<FileFormattingPage />} />
          <Route path="projects/:projectId/step/bid-analysis" element={<BidAnalysisPage />} />
          <Route path="projects/:projectId/step/material-management" element={<MaterialManagementPage />} />
          <Route path="projects/:projectId/step/file-preview" element={<FilePreviewPage />} />
          <Route path="projects/:projectId/step/framework-generation" element={<FrameworkGenerationPage />} />
          <Route path="projects/:projectId/step/content-generation" element={<ContentGenerationPage />} />
          <Route path="projects/:projectId/step/format-config" element={<FormatConfigPage />} />
          <Route path="projects/:projectId/step/document-export" element={<DocumentExportPage />} />

          {/* Generic step route - MUST be last */}
          <Route path="projects/:projectId/step/:stepKey" element={<ProjectWorkflowStepPage />} />

          <Route path="data-stats" element={<DataStats />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<HelpPage />} />

          {/* Redirect for file formatting without project ID */}
          <Route path="projects/:projectId/step/file-formatting-redirect" element={<FileFormattingRedirect />} />
          <Route path="prompt-management" element={<PromptManagementPage />} />
          <Route path="system-monitor" element={<SystemMonitorPage />} />
          <Route path="system-diagnostic" element={<SystemDiagnosticPage />} />

          {/* 调试页面 */}
          <Route path="debug/api-test" element={<ApiTest />} />
          <Route path="debug/projects" element={<ProjectDataTest />} />
        </Route>

        {/* 404路由 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;
