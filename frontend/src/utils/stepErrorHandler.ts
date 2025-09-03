import { message } from 'antd';
import { ErrorInfo } from '../components/Error/UnifiedErrorHandler';

/**
 * Step API 错误处理工具函数
 * 符合统一规范v3.md的错误处理规范
 */

export interface StepErrorHandlerOptions {
  stepKey: string;
  action: 'status' | 'execute' | 'result';
  projectId?: string;
  customMessage?: string;
  showNotification?: boolean;
  onRetry?: () => void;
}

/**
 * 处理 Step API 错误的统一函数
 */
export const handleStepApiError = (
  error: any,
  stepKey: string,
  action: 'status' | 'execute' | 'result',
  options: Partial<StepErrorHandlerOptions> = {}
): ErrorInfo => {
  const {
    projectId,
    customMessage,
    showNotification = true,
    onRetry
  } = options;

  // 提取错误信息
  const errorInfo = extractErrorInfo(error, stepKey, action, projectId);
  
  // 记录错误日志（符合规范要求）
  logStepError(errorInfo, stepKey, action, projectId);

  // 显示用户通知
  if (showNotification) {
    const userMessage = customMessage || getUserFriendlyMessage(errorInfo, stepKey, action);
    
    switch (errorInfo.code) {
      case 400:
      case 422:
        message.error(userMessage);
        break;
      case 401:
      case 403:
        message.error(userMessage);
        break;
      case 404:
        message.warning(userMessage);
        break;
      case 409:
        message.warning(userMessage);
        break;
      case 429:
        message.warning(userMessage);
        break;
      case 500:
      case 502:
        message.error(userMessage);
        if (onRetry) {
          setTimeout(() => {
            message.info('您可以稍后重试此操作');
          }, 2000);
        }
        break;
      default:
        message.error(userMessage);
    }
  }

  return errorInfo;
};

/**
 * 提取标准化的错误信息
 */
const extractErrorInfo = (
  error: any,
  stepKey: string,
  action: string,
  projectId?: string
): ErrorInfo => {
  const timestamp = new Date().toISOString();
  const traceId = `${projectId || 'unknown'}-${stepKey}-${action}-${Date.now()}`;

  // 处理 Axios 错误
  if (error.response) {
    const { status, data } = error.response;
    return {
      code: status,
      message: data?.message || error.message || '请求失败',
      details: JSON.stringify(data, null, 2),
      timestamp,
      traceId,
      stepKey,
      projectId
    };
  }

  // 处理网络错误
  if (error.request) {
    return {
      code: 0,
      message: '网络连接失败',
      details: '请检查网络连接或服务器状态',
      timestamp,
      traceId,
      stepKey,
      projectId
    };
  }

  // 处理其他错误
  return {
    message: error.message || '未知错误',
    details: error.stack || JSON.stringify(error),
    timestamp,
    traceId,
    stepKey,
    projectId
  };
};

/**
 * 获取用户友好的错误消息
 */
const getUserFriendlyMessage = (
  errorInfo: ErrorInfo,
  stepKey: string,
  action: string
): string => {
  const stepNames: Record<string, string> = {
    'service-mode': '服务模式选择',
    'bid-analysis': '招标文件分析',
    'file-formatting': '投标文件初始化',
    'material-management': '资料管理',
    'framework-generation': '框架生成',
    'content-generation': '内容生成',
    'format-config': '格式配置',
    'document-export': '文档导出'
  };

  const actionNames: Record<string, string> = {
    'status': '获取状态',
    'execute': '执行操作',
    'result': '获取结果'
  };

  const stepName = stepNames[stepKey] || stepKey;
  const actionName = actionNames[action] || action;

  switch (errorInfo.code) {
    case 400:
      return `${stepName}${actionName}失败：请求参数错误`;
    case 401:
      return `${stepName}${actionName}失败：未授权访问，请重新登录`;
    case 403:
      return `${stepName}${actionName}失败：权限不足`;
    case 404:
      return `${stepName}${actionName}失败：项目或资源不存在`;
    case 409:
      return `${stepName}已有运行中的任务，请等待完成后再试`;
    case 422:
      return `${stepName}${actionName}失败：数据验证错误`;
    case 429:
      return `${stepName}${actionName}失败：请求过于频繁，请稍后重试`;
    case 500:
      return `${stepName}${actionName}失败：服务器内部错误`;
    case 502:
      return `${stepName}${actionName}失败：AI服务或格式化服务不可用`;
    case 0:
      return `${stepName}${actionName}失败：网络连接失败`;
    default:
      return `${stepName}${actionName}失败：${errorInfo.message}`;
  }
};

/**
 * 记录步骤错误日志
 * 符合统一规范v3.md的日志规范要求
 */
const logStepError = (
  errorInfo: ErrorInfo,
  stepKey: string,
  action: string,
  projectId?: string
) => {
  const logEntry = {
    timestamp: errorInfo.timestamp,
    level: 'error',
    project_id: projectId,
    step_key: stepKey,
    action,
    trace_id: errorInfo.traceId,
    error_code: errorInfo.code,
    error_message: errorInfo.message,
    error_details: errorInfo.details,
    user_agent: navigator.userAgent,
    url: window.location.href
  };

  // 输出到控制台（开发环境）
  console.error('Step API Error:', logEntry);

  // 发送到日志服务（生产环境）
  if (process.env.NODE_ENV === 'production') {
    // TODO: 集成日志服务
    // sendToLogService(logEntry);
  }
};

/**
 * 指数退避重试机制
 */
export const createRetryHandler = (
  originalFunction: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  return async (): Promise<any> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await originalFunction();
      } catch (error: any) {
        lastError = error;

        // 不重试的错误码（注意：error 在 TS 中默认为 unknown，这里做类型断言）
        const status: number | undefined = error?.response?.status ?? error?.status;
        if (status && [400, 401, 403, 404, 422].includes(status)) {
          throw error;
        }

        // 最后一次尝试
        if (attempt === maxRetries) {
          throw error;
        }

        // 指数退避延迟
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

/**
 * 步骤错误恢复建议
 */
export const getRecoveryActions = (errorInfo: ErrorInfo, stepKey: string): string[] => {
  const actions: string[] = [];
  
  switch (errorInfo.code) {
    case 400:
    case 422:
      actions.push('检查输入参数是否正确');
      actions.push('确认项目配置完整');
      break;
    case 401:
      actions.push('重新登录系统');
      break;
    case 403:
      actions.push('联系管理员获取权限');
      break;
    case 404:
      actions.push('确认项目是否存在');
      actions.push('检查前置步骤是否完成');
      break;
    case 409:
      actions.push('等待当前任务完成');
      actions.push('刷新页面查看最新状态');
      break;
    case 429:
      actions.push('稍等片刻后重试');
      break;
    case 500:
    case 502:
      actions.push('稍后重试');
      actions.push('联系技术支持');
      break;
    case 0:
      actions.push('检查网络连接');
      actions.push('确认服务器状态');
      break;
  }
  
  return actions;
};
