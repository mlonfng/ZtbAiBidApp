import React from 'react';
import { Card, Progress, Row, Col, Statistic, Timeline, Typography, Space, Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface WorkflowStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  agents: string[];
  estimatedTime: number;
}

interface ExecutionLogItem {
  id: number;
  step: string;
  status: 'completed' | 'running' | 'error';
  timestamp: Date;
  message: string;
}

interface ProgressTrackerProps {
  steps: WorkflowStep[];
  currentStep: number;
  stepProgress: Record<string, number>;
  executionLog: ExecutionLogItem[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  currentStep,
  stepProgress,
  executionLog,
}) => {
  // 计算总体统计
  const getStatistics = () => {
    const totalSteps = steps.length;
    const completedSteps = Object.keys(stepProgress).filter(key => stepProgress[key] === 100).length;
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const elapsedTime = steps.slice(0, currentStep).reduce((sum, step) => sum + step.estimatedTime, 0) +
      (stepProgress[steps[currentStep]?.key] || 0) * steps[currentStep]?.estimatedTime / 100;
    
    return {
      totalSteps,
      completedSteps,
      totalTime,
      elapsedTime: Math.round(elapsedTime),
      remainingTime: Math.round(totalTime - elapsedTime),
      overallProgress: Math.round((completedSteps * 100 + (stepProgress[steps[currentStep]?.key] || 0)) / totalSteps),
    };
  };

  const stats = getStatistics();

  // 获取时间线项目
  const getTimelineItems = () => {
    const items = [];
    
    // 已完成的步骤
    steps.slice(0, currentStep).forEach((step, index) => {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>{step.title}</Text>
              <Tag color="success">已完成</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {step.description}
            </Text>
          </div>
        ),
      });
    });
    
    // 当前步骤
    if (currentStep < steps.length) {
      const currentStepData = steps[currentStep];
      const progress = stepProgress[currentStepData.key] || 0;
      
      items.push({
        dot: <SyncOutlined spin style={{ color: '#1890ff' }} />,
        color: 'blue',
        children: (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>{currentStepData.title}</Text>
              <Tag color="processing">执行中 ({progress}%)</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {currentStepData.description}
            </Text>
            <Progress
              percent={progress}
              size="small"
              style={{ marginTop: 8 }}
              strokeColor="#1890ff"
            />
          </div>
        ),
      });
    }
    
    // 待执行的步骤
    steps.slice(currentStep + 1).forEach((step, index) => {
      items.push({
        dot: <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
        color: 'gray',
        children: (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{step.title}</Text>
              <Tag color="default">待执行</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {step.description}
            </Text>
          </div>
        ),
      });
    });
    
    return items;
  };

  return (
    <Row gutter={[16, 16]}>
      {/* 统计卡片 */}
      <Col span={24}>
        <Card title="执行统计">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总体进度"
                value={stats.overallProgress}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成步骤"
                value={stats.completedSteps}
                suffix='/ ${stats.totalSteps}'
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已用时间"
                value={stats.elapsedTime}
                suffix="分钟"
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="剩余时间"
                value={stats.remainingTime}
                suffix="分钟"
                valueStyle={{ color: '#999' }}
              />
            </Col>
          </Row>
          
          {/* 总体进度条 */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>总体进度</Text>
              <Text>{stats.overallProgress}%</Text>
            </div>
            <Progress
              percent={stats.overallProgress}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              trailColor="#f0f0f0"
            />
          </div>
        </Card>
      </Col>
      
      {/* 步骤进度 */}
      <Col span={12}>
        <Card title="步骤进度" style={{ height: 400 }}>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <Timeline items={getTimelineItems()} />
          </div>
        </Card>
      </Col>
      
      {/* 执行日志 */}
      <Col span={12}>
        <Card title="执行日志" style={{ height: 400 }}>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {executionLog.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '40px 0' 
              }}>
                <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>暂无执行日志</div>
              </div>
            ) : (
              <Timeline>
                {executionLog.slice().reverse().map((log) => (
                  <Timeline.Item
                    key={log.id}
                    dot={
                      log.status === 'completed' ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : log.status === 'running' ? (
                        <SyncOutlined spin style={{ color: '#1890ff' }} />
                      ) : (
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                      )
                    }
                    color={
                      log.status === 'completed' ? 'green' :
                      log.status === 'running' ? 'blue' : 'red'
                    }
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{log.step}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {log.timestamp.toLocaleTimeString()}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {log.message}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ProgressTracker;
