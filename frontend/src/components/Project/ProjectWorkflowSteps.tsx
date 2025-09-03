import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Steps,
  Button,
  Space,
  Typography,
  Progress,
  Alert,
  Spin,
  Result,
  Divider,
  Tag,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  BuildOutlined,
  EditOutlined,
  FormatPainterOutlined,
  ExportOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
import { getProject, fetchProjectProgress } from '../../store/slices/projectSlice';
import './ProjectWorkflowSteps.css';

const { Title, Text } = Typography;

// 定义工作流步骤（完全基于后端模块）
const WORKFLOW_STEPS = [
  {
    key: 'service-mode',
    title: '服务模式选择',
    description: '选择免费模式、AI智能模式或人工模式',
    icon: <SettingOutlined />,
    route: '/service-mode',
    required: true,
  },
  {
    key: 'bid-analysis',
    title: '招标文件分析',
    description: '智能分析招标文件，提取关键信息',
    icon: <FileSearchOutlined />,
    route: '/bid-analysis',
    required: true,
  },
  {
    key: 'file-formatting',
    title: '投标文件初始化',
    description: '文件格式检测、转换、HTML生成',
    icon: <FileTextOutlined />,
    route: '/file-formatting',
    required: true,
  },
  {
    key: 'material-management',
    title: '用户上传资料管理',
    description: '资料需求分析、文件上传管理',
    icon: <FolderOpenOutlined />,
    route: '/material-management',
    required: true,
  },
  {
    key: 'framework-generation',
    title: '框架生成',
    description: '投标文件框架生成、模板管理',
    icon: <BuildOutlined />,
    route: '/framework-generation',
    required: true,
  },
  {
    key: 'content-generation',
    title: '内容生成',
    description: '技术方案、商务方案内容生成',
    icon: <EditOutlined />,
    route: '/content-generation',
    required: true,
  },
  {
    key: 'format-config',
    title: '格式配置',
    description: '样式配置、CSS生成、格式管理',
    icon: <FormatPainterOutlined />,
    route: '/format-config',
    required: true,
  },
  {
    key: 'document-export',
    title: '文档导出',
    description: 'DOCX、PDF、HTML文档导出',
    icon: <ExportOutlined />,
    route: '/document-export',
    required: true,
  },
];

interface ProjectWorkflowStepsProps {
  projectId: string;
  currentStep?: string;
}

const ProjectWorkflowSteps: React.FC<ProjectWorkflowStepsProps> = ({ 
  projectId, 
  currentStep = 'service-mode' 
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentProject, loading, error } = useAppSelector(state => state.project);
  
  const [stepStatuses, setStepStatuses] = useState<Record<string, 'wait' | 'process' | 'finish' | 'error'>>({});
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [projectProgress, setProjectProgress] = useState<any>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // 获取当前步骤索引
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.key === currentStep);

  // 状态颜色映射
  const getStepTitleStyle = (status: string) => {
    const baseStyle = { fontWeight: 500 };

    switch (status) {
      case 'completed':
        return { ...baseStyle, color: '#52c41a' }; // 绿色
      case 'in_progress':
        return { ...baseStyle, color: '#1890ff' }; // 蓝色
      case 'error':
        return { ...baseStyle, color: '#ff4d4f' }; // 红色
      case 'pending':
      default:
        return { ...baseStyle, color: '#8c8c8c' }; // 灰色
    }
  };

  // 状态标签显示
  const getStatusTag = (status: string) => {
    const statusConfig = {
      completed: { color: 'success', text: '已完成' },
      in_progress: { color: 'processing', text: '进行中' },
      error: { color: 'error', text: '错误' },
      pending: { color: 'default', text: '待开始' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 初始化默认步骤状态（清除所有模拟数据，所有步骤默认为待开始状态）
  const initializeDefaultStepStatuses = useCallback(() => {
    console.log('🔄 [DEBUG] Initializing default step statuses - all steps to wait state');
    const initialStatuses: Record<string, 'wait' | 'process' | 'finish' | 'error'> = {};
    const initialProgress: Record<string, number> = {};

    // 所有步骤默认为待开始状态，不基于currentStepIndex做任何假设
    WORKFLOW_STEPS.forEach((step) => {
      initialStatuses[step.key] = 'wait';
      initialProgress[step.key] = 0;
    });

    setStepStatuses(initialStatuses);
    setStepProgress(initialProgress);
    setOverallProgress(0); // 总体进度也设为0

    console.log('✅ [DEBUG] Default step statuses initialized:', initialStatuses);
  }, []);

  // 加载项目进展状态
  const loadProjectProgress = useCallback(async () => {
    if (!projectId) return;

    console.log('🔄 [DEBUG] loadProjectProgress called for project:', projectId);
    setProgressLoading(true);
    setProgressError(null);

    try {
      console.log('🔄 [DEBUG] Calling fetchProjectProgress...');
      const result = await dispatch(fetchProjectProgress(projectId)).unwrap();
      console.log('✅ [DEBUG] fetchProjectProgress result:', result);
      setProjectProgress(result);

      // 更新步骤状态基于实际进展
      const newStepStatuses: Record<string, 'wait' | 'process' | 'finish' | 'error'> = {};
      const newStepProgress: Record<string, number> = {};

      WORKFLOW_STEPS.forEach((step) => {
        const stepData = result.steps.find((s: any) => s.step_key === step.key);
        if (stepData) {
          switch (stepData.status) {
            case 'completed':
              newStepStatuses[step.key] = 'finish';
              newStepProgress[step.key] = 100;
              break;
            case 'in_progress':
              newStepStatuses[step.key] = 'process';
              newStepProgress[step.key] = stepData.progress || 0;
              break;
            case 'error':
              newStepStatuses[step.key] = 'error';
              newStepProgress[step.key] = stepData.progress || 0;
              break;
            case 'pending':
            default:
              newStepStatuses[step.key] = 'wait';
              newStepProgress[step.key] = 0;
              break;
          }
        } else {
          newStepStatuses[step.key] = 'wait';
          newStepProgress[step.key] = 0;
        }
      });

      setStepStatuses(newStepStatuses);
      setStepProgress(newStepProgress);
      setOverallProgress(result.total_progress || 0);

    } catch (error: any) {
      console.error('加载项目进展失败:', error);
      setProgressError(error || '加载项目进展失败');
      // 如果加载失败，使用默认逻辑
      initializeDefaultStepStatuses();
    } finally {
      setProgressLoading(false);
    }
  }, [dispatch, projectId, initializeDefaultStepStatuses]);

  // useEffect: 加载项目信息和进展状态
  useEffect(() => {
    if (projectId) {
      console.log('🔄 [DEBUG] Loading project and progress for ID:', projectId);
      dispatch(getProject(projectId));
      loadProjectProgress();
    }
  }, [dispatch, projectId, loadProjectProgress]);

  // 只在组件初始化时设置默认状态，不依赖currentStepIndex
  useEffect(() => {
    if (!projectProgress && !progressLoading) {
      console.log('🔄 [DEBUG] No project progress data, initializing default states');
      initializeDefaultStepStatuses();
    }
  }, [projectProgress, progressLoading, initializeDefaultStepStatuses]);

  // 跳转到指定步骤
  const handleStepClick = (stepKey: string) => {
    const stepIndex = WORKFLOW_STEPS.findIndex(step => step.key === stepKey);

    // 如果有项目进展数据，基于实际状态判断
    if (projectProgress) {
      const stepData = projectProgress.steps.find((s: any) => s.step_key === stepKey);
      if (stepData && (stepData.status === 'completed' || stepData.status === 'in_progress')) {
        navigate(`/projects/${projectId}/step/${stepKey}`);
        return;
      }

      // 检查是否可以开始这个步骤（前面的步骤都已完成）
      const canStart = WORKFLOW_STEPS.slice(0, stepIndex).every(prevStep => {
        const prevStepData = projectProgress.steps.find((s: any) => s.step_key === prevStep.key);
        return prevStepData && prevStepData.status === 'completed';
      });

      if (canStart) {
        navigate(`/projects/${projectId}/step/${stepKey}`);
      } else {
        message.warning('请按顺序完成前面的步骤');
      }
    } else {
      // 没有项目进展数据时，允许访问第一步，其他步骤需要按顺序
      if (stepIndex === 0) {
        // 总是允许访问第一步
        navigate(`/projects/${projectId}/step/${stepKey}`);
      } else {
        message.warning('请先完成前面的步骤');
      }
    }
  };

  // 下一步
  const handleNextStep = () => {
    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      const nextStep = WORKFLOW_STEPS[currentStepIndex + 1];
      navigate(`/projects/${projectId}/step/${nextStep.key}`);
    } else {
      message.success('所有步骤已完成！');
      navigate(`/projects/${projectId}/edit`);
    }
  };

  // 上一步
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = WORKFLOW_STEPS[currentStepIndex - 1];
      navigate(`/projects/${projectId}/step/${prevStep.key}`);
    } else {
      navigate('/projects');
    }
  };

  // 返回项目列表
  const handleBackToProjects = () => {
    navigate('/projects');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载项目信息...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="项目加载失败"
        subTitle={error}
        extra={
          <Button type="primary" onClick={handleBackToProjects}>
            返回项目列表
          </Button>
        }
      />
    );
  }

  if (!currentProject) {
    return (
      <Result
        status="404"
        title="项目不存在"
        subTitle="请检查项目ID是否正确"
        extra={
          <Button type="primary" onClick={handleBackToProjects}>
            返回项目列表
          </Button>
        }
      />
    );
  }

  const currentStepInfo = WORKFLOW_STEPS[currentStepIndex];

  return (
    <div style={{ padding: 24 }}>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToProjects}
              style={{ marginBottom: 16 }}
            >
              返回项目列表
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {currentProject.name}
            </Title>
            <Text type="secondary">项目ID: {projectId}</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>总体进度</Text>
            </div>
            <Progress
              type="circle"
              percent={overallProgress}
              size={80}
              format={percent => `${percent}%`}
            />
          </div>
        </div>
      </Card>

      {/* 步骤导航 */}
      <Card style={{ marginBottom: 24 }} loading={progressLoading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            投标文件制作流程
          </Title>
          {projectProgress && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary">总体进度:</Text>
              <Progress
                percent={overallProgress}
                size="small"
                style={{ width: 100 }}
                status={overallProgress === 100 ? 'success' : 'active'}
              />
              <Text strong>{overallProgress}%</Text>
            </div>
          )}
        </div>

        {/* API调用失败的错误提示 */}
        {progressError && (
          <Alert
            message="步骤状态加载失败"
            description={`无法获取项目进展信息：${progressError}。请检查网络连接或刷新页面重试。`}
            type="warning"
            showIcon
            action={
              <Button size="small" onClick={loadProjectProgress} loading={progressLoading}>
                重试
              </Button>
            }
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setProgressError(null)}
          />
        )}

        <Steps
          current={currentStepIndex}
          direction="horizontal"
          size="small"
          className="workflow-steps"
          items={WORKFLOW_STEPS.map((step, index) => {
            const stepData = projectProgress?.steps.find((s: any) => s.step_key === step.key);
            const status = stepData?.status || 'pending';
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in_progress';
            const isError = status === 'error';
            const canClick = isCompleted || isInProgress || (projectProgress &&
              WORKFLOW_STEPS.slice(0, index).every(prevStep => {
                const prevStepData = projectProgress.steps.find((s: any) => s.step_key === prevStep.key);
                return prevStepData && prevStepData.status === 'completed';
              })
            );

            return {
              title: (
                <div style={{ cursor: canClick ? 'pointer' : 'default' }}>
                  {/* 步骤标题，使用颜色区分状态 */}
                  <div style={getStepTitleStyle(status)}>
                    {step.title}
                  </div>
                  {/* 在步骤下方添加状态标签 */}
                  <div style={{ marginTop: 4 }}>
                    {getStatusTag(status)}
                  </div>
                </div>
              ),
              description: (
                <div>
                  <div style={{ color: '#666', fontSize: 13 }}>
                    {step.description}
                  </div>
                  {/* 显示时间信息，字体稍大一些 */}
                  {stepData && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#999' }}>
                      {stepData.completed_at && (
                        <span>完成: {new Date(stepData.completed_at).toLocaleDateString()}</span>
                      )}
                      {stepData.started_at && !stepData.completed_at && (
                        <span>开始: {new Date(stepData.started_at).toLocaleDateString()}</span>
                      )}
                      {stepData.progress > 0 && stepData.progress < 100 && (
                        <div style={{ marginTop: 4 }}>
                          <Progress
                            percent={stepData.progress}
                            size="small"
                            showInfo={false}
                            status={isError ? 'exception' : 'active'}
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
              icon: step.icon,
              status: stepStatuses[step.key],
            };
          })}
          onChange={(current) => {
            const step = WORKFLOW_STEPS[current];
            if (step) {
              handleStepClick(step.key);
            }
          }}
        />

        {projectProgress && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 提示：绿色勾号表示已完成的步骤，可以点击重新进入；蓝色时钟表示正在进行的步骤；灰色表示待开始的步骤。
            </Text>
          </div>
        )}
      </Card>

      {/* 当前步骤信息 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {currentStepInfo.icon}
              {currentStepInfo.title}
            </Title>
            <Text type="secondary">{currentStepInfo.description}</Text>
          </div>
          <Tag color={stepStatuses[currentStep] === 'finish' ? 'success' : 'processing'}>
            {stepStatuses[currentStep] === 'finish' ? '已完成' : '进行中'}
          </Tag>
        </div>

        <Alert
          message="步骤说明"
          description={`当前步骤：${currentStepInfo.title}。${currentStepInfo.description}。请完成当前步骤后继续下一步。`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 步骤进度 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong>当前步骤进度</Text>
          <Progress
            percent={stepProgress[currentStep] || 0}
            status={stepStatuses[currentStep] === 'error' ? 'exception' : 'active'}
            style={{ marginTop: 8 }}
          />
        </div>

        <Divider />

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            icon={<ArrowLeftOutlined />}
          >
            上一步
          </Button>
          
          <Space>
            <Button
              type="primary"
              onClick={() => navigate(`${currentStepInfo.route}?projectId=${projectId}&from=workflow`)}
            >
              进入{currentStepInfo.title}
            </Button>
            
            <Button
              type="primary"
              onClick={handleNextStep}
              disabled={stepStatuses[currentStep] !== 'finish'}
              icon={<ArrowRightOutlined />}
            >
              {currentStepIndex === WORKFLOW_STEPS.length - 1 ? '完成' : '下一步'}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectWorkflowSteps;
