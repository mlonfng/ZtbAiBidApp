import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import App from './App';
import { store } from './store';
import './index.css';

// 设置dayjs中文
dayjs.locale('zh-cn');

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>应用加载出错</h2>
          <details>
            <summary>错误详情</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// 确保DOM已加载
function initializeApp() {
  try {
    // 调试信息
    console.log('🚀 Initializing React app...');
    console.log('Document ready state:', document.readyState);
    console.log('Document body:', document.body);
    console.log('Looking for root container...');

    const container = document.getElementById('root');
    console.log('Root container found:', container);

    if (!container) {
      console.error('Available elements:', document.querySelectorAll('*'));
      console.error('Document HTML:', document.documentElement.outerHTML);
      throw new Error('Root container not found');
    }

    console.log('📦 Creating React root...');
    const root = ReactDOM.createRoot(container);

    console.log('🎨 Rendering React app...');

    // 根据环境决定是否使用StrictMode
    const AppComponent = (
      <ErrorBoundary>
        <Provider store={store}>
          <HashRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ConfigProvider
              locale={zhCN}
              theme={{
                token: {
                  colorPrimary: '#1890ff',
                  borderRadius: 6,
                },
              }}
            >
              <AntdApp>
                <App />
              </AntdApp>
            </ConfigProvider>
          </HashRouter>
        </Provider>
      </ErrorBoundary>
    );

    // 仅在开发环境使用StrictMode，生产环境直接渲染
    root.render(
      process.env.NODE_ENV === 'development' ?
        <React.StrictMode>{AppComponent}</React.StrictMode> :
        AppComponent
    );
    console.log('✅ React app rendered successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    // 显示错误信息
    const container = document.getElementById('root');
    if (container) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : String(error);
      container.innerHTML = `
        <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
          <h2>应用初始化失败</h2>
          <p>错误信息: ${errorMessage}</p>
          <details>
            <summary>详细信息</summary>
            <pre>${errorStack}</pre>
          </details>
        </div>
      `;
    }
  }
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}


