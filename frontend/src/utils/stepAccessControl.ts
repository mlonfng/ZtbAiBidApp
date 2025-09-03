import { message } from 'antd';

// 工作流步骤定义（与其他组件保持一致）
export const WORKFLOW_STEPS = [
  { key: 'service-mode', title: '服务模式选择' },
  { key: 'bid-analysis', title: '招标文件分析' },
  { key: 'file-formatting', title: '文件格式化' },
  { key: 'material-management', title: '资料管理' },
  { key: 'framework-generation', title: '框架生成' },
  { key: 'content-generation', title: '内容生成' },
  { key: 'format-config', title: '格式配置' },
  { key: 'document-export', title: '文档导出' },
];

/**
 * 步骤访问结果接口
 */
export interface StepAccessResult {
  canAccess: boolean;
  reason?: string;
  missingSteps?: string[];
}

/**
 * 获取项目进度数据
 * @param projectId 项目ID
 * @returns 项目进度数据
 */
const fetchProjectProgress = async (projectId: string): Promise<any> => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:9958';
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const raw = await response.json();

    // 兼容两种返回格式：
    // 1) 直接返回进度对象 { project_id, steps, ... }
    // 2) 包装格式 { success, message, data: { project_id, steps, ... } }
    const result = (raw && typeof raw === 'object' && 'data' in raw && raw.data) ? raw.data : raw;

    // 填充缺省字段，避免前端误判
    if (result && typeof result === 'object') {
      const normalized = {
        project_id: result.project_id ?? result.projectId,
        steps: Array.isArray(result.steps) ? result.steps : [],
        current_step: result.current_step ?? result.currentStep ?? 'service-mode',
        total_progress: typeof result.total_progress === 'number' ? result.total_progress : 0,
        project_status: result.project_status ?? result.projectStatus ?? 'active'
      };
      if (typeof normalized.project_id !== 'undefined') {
        return normalized;
      }
    }
    throw new Error('API返回的数据格式不正确');
  } catch (error) {
    console.error('获取项目进度失败:', error);
    // 返回默认的进度数据，避免完全失败（降级：允许后续严格模式提示明确原因）
    return {
      project_id: projectId,
      steps: [],
      current_step: 'service-mode',
      total_progress: 0
    };
  }
};

/**
 * 检查步骤访问权限
 * @param projectId 项目ID
 * @param targetStep 目标步骤
 * @returns 访问权限检查结果
 */
export const checkStepAccess = async (
  projectId: string, 
  targetStep: string
): Promise<StepAccessResult> => {
  try {
    // 获取项目进度数据
    const progress = await fetchProjectProgress(projectId);
    
    // 查找目标步骤的索引
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.key === targetStep);
    
    if (stepIndex === -1) {
      return {
        canAccess: false,
        reason: `未知的步骤: ${targetStep}`
      };
    }
    
    // 第一步总是可以访问
    if (stepIndex === 0) {
      return { canAccess: true };
    }
    
    // 检查前面的步骤是否都已完成
    const missingSteps: string[] = [];
    
    for (let i = 0; i < stepIndex; i++) {
      const prevStep = WORKFLOW_STEPS[i];
      const prevStepData = progress.steps?.find((s: any) => s.step_key === prevStep.key);
      
      if (!prevStepData || prevStepData.status !== 'completed') {
        missingSteps.push(prevStep.title);
      }
    }
    
    if (missingSteps.length > 0) {
      return {
        canAccess: false,
        reason: `请先完成以下步骤: ${missingSteps.join('、')}`,
        missingSteps
      };
    }
    
    return { canAccess: true };
    
  } catch (error) {
    console.error('检查步骤访问权限失败:', error);
    return {
      canAccess: false,
      reason: '无法获取项目进度信息，请稍后重试'
    };
  }
};

/**
 * 检查是否可以进入下一步
 * @param projectId 项目ID
 * @param currentStep 当前步骤
 * @returns 是否可以进入下一步
 */
export const canProceedToNextStep = async (
  projectId: string, 
  currentStep: string
): Promise<boolean> => {
  try {
    const progress = await fetchProjectProgress(projectId);
    const currentStepData = progress.steps?.find((s: any) => s.step_key === currentStep);
    
    // 当前步骤必须已完成才能进入下一步
    return currentStepData?.status === 'completed';
  } catch (error) {
    console.error('检查下一步权限失败:', error);
    return false;
  }
};

/**
 * 获取下一个可访问的步骤
 * @param projectId 项目ID
 * @returns 下一个可访问的步骤，如果没有则返回null
 */
export const getNextAccessibleStep = async (projectId: string): Promise<string | null> => {
  try {
    const progress = await fetchProjectProgress(projectId);
    
    // 查找第一个未完成的步骤
    for (const step of WORKFLOW_STEPS) {
      const stepData = progress.steps?.find((s: any) => s.step_key === step.key);
      
      if (!stepData || stepData.status !== 'completed') {
        // 检查是否可以访问这个步骤
        const accessResult = await checkStepAccess(projectId, step.key);
        if (accessResult.canAccess) {
          return step.key;
        }
      }
    }
    
    return null; // 所有步骤都已完成
  } catch (error) {
    console.error('获取下一个可访问步骤失败:', error);
    return null;
  }
};

/**
 * 智能导航到合适的步骤
 * @param projectId 项目ID
 * @param navigate React Router的navigate函数
 * @param showMessage 是否显示消息提示
 */
export const smartNavigateToStep = async (
  projectId: string,
  navigate: (path: string) => void,
  showMessage: boolean = true
) => {
  try {
    const nextStep = await getNextAccessibleStep(projectId);
    
    if (nextStep) {
      navigate(`/projects/${projectId}/step/${nextStep}`);
      if (showMessage) {
        const stepTitle = WORKFLOW_STEPS.find(s => s.key === nextStep)?.title;
        message.success(`已导航到: ${stepTitle}`);
      }
    } else {
      // 所有步骤都已完成，导航到项目完成页面
      navigate(`/projects/${projectId}/edit`);
      if (showMessage) {
        message.success('所有步骤已完成！');
      }
    }
  } catch (error) {
    console.error('智能导航失败:', error);
    if (showMessage) {
      message.error('导航失败，请手动选择步骤');
    }
  }
};

/**
 * 验证步骤跳转的合法性
 * @param projectId 项目ID
 * @param fromStep 来源步骤
 * @param toStep 目标步骤
 * @param showWarning 是否显示警告消息
 * @returns 是否允许跳转
 */
export const validateStepTransition = async (
  projectId: string,
  fromStep: string,
  toStep: string,
  showWarning: boolean = true
): Promise<boolean> => {
  const accessResult = await checkStepAccess(projectId, toStep);
  
  if (!accessResult.canAccess) {
    if (showWarning && accessResult.reason) {
      message.warning(accessResult.reason);
    }
    return false;
  }
  
  return true;
};
