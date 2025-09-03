import React from 'react';
import { Card, Steps, Progress, Typography, Space, Tag, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Step } = Steps;
const { Text, Title } = Typography;

interface WorkflowStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  agents: string[];
  estimatedTime: number;
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  currentStep: number;
  stepProgress: Record<string, number>;
  workflowStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  steps,
  currentStep,
  stepProgress,
  workflowStatus,
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return 'finish';
    } else if (stepIndex === currentStep) {
      if (workflowStatus === 'running') {
        return 'process';
      } else if (workflowStatus === 'error') {
        return 'error';
      } else {
        return 'process';
      }
    } else {
      return 'wait';
    }
  };

  const getStepIcon = (step: WorkflowStep, stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    
    if (status === 'finish') {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else if (status === 'process' && workflowStatus === 'running') {
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    } else if (status === 'error') {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    } else {
      return step.icon;
    }
  };

  const formatAgentName = (agentKey: string) => {
    const agentNames: Record<string, string> = {
      requirement_analyzer: '需求分析师',
      document_analyzer: '文档分析师',
      content_generator: '内容生成器',
      technical_writer: '技术写作师',
      business_analyst: '商务分析师',
      multimedia_creator: '多媒体创作师',
      layout_designer: '布局设计师',
      quality_controller: '质量控制师',
      compliance_checker: '合规检查师',
      document_generator: '文档生成器',
    };
    return agentNames[agentKey] || agentKey;
  };

  return (
    <Card title="执行步骤" style={{ height: 'fit-content' }}>
      <Steps
        direction="vertical"
        current={currentStep}
        status={workflowStatus === 'error' ? 'error' : undefined}
      >
        {steps.map((step, index) => {
          const progress = stepProgress[step.key] || 0;
          const status = getStepStatus(index);
          
          return (
            <Step
              key={step.key}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getStepIcon(step, index)}
                  <span>{step.title}</span>
                  {status === 'process' && workflowStatus === 'running' && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({progress}%)
                    </Text>
                  )}
                </div>
              }
              description={
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    {step.description}
                  </Text>
                  
                  {/* 进度条 */}
                  {status === 'process' && workflowStatus === 'running' && (
                    <Progress
                      percent={progress}
                      size="small"
                      style={{ marginBottom: 8 }}
                      strokeColor="#1890ff"
                    />
                  )}
                  
                  {/* Agent列表 */}
                  <div style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>执行Agent:</Text>
                    <div style={{ marginTop: 4 }}>
                      {step.agents.map(agent => (
                        <Tag
                          key={agent}
                         
                          color={status === 'finish' ? 'green' : status === 'process' ? 'blue' : 'default'}
                          style={{ marginBottom: 4 }}
                        >
                          {formatAgentName(agent)}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  
                  {/* 预估时间 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                    <Text style={{ fontSize: 12, color: '#999' }}>
                      预估时间: {step.estimatedTime} 分钟
                    </Text>
                  </div>
                  
                  {/* 步骤状态 */}
                  {status === 'finish' && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="success">已完成</Tag>
                    </div>
                  )}
                  
                  {status === 'process' && workflowStatus === 'running' && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="processing">执行中</Tag>
                    </div>
                  )}
                  
                  {status === 'process' && workflowStatus === 'paused' && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="warning">已暂停</Tag>
                    </div>
                  )}
                  
                  {status === 'error' && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="error">执行失败</Tag>
                    </div>
                  )}
                  
                  {status === 'wait' && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="default">等待执行</Tag>
                    </div>
                  )}
                </div>
              }
            />
          );
        })}
      </Steps>
      
      {/* 步骤统计 */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#fafafa', 
        borderRadius: 6 
      }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
          执行统计
        </Title>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>总步骤数:</Text>
            <Text strong>{steps.length}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>已完成:</Text>
            <Text strong style={{ color: '#52c41a' }}>
              {Object.keys(stepProgress).filter(key => stepProgress[key] === 100).length}
            </Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>当前步骤:</Text>
            <Text strong style={{ color: '#1890ff' }}>
              {currentStep + 1}
            </Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>预估总时间:</Text>
            <Text strong>
              {steps.reduce((sum, step) => sum + step.estimatedTime, 0)} 分钟
            </Text>
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default WorkflowSteps;
