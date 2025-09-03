import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ArrowRightOutlined, HomeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { checkStepAccess, validateStepTransition } from '../../utils/stepAccessControl';

// 工作流步骤定义
const WORKFLOW_STEPS = [
  { key: 'service-mode', title: '服务模式选择' },
  { key: 'bid-analysis', title: '招标文件分析' },
  { key: 'file-formatting', title: '文件格式化' },
  { key: 'material-management', title: '资料管理' },
  { key: 'framework-generation', title: '框架生成' },
  { key: 'content-generation', title: '内容生成' },
  { key: 'format-config', title: '格式配置' },
  { key: 'document-export', title: '文档导出' },
];

interface ProjectStepNavigationProps {
  projectId?: string;
  currentStep: string;
  canProceed?: boolean;
  strictMode?: boolean; // 新增：是否启用严格模式
  showAccessWarning?: boolean; // 新增：是否显示访问警告
  onPrevStep?: () => void;
  onNextStep?: () => void;
  style?: React.CSSProperties;
}

const ProjectStepNavigation: React.FC<ProjectStepNavigationProps> = ({
  projectId,
  currentStep,
  canProceed = true,
  strictMode = false,
  showAccessWarning = true,
  onPrevStep,
  onNextStep,
  style
}) => {
  const navigate = useNavigate();
  const [actualCanProceed, setActualCanProceed] = useState(canProceed);
  const [accessWarning, setAccessWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取当前步骤索引
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.key === currentStep);
  const prevStep = currentStepIndex > 0 ? WORKFLOW_STEPS[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[currentStepIndex + 1] : null;

  // 严格模式下检查步骤访问权限
  useEffect(() => {
    if (strictMode && projectId) {
      setLoading(true);
      checkStepAccess(projectId, currentStep)
        .then(result => {
          if (!result.canAccess) {
            setAccessWarning(result.reason || '无法访问当前步骤');
            setActualCanProceed(false);
          } else {
            setAccessWarning(null);
            setActualCanProceed(canProceed);
          }
        })
        .catch(error => {
          console.error('检查步骤访问权限失败:', error);
          // 在严格模式下如果API调用失败，降级到非严格模式
          console.warn('严格模式检查失败，降级到非严格模式');
          setAccessWarning(null);
          setActualCanProceed(canProceed);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setActualCanProceed(canProceed);
      setAccessWarning(null);
    }
  }, [projectId, currentStep, canProceed, strictMode]);

  const handlePrevStep = () => {
    if (onPrevStep) {
      onPrevStep();
    } else if (projectId && prevStep) {
      navigate(`/projects/${projectId}/step/${prevStep.key}`);
    }
  };

  const handleNextStep = async () => {
    if (onNextStep) {
      onNextStep();
      return;
    }

    if (!projectId) return;

    // 严格模式下验证步骤跳转
    if (strictMode && nextStep) {
      try {
        const isValid = await validateStepTransition(projectId, currentStep, nextStep.key, showAccessWarning);
        if (!isValid) {
          return;
        }
      } catch (error) {
        console.error('步骤跳转验证失败:', error);
        console.warn('跳转验证失败，允许继续（降级处理）');
        // 在验证失败时，仍然允许跳转（降级处理）
      }
    }

    if (nextStep) {
      navigate(`/projects/${projectId}/step/${nextStep.key}`);
    } else if (currentStepIndex === WORKFLOW_STEPS.length - 1) {
      // 最后一步，跳转到项目编辑页面
      navigate(`/projects/${projectId}/edit`);
    }
  };

  const handleBackToProject = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/workflow`);
    } else {
      navigate('/projects');
    }
  };

  // 如果不在项目流程中，不显示导航
  if (!projectId) {
    return null;
  }

  return (
    <Card style={{ marginTop: 24, ...style }}>
      {/* 访问警告提示 */}
      {accessWarning && showAccessWarning && (
        <Alert
          message="步骤访问受限"
          description={accessWarning}
          type="warning"
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {/* 进度提示 */}
      {!actualCanProceed && !accessWarning && (
        <Alert
          message="请完成当前步骤"
          description="完成当前步骤的必要操作后，下一步按钮将自动启用"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          icon={<HomeOutlined />}
          onClick={handleBackToProject}
        >
          返回项目操作页面
        </Button>

        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handlePrevStep}
            disabled={!prevStep || loading}
            loading={loading}
          >
            {prevStep ? `上一步：${prevStep.title}` : '上一步'}
          </Button>

          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleNextStep}
            disabled={!actualCanProceed || (!nextStep && currentStepIndex !== WORKFLOW_STEPS.length - 1) || loading}
            loading={loading}
          >
            {nextStep ? `下一步：${nextStep.title}` : currentStepIndex === WORKFLOW_STEPS.length - 1 ? '完成项目' : '下一步'}
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default ProjectStepNavigation;
