import React from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export interface ErrorInfo {
  code?: number;
  message: string;
  details?: string;
  timestamp?: string;
  traceId?: string;
  stepKey?: string;
  projectId?: string;
}

export interface UnifiedErrorHandlerProps {
  error: ErrorInfo | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  size?: 'small' | 'default' | 'large';
  type?: 'error' | 'warning' | 'info';
}

/**
 * 统一错误处理组件
 * 符合统一规范v3.md的错误处理要求
 */
export const UnifiedErrorHandler: React.FC<UnifiedErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  size = 'default',
  type = 'error'
}) => {
  if (!error) return null;

  const errorInfo = normalizeError(error);
  const errorMessage = getErrorMessage(errorInfo);
  const errorDescription = getErrorDescription(errorInfo);

  return (
    <Alert
      message={errorMessage}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          {errorDescription && (
            <Paragraph style={{ margin: 0 }}>
              {errorDescription}
            </Paragraph>
          )}
          
          {showDetails && errorInfo.details && (
            <div style={{ 
              background: '#f5f5f5', 
              padding: '8px 12px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <Text type="secondary">{errorInfo.details}</Text>
            </div>
          )}

          {(onRetry || onDismiss) && (
            <Space>
              {onRetry && (
                <Button 
                  size="small" 
                  icon={<ReloadOutlined />} 
                  onClick={onRetry}
                >
                  重试
                </Button>
              )}
              {onDismiss && (
                <Button size="small" onClick={onDismiss}>
                  关闭
                </Button>
              )}
            </Space>
          )}
        </Space>
      }
      type={type}
      showIcon
      icon={<ExclamationCircleOutlined />}
      style={{ marginBottom: 16 }}
      closable={!!onDismiss}
      onClose={onDismiss}
    />
  );
};

/**
 * 标准化错误对象
 */
export const normalizeError = (error: ErrorInfo | Error | string | null): ErrorInfo => {
  if (!error) {
    return { message: '未知错误' };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack,
    };
  }

  return error;
};

/**
 * 获取用户友好的错误消息
 */
export const getErrorMessage = (errorInfo: ErrorInfo): string => {
  const { code, message } = errorInfo;

  // 根据HTTP状态码返回标准化消息
  switch (code) {
    case 400:
      return '请求参数错误';
    case 401:
      return '未授权访问';
    case 403:
      return '禁止访问';
    case 404:
      return '资源不存在';
    case 409:
      return '操作冲突';
    case 422:
      return '数据验证失败';
    case 429:
      return '请求过于频繁';
    case 500:
      return '服务器内部错误';
    case 502:
      return '上游服务不可用';
    default:
      return message || '操作失败';
  }
};

/**
 * 获取错误详细描述
 */
export const getErrorDescription = (errorInfo: ErrorInfo): string | null => {
  const { code, message, stepKey } = errorInfo;

  // 根据错误码提供具体的解决建议
  switch (code) {
    case 400:
      return '请检查输入参数是否正确，或联系技术支持。';
    case 401:
      return '请重新登录后再试。';
    case 403:
      return '您没有执行此操作的权限，请联系管理员。';
    case 404:
      if (stepKey) {
        return `步骤"${stepKey}"的资源不存在，请确保项目配置正确。`;
      }
      return '请确保资源存在或联系技术支持。';
    case 409:
      if (stepKey) {
        return `步骤"${stepKey}"已有运行中的任务，请等待完成后再试。`;
      }
      return '已有运行中的任务，请等待完成后再试。';
    case 502:
      return 'AI服务或格式化服务暂时不可用，请稍后重试。';
    case 500:
      return '系统遇到内部错误，请稍后重试或联系技术支持。';
    default:
      return message !== getErrorMessage(errorInfo) ? message : null;
  }
};

export default UnifiedErrorHandler;
