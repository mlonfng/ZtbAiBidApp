import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';

/**
 * 优化的轮询机制Hook
 * 符合统一规范v3.md的性能和稳定性要求
 */

export interface PollingOptions {
  // 基础配置
  initialInterval?: number;      // 初始轮询间隔(ms)
  maxInterval?: number;          // 最大轮询间隔(ms)
  maxRetries?: number;           // 最大重试次数
  backoffMultiplier?: number;    // 退避倍数
  
  // 智能调节
  adaptiveInterval?: boolean;    // 是否启用自适应间隔
  fastInitialPolls?: number;     // 初始快速轮询次数
  
  // 错误处理
  retryableErrors?: number[];    // 可重试的错误码
  onError?: (error: any, attempt: number) => void;
  onMaxRetriesReached?: (error: any) => void;
  
  // 生命周期
  onStart?: () => void;
  onStop?: () => void;
  onSuccess?: (data: any) => void;
}

export interface PollingState {
  isPolling: boolean;
  attempt: number;
  lastError: any;
  currentInterval: number;
}

const DEFAULT_OPTIONS: Required<PollingOptions> = {
  initialInterval: 2000,
  maxInterval: 30000,
  maxRetries: 10,
  backoffMultiplier: 1.5,
  adaptiveInterval: true,
  fastInitialPolls: 3,
  retryableErrors: [0, 500, 502, 503, 504],
  onError: () => {},
  onMaxRetriesReached: () => {},
  onStart: () => {},
  onStop: () => {},
  onSuccess: () => {},
};

export const useOptimizedPolling = <T>(
  pollingFunction: () => Promise<T>,
  shouldContinue: (data: T) => boolean,
  options: PollingOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<PollingState>({
    isPolling: false,
    attempt: 0,
    lastError: null,
    currentInterval: opts.initialInterval,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const successCountRef = useRef(0);

  // 计算下次轮询间隔
  const calculateNextInterval = useCallback((attempt: number, hasError: boolean): number => {
    if (!opts.adaptiveInterval) {
      return opts.initialInterval;
    }

    // 初始快速轮询
    if (attempt <= opts.fastInitialPolls) {
      return Math.min(opts.initialInterval * 0.5, 1000);
    }

    // 错误时使用指数退避
    if (hasError) {
      const backoffInterval = opts.initialInterval * Math.pow(opts.backoffMultiplier, consecutiveErrorsRef.current);
      return Math.min(backoffInterval, opts.maxInterval);
    }

    // 成功时根据成功次数调整间隔
    if (successCountRef.current > 5) {
      return Math.min(opts.initialInterval * 2, opts.maxInterval);
    }

    return opts.initialInterval;
  }, [opts]);

  // 执行单次轮询
  const executePoll = useCallback(async (): Promise<{ data: T; shouldStop: boolean }> => {
    try {
      const data = await pollingFunction();
      const shouldStop = !shouldContinue(data);
      
      // 重置错误计数，增加成功计数
      consecutiveErrorsRef.current = 0;
      successCountRef.current += 1;
      
      opts.onSuccess(data);
      
      return { data, shouldStop };
    } catch (error) {
      consecutiveErrorsRef.current += 1;
      successCountRef.current = 0;
      
      // 检查是否为可重试错误
      const isRetryable = opts.retryableErrors.includes(
        (error as any)?.response?.status || (error as any)?.status || 0
      );
      
      if (!isRetryable) {
        throw error;
      }
      
      opts.onError(error, state.attempt);
      throw error;
    }
  }, [pollingFunction, shouldContinue, opts, state.attempt]);

  // 启动轮询
  const startPolling = useCallback(() => {
    if (state.isPolling) {
      return;
    }

    setState(prev => ({ ...prev, isPolling: true, attempt: 0, lastError: null }));
    abortControllerRef.current = new AbortController();
    consecutiveErrorsRef.current = 0;
    successCountRef.current = 0;
    
    opts.onStart();

    const poll = async () => {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({ ...prev, attempt: prev.attempt + 1 }));

      try {
        const { data, shouldStop } = await executePoll();
        
        if (shouldStop) {
          stopPolling();
          return;
        }

        // 计算下次轮询间隔
        const nextInterval = calculateNextInterval(state.attempt + 1, false);
        setState(prev => ({ ...prev, currentInterval: nextInterval, lastError: null }));

        // 调度下次轮询
        if (!abortControllerRef.current?.signal.aborted) {
          timeoutRef.current = setTimeout(poll, nextInterval);
        }
      } catch (error) {
        setState(prev => ({ ...prev, lastError: error }));

        // 检查是否达到最大重试次数
        if (consecutiveErrorsRef.current >= opts.maxRetries) {
          opts.onMaxRetriesReached(error);
          stopPolling();
          return;
        }

        // 计算重试间隔
        const retryInterval = calculateNextInterval(state.attempt + 1, true);
        setState(prev => ({ ...prev, currentInterval: retryInterval }));

        // 调度重试
        if (!abortControllerRef.current?.signal.aborted) {
          timeoutRef.current = setTimeout(poll, retryInterval);
        }
      }
    };

    // 立即开始第一次轮询
    poll();
  }, [state.isPolling, state.attempt, opts, executePoll, calculateNextInterval]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({ ...prev, isPolling: false }));
    opts.onStop();
  }, [opts]);

  // 重置轮询状态
  const resetPolling = useCallback(() => {
    stopPolling();
    setState({
      isPolling: false,
      attempt: 0,
      lastError: null,
      currentInterval: opts.initialInterval,
    });
    consecutiveErrorsRef.current = 0;
    successCountRef.current = 0;
  }, [stopPolling, opts.initialInterval]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    startPolling,
    stopPolling,
    resetPolling,
  };
};

/**
 * 专用于Step API的轮询Hook
 */
export const useStepPolling = (
  projectId: string,
  stepKey: string,
  getStatusFunction: () => Promise<any>,
  options: PollingOptions = {}
) => {
  const shouldContinue = useCallback((response: any) => {
    if (!response?.success || !response?.data) {
      return true; // 继续轮询直到获得有效响应
    }

    const status = response.data.status;
    return !['completed', 'error', 'cancelled'].includes(status);
  }, []);

  const enhancedOptions: PollingOptions = {
    initialInterval: 1000,
    maxInterval: 10000,
    maxRetries: 30,
    adaptiveInterval: true,
    fastInitialPolls: 5,
    onError: (error, attempt) => {
      console.warn(`Step ${stepKey} 轮询失败 (尝试 ${attempt}):`, error);
      if (attempt > 10) {
        message.warning(`步骤 ${stepKey} 状态检查遇到问题，正在重试...`);
      }
    },
    onMaxRetriesReached: (error) => {
      message.error(`步骤 ${stepKey} 状态检查失败，请刷新页面重试`);
      console.error(`Step ${stepKey} 轮询达到最大重试次数:`, error);
    },
    ...options,
  };

  return useOptimizedPolling(getStatusFunction, shouldContinue, enhancedOptions);
};

/**
 * 智能轮询间隔计算器
 */
export class PollingIntervalCalculator {
  private baseInterval: number;
  private maxInterval: number;
  private backoffMultiplier: number;
  private successCount: number = 0;
  private errorCount: number = 0;

  constructor(baseInterval = 2000, maxInterval = 30000, backoffMultiplier = 1.5) {
    this.baseInterval = baseInterval;
    this.maxInterval = maxInterval;
    this.backoffMultiplier = backoffMultiplier;
  }

  onSuccess(): number {
    this.successCount++;
    this.errorCount = 0;

    // 连续成功后适当增加间隔
    if (this.successCount > 10) {
      return Math.min(this.baseInterval * 2, this.maxInterval);
    }
    
    return this.baseInterval;
  }

  onError(): number {
    this.errorCount++;
    this.successCount = 0;

    // 指数退避
    const backoffInterval = this.baseInterval * Math.pow(this.backoffMultiplier, this.errorCount - 1);
    return Math.min(backoffInterval, this.maxInterval);
  }

  reset(): void {
    this.successCount = 0;
    this.errorCount = 0;
  }
}

export default useOptimizedPolling;
