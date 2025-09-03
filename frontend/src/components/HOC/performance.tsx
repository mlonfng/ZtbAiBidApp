import React from 'react';
import { Spin } from 'antd';

// 懒加载HOC
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode = <Spin size="large" />
) => {
  return React.memo((props: P) => (
    <React.Suspense fallback={fallback}>
      <Component {...props} />
    </React.Suspense>
  ));
};

// 错误边界HOC
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error }>
) => {
  return class extends React.Component<P, ErrorBoundaryState> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component Error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        if (fallback && this.state.error) {
          const FallbackComponent = fallback;
          return <FallbackComponent error={this.state.error} />;
        }
        return <div>Something went wrong.</div>;
      }

      return <Component {...this.props} />;
    }
  };
};

// 性能监控HOC
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`${componentName} render time: ${endTime - startTime}ms`);
      };
    });

    return <Component {...props} />;
  });
};
