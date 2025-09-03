import React, { useState, useEffect } from 'react';
import { Layout, Steps, Card, Button, Progress, Typography, Space, Alert, Spin } from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
import WorkflowSteps from './WorkflowSteps';
import TaskMonitor from './TaskMonitor';
import AgentExecutor from './AgentExecutor';
import ProgressTracker from './ProgressTracker';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

interface WorkflowManagerProps {
  projectId: string;
}

// 工作流程步骤定义
const WORKFLOW_STEPS = [
  {
    key: 'preparation',
    title: '准备阶段',
    description: '项目信息收集和需求分析',
    icon: <FileTextOutlined />,
    agents: ['requirement_analyzer', 'document_analyzer'],
    estimatedTime: 10,
  },
  {
    key: 'content_generation',
    title: '内容生成',
    description: 'AI生成投标文件内容',
    icon: <RobotOutlined />,
    agents: ['content_generator', 'technical_writer', 'business_analyst'],
    estimatedTime: 30,
  },
  {
    key: 'design_layout',
    title: '设计排版',
    description: '文档设计和页面布局',
    icon: <EditOutlined />,
    agents: ['multimedia_creator', 'layout_designer'],
    estimatedTime: 20,
  },
  {
    key: 'review_optimization',
    title: '审核优化',
    description: '内容审核和质量优化',
    icon: <CheckCircleOutlined />,
    agents: ['quality_controller', 'compliance_checker'],
    estimatedTime: 15,
  },
  {
    key: 'finalization',
    title: '最终输出',
    description: '文档生成和格式输出',
    icon: <ExportOutlined />,
    agents: ['document_generator'],
    estimatedTime: 5,
  },
];

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({});
  const [executionLog, setExecutionLog] = useState<any[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  const { currentProject } = useAppSelector(state => state.project);
  const { agents } = useAppSelector(state => state.agent);

  useEffect(() => {
    // 计算预估剩余时间
    const totalTime = WORKFLOW_STEPS.reduce((sum, step, index) => {
      if (index >= currentStep) {
        const progress = stepProgress[step.key] || 0;
        return sum + (step.estimatedTime * (100 - progress) / 100);
      }
      return sum;
    }, 0);
    setEstimatedTimeRemaining(totalTime);
  }, [currentStep, stepProgress]);

  const handleStartWorkflow = async () => {
    setWorkflowStatus('running');
    setCurrentStep(0);
    setStepProgress({});
    setExecutionLog([]);
    
    // 开始执行工作流程
    await executeWorkflowStep(0);
  };

  const handlePauseWorkflow = () => {
    setWorkflowStatus('paused');
  };

  const handleResumeWorkflow = () => {
    setWorkflowStatus('running');
  };

  const handleStopWorkflow = () => {
    setWorkflowStatus('idle');
    setCurrentStep(0);
    setStepProgress({});
  };

  const executeWorkflowStep = async (stepIndex: number) => {
    if (stepIndex >= WORKFLOW_STEPS.length) {
      setWorkflowStatus('completed');
      return;
    }

    const step = WORKFLOW_STEPS[stepIndex];
    setCurrentStep(stepIndex);
    
    // 模拟步骤执行
    for (let progress = 0; progress <= 100; progress += 10) {
      if (workflowStatus === 'paused') {
        return;
      }
      
      setStepProgress(prev => ({
        ...prev,
        [step.key]: progress,
      }));
      
      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 添加执行日志
    setExecutionLog(prev => [...prev, {
      id: Date.now(),
      step: step.title,
      status: 'completed',
      timestamp: new Date(),
      message: `${step.title}执行完成`,
    }]);
    
    // 执行下一步
    await executeWorkflowStep(stepIndex + 1);
  };

  const getOverallProgress = () => {
    const completedSteps = Object.keys(stepProgress).filter(key => stepProgress[key] === 100).length;
    const currentStepProgress = stepProgress[WORKFLOW_STEPS[currentStep]?.key] || 0;
    return Math.round((completedSteps * 100 + currentStepProgress) / WORKFLOW_STEPS.length);
  };

  const getStatusColor = () => {
    switch (workflowStatus) {
      case 'running':
        return '#1890ff';
      case 'completed':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'paused':
        return '#faad14';
      default:
        return '#d9d9d9';
    }
  };

  const getStatusText = () => {
    switch (workflowStatus) {
      case 'running':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'error':
        return '执行失败';
      case 'paused':
        return '已暂停';
      default:
        return '未开始';
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 工作流程头部 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              投标文件生成工作流程
            </Title>
            <Text type="secondary">
              项目: {currentProject?.name} | 状态: {getStatusText()}
            </Text>
          </div>
          
          <Space>
            {workflowStatus === 'idle' && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartWorkflow}
                size="large"
              >
                开始执行
              </Button>
            )}
            
            {workflowStatus === 'running' && (
              <Button
                icon={<PauseCircleOutlined />}
                onClick={handlePauseWorkflow}
              >
                暂停
              </Button>
            )}
            
            {workflowStatus === 'paused' && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleResumeWorkflow}
              >
                继续
              </Button>
            )}
            
            {(workflowStatus === 'running' || workflowStatus === 'paused') && (
              <Button
                danger
                icon={<ReloadOutlined />}
                onClick={handleStopWorkflow}
              >
                停止
              </Button>
            )}
          </Space>
        </div>
        
        {/* 总体进度 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>总体进度</Text>
            <Text>{getOverallProgress()}%</Text>
          </div>
          <Progress
            percent={getOverallProgress()}
            strokeColor={getStatusColor()}
            status={workflowStatus === 'error' ? 'exception' : undefined}
          />
          
          {estimatedTimeRemaining > 0 && workflowStatus === 'running' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              预计剩余时间: {estimatedTimeRemaining} 分钟
            </Text>
          )}
        </div>
      </Card>

      <Layout style={{ background: 'transparent' }}>
        {/* 左侧步骤面板 */}
        <Sider width={400} style={{ background: 'transparent' }}>
          <WorkflowSteps
            steps={WORKFLOW_STEPS}
            currentStep={currentStep}
            stepProgress={stepProgress}
            workflowStatus={workflowStatus}
          />
        </Sider>

        {/* 右侧监控面板 */}
        <Content style={{ marginLeft: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 进度跟踪 */}
            <ProgressTracker
              steps={WORKFLOW_STEPS}
              currentStep={currentStep}
              stepProgress={stepProgress}
              executionLog={executionLog}
            />
            
            {/* Agent执行器 */}
            <AgentExecutor
              currentStep={WORKFLOW_STEPS[currentStep]}
              agents={agents}
              workflowStatus={workflowStatus}
            />
            
            {/* 任务监控 */}
            <TaskMonitor
              executionLog={executionLog}
              workflowStatus={workflowStatus}
            />
          </div>
        </Content>
      </Layout>
    </div>
  );
};

export default WorkflowManager;
