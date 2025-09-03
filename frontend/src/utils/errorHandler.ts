/**
 * 统一错误处理工具
 * 符合统一规范v3.md的HTTP状态码规范
 */

import { message } from 'antd';

export interface ApiError {
  status: number;
  message: string;
  data?: any;
  timestamp?: string;
  code?: number;
}

export interface ErrorHandlerOptions {
  showMessage?: boolean;
  logError?: boolean;
  customMessage?: string;
  onError?: (error: ApiError) => void;
}

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  /**
   * 处理API错误
   */
  static handleApiError(error: any, options: ErrorHandlerOptions = {}): ApiError {
    const {
      showMessage = true,
      logError = true,
      customMessage,
      onError
    } = options;

    let apiError: ApiError;

    if (error.response) {
      // HTTP错误响应
      const { status, data } = error.response;
      apiError = {
        status,
        message: data?.message || this.getDefaultMessage(status),
        data: data?.data,
        timestamp: data?.timestamp,
        code: data?.code || status
      };
    } else if (error.request) {
      // 网络错误
      apiError = {
        status: 0,
        message: '网络连接失败，请检查网络设置'
      };
    } else {
      // 其他错误
      apiError = {
        status: -1,
        message: error.message || '未知错误'
      };
    }

    // 记录错误日志
    if (logError) {
      this.logError(apiError);
    }

    // 显示用户消息
    if (showMessage) {
      this.showUserMessage(apiError, customMessage);
    }

    // 执行自定义错误处理
    if (onError) {
      onError(apiError);
    }

    return apiError;
  }

  /**
   * 获取状态码对应的默认错误消息
   */
  private static getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return '请求参数错误，请检查输入信息';
      case 401:
        return '未授权访问，请重新登录';
      case 403:
        return '禁止访问，权限不足';
      case 404:
        return '请求的资源不存在';
      case 409:
        return '操作冲突，请稍后重试';
      case 422:
        return '数据验证失败，请检查输入';
      case 429:
        return '请求过于频繁，请稍后重试';
      case 500:
        return '服务器内部错误，请稍后重试';
      case 502:
        return '服务暂时不可用，请稍后重试';
      default:
        return `请求失败 (${status})`;
    }
  }

  /**
   * 记录错误日志
   */
  private static logError(error: ApiError): void {
    const logLevel = this.getLogLevel(error.status);
    const logMessage = `[${logLevel}] API错误 - 状态码: ${error.status}, 消息: ${error.message}`;
    
    switch (logLevel) {
      case 'ERROR':
        console.error(logMessage, error);
        break;
      case 'WARN':
        console.warn(logMessage, error);
        break;
      case 'INFO':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
  }

  /**
   * 获取错误日志级别
   */
  private static getLogLevel(status: number): string {
    if (status >= 500) return 'ERROR';
    if (status >= 400) return 'WARN';
    if (status >= 300) return 'INFO';
    return 'DEBUG';
  }

  /**
   * 显示用户友好的错误消息
   */
  public static showUserMessage(error: ApiError, customMessage?: string): void {
    const displayMessage = customMessage || error.message;

    switch (error.status) {
      case 400:
      case 422:
        message.error(displayMessage);
        break;
      case 401:
        message.error('登录已过期，请重新登录');
        break;
      case 403:
        message.warning(displayMessage);
        break;
      case 404:
        message.warning(displayMessage);
        break;
      case 409:
        message.warning(displayMessage);
        break;
      case 429:
        message.warning(displayMessage);
        break;
      case 500:
      case 502:
        message.error(displayMessage);
        break;
      case 0:
        message.error('网络连接失败，请检查网络设置');
        break;
      default:
        message.error(displayMessage);
    }
  }

  /**
   * 检查错误是否可以重试
   */
  static isRetryableError(error: ApiError): boolean {
    // 网络错误、服务器错误、上游服务错误可以重试
    return [0, 500, 502, 503, 504].includes(error.status);
  }

  /**
   * 检查错误是否需要用户干预
   */
  static requiresUserAction(error: ApiError): boolean {
    // 参数错误、验证错误、权限错误需要用户干预
    return [400, 401, 403, 422].includes(error.status);
  }

  /**
   * 检查错误是否表示冲突状态
   */
  static isConflictError(error: ApiError): boolean {
    return error.status === 409;
  }

  /**
   * 检查错误是否表示资源不存在
   */
  static isNotFoundError(error: ApiError): boolean {
    return error.status === 404;
  }
}

/**
 * Step API专用错误处理器
 */
export class StepApiErrorHandler extends ErrorHandler {
  /**
   * 处理Step API特定错误
   */
  static handleStepApiError(
    error: any, 
    stepKey: string, 
    action: string,
    options: ErrorHandlerOptions = {}
  ): ApiError {
    const apiError = this.handleApiError(error, {
      ...options,
      showMessage: false // 先不显示消息，由下面的逻辑处理
    });

    // Step API特定的错误处理
    let userMessage = '';
    
    switch (apiError.status) {
      case 409:
        userMessage = `${this.getStepDisplayName(stepKey)}已有运行中的任务，请等待完成后重试`;
        break;
      case 404:
        if (action === 'result') {
          userMessage = `${this.getStepDisplayName(stepKey)}还没有执行结果`;
        } else {
          userMessage = `${this.getStepDisplayName(stepKey)}不存在`;
        }
        break;
      case 502:
        userMessage = `${this.getStepDisplayName(stepKey)}服务暂时不可用，请稍后重试`;
        break;
      default:
        userMessage = `${this.getStepDisplayName(stepKey)}操作失败：${apiError.message}`;
    }

    // 显示Step API特定的用户消息
    if (options.showMessage !== false) {
      ErrorHandler.showUserMessage(apiError, userMessage);
    }

    return apiError;
  }

  /**
   * 获取步骤的显示名称
   */
  private static getStepDisplayName(stepKey: string): string {
    const stepNames: Record<string, string> = {
      'service-mode': '服务模式',
      'bid-analysis': '招标分析',
      'file-formatting': '文件格式化',
      'material-management': '资料管理',
      'framework-generation': '框架生成',
      'content-generation': '内容生成',
      'format-config': '格式配置',
      'document-export': '文档导出'
    };
    
    return stepNames[stepKey] || stepKey;
  }
}

// 导出便捷方法
export const handleApiError = ErrorHandler.handleApiError.bind(ErrorHandler);
export const handleStepApiError = StepApiErrorHandler.handleStepApiError.bind(StepApiErrorHandler);

// 导出新的统一错误处理组件和工具
export { UnifiedErrorHandler } from '../components/Error/UnifiedErrorHandler';
export type { ErrorInfo } from '../components/Error/UnifiedErrorHandler';
export { createRetryHandler, getRecoveryActions } from './stepErrorHandler';
