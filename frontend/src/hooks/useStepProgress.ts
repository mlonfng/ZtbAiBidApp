import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useStepPolling } from './useOptimizedPolling';

/**
 * 统一的步骤进度管理Hook
 * 提供标准化的项目步骤进度更新功能
 */
export const useStepProgress = (projectId: string, stepKey: string) => {
  const [updating, setUpdating] = useState(false);
  const [, setStatus] = useState<'pending'|'in_progress'|'completed'|'error'>('pending');
  const [, setProgressValue] = useState<number>(0);
  const pollTimer = useRef<number | null>(null);

  // 使用优化的轮询机制
  const getStepStatus = useCallback(async () => {
    if (!projectId || !stepKey) throw new Error('Missing projectId or stepKey');

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:9958';
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/step/${stepKey}/status`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json?.success && json?.data) {
      setStatus(json.data.status || 'pending');
      setProgressValue(json.data.progress ?? 0);
    }

    return json;
  }, [projectId, stepKey]);

  const pollingState = useStepPolling(
    projectId || '',
    stepKey,
    getStepStatus,
    {
      onSuccess: (response) => {
        if (response?.success && response?.data) {
          setStatus(response.data.status || 'pending');
          setProgressValue(response.data.progress ?? 0);
        }
      },
      onError: (error, attempt) => {
        if (attempt > 5) {
          console.warn(`Step ${stepKey} 状态轮询遇到问题:`, error);
        }
      }
    }
  );

  // 启动轮询的方法
  const startPolling = useCallback(() => {
    if (projectId && stepKey) {
      pollingState.startPolling();
    }
  }, [projectId, stepKey, pollingState]);

  // 停止轮询的方法
  const stopPolling = useCallback(() => {
    pollingState.stopPolling();
  }, [pollingState]);


  /**
   * 调用项目进度更新API
   */
  const updateStepProgressAPI = useCallback(async (status?: string, progress?: number, data?: any) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:9958';
      const url = `${API_BASE_URL}/api/projects/${projectId}/progress/update`;
      const body: any = { step_key: stepKey };
      if (status !== undefined && status !== null) body.status = String(status);
      if (progress !== undefined && progress !== null) body.progress = Number(progress);
      if (data !== undefined) body.data = data;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message || '更新失败');
      return result;
    } catch (error) {
      console.error('更新步骤进度失败:', error);
      throw error;
    }
  }, [projectId, stepKey]);

  /**
   * 标记步骤为进行中
   * @param progress 进度百分比 (0-100)
   * @param data 附加数据
   */
  const markStepInProgress = useCallback(async (progress: number = 0, data?: any) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return false;
    }

    try {
      setUpdating(true);
      await updateStepProgressAPI('in_progress', progress, data);
      message.success('步骤状态已更新为进行中');
      return true;
    } catch (error) {
      console.error('更新步骤状态失败:', error);
      message.error('更新步骤状态失败');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [projectId, stepKey, updateStepProgressAPI]);

  /**
   * 标记步骤为已完成
   * @param data 附加数据
   */
  const markStepCompleted = useCallback(async (data?: any) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return false;
    }

    try {
      setUpdating(true);
      await updateStepProgressAPI('completed', 100, data);
      message.success('步骤已标记为完成');
      return true;
    } catch (error) {
      console.error('更新步骤状态失败:', error);
      message.error('更新步骤状态失败');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [projectId, stepKey, updateStepProgressAPI]);

  /**
   * 标记步骤为错误状态
   * @param error 错误信息
   * @param data 附加数据
   */
  const markStepError = useCallback(async (error: string, data?: any) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return false;
    }

    try {
      setUpdating(true);
      await updateStepProgressAPI('error', 0, { ...data, error });
      message.error(`步骤执行失败: ${error}`);
      return true;
    } catch (updateError) {
      console.error('更新步骤状态失败:', updateError);
      message.error('更新步骤状态失败');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [projectId, stepKey, updateStepProgressAPI]);

  /**
   * 更新步骤进度
   * @param progress 进度百分比 (0-100)
   * @param data 附加数据
   */
  const updateProgress = useCallback(async (progress: number, data?: any) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return false;
    }

    if (progress < 0 || progress > 100) {
      message.error('进度值必须在0-100之间');
      return false;
    }

    try {
      setUpdating(true);
      await updateStepProgressAPI(undefined, progress, data);
      return true;
    } catch (error) {
      console.error('更新步骤进度失败:', error);
      message.error('更新步骤进度失败');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [projectId, stepKey, updateStepProgressAPI]);

  return {
    updating,
    markStepInProgress,
    markStepCompleted,
    markStepError,
    updateProgress,
    startPolling,
    stopPolling,
    isPolling: pollingState.isPolling,
    pollingAttempt: pollingState.attempt,
    pollingError: pollingState.lastError
  };
};

/**
 * 步骤完成标准定义
 */
export const STEP_COMPLETION_CRITERIA = {
  'service-mode': (data: any) => data?.currentMode !== null,
  'bid-analysis': (data: any) => data?.analysisResult !== null,
  'file-formatting': (data: any) => data?.formatResult !== null,
  'material-management': (data: any) => data?.materials?.length > 0,
  'framework-generation': (data: any) => data?.frameworkResult !== null,
  'content-generation': (data: any) => data?.contentSections?.some((s: any) => s.status === 'generated'),
  'format-config': (data: any) => data?.configSaved === true,
  'document-export': (data: any) => data?.exportHistory?.length > 0,
};

/**
 * 检查步骤是否满足完成条件
 * @param stepKey 步骤键
 * @param data 步骤数据
 * @returns 是否满足完成条件
 */
export const checkStepCompletionCriteria = (stepKey: string, data: any): boolean => {
  const criteria = STEP_COMPLETION_CRITERIA[stepKey as keyof typeof STEP_COMPLETION_CRITERIA];
  return criteria ? criteria(data) : false;
};
