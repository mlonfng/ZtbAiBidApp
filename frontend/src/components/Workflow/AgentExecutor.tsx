import React, { useState } from 'react';
import { Card, List, Avatar, Badge, Button, Progress, Typography, Space, Tag, Tooltip, Modal } from 'antd';
import {
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import { Agent } from '../../store/slices/agentSlice';

const { Text, Title } = Typography;

interface WorkflowStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  agents: string[];
  estimatedTime: number;
}

interface AgentExecutorProps {
  currentStep?: WorkflowStep;
  agents: Agent[];
  workflowStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

const AgentExecutor: React.FC<AgentExecutorProps> = ({
  currentStep,
  agents,
  workflowStatus,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentDetailVisible, setAgentDetailVisible] = useState(false);

  // 获取当前步骤的Agent
  const getCurrentStepAgents = () => {
    if (!currentStep) return [];
    
    return currentStep.agents.map(agentKey => {
      const agent = agents.find(a => a.id === agentKey);
      return agent || {
        id: agentKey,
        name: getAgentDisplayName(agentKey),
        type: agentKey,
        description: '暂无描述',
        status: 'inactive' as const,
        config: {},
        performance: {
          tasksCompleted: 0,
          averageTime: 0,
          successRate: 0,
          lastActive: '',
        },
        logs: [],
      };
    });
  };

  const getAgentDisplayName = (agentKey: string) => {
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

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'busy':
        return '#faad14';
      case 'error':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const getAgentStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'busy':
        return '忙碌';
      case 'error':
        return '错误';
      case 'inactive':
        return '离线';
      default:
        return '未知';
    }
  };

  const handleAgentAction = (agent: Agent, action: 'start' | 'pause' | 'stop') => {
    console.log(`Agent ${agent.name} - ${action}`);
    // TODO: 实现Agent控制逻辑
  };

  const handleViewAgentDetail = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDetailVisible(true);
  };

  const currentStepAgents = getCurrentStepAgents();

  return (
    <>
      <Card
        title={
          <Space>
            <RobotOutlined />
            <span>Agent执行器</span>
            {currentStep && (
              <Tag color="blue">{currentStep.title}</Tag>
            )}
          </Space>
        }
        extra={
          currentStep && (
            <Text type="secondary">
              {currentStepAgents.length} 个Agent
            </Text>
          )
        }
      >
        {!currentStep ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 0' 
          }}>
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>请先开始工作流程</div>
          </div>
        ) : (
          <List
            dataSource={currentStepAgents}
            renderItem={(agent) => (
              <List.Item
                actions={[
                  <Tooltip title="查看详情">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewAgentDetail(agent)}
                    />
                  </Tooltip>,
                  <Tooltip title="配置">
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={() => console.log('配置Agent', agent.name)}
                    />
                  </Tooltip>,
                  workflowStatus === 'running' ? (
                    <Tooltip title="暂停">
                      <Button
                        type="text"
                        icon={<PauseCircleOutlined />}
                        onClick={() => handleAgentAction(agent, 'pause')}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="启动">
                      <Button
                        type="text"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleAgentAction(agent, 'start')}
                        disabled={workflowStatus === 'error' || workflowStatus === 'completed' || workflowStatus === 'paused'}
                      />
                    </Tooltip>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge
                      dot
                      color={getAgentStatusColor(agent.status)}
                      offset={[-5, 5]}
                    >
                      <Avatar
                        icon={<RobotOutlined />}
                        style={{
                          backgroundColor: getAgentStatusColor(agent.status),
                        }}
                      />
                    </Badge>
                  }
                  title={
                    <Space>
                      <span>{agent.name}</span>
                      <Tag
                        color={getAgentStatusColor(agent.status)}
                       
                      >
                        {getAgentStatusText(agent.status)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        {agent.description}
                      </Text>
                      
                      {/* Agent性能指标 */}
                      <Space size="large">
                        <div>
                          <Text style={{ fontSize: 12, color: '#666' }}>完成任务:</Text>
                          <Text strong style={{ marginLeft: 4 }}>
                            {agent.performance.tasksCompleted}
                          </Text>
                        </div>
                        <div>
                          <Text style={{ fontSize: 12, color: '#666' }}>成功率:</Text>
                          <Text strong style={{ marginLeft: 4 }}>
                            {agent.performance.successRate}%
                          </Text>
                        </div>
                        <div>
                          <Text style={{ fontSize: 12, color: '#666' }}>平均时间:</Text>
                          <Text strong style={{ marginLeft: 4 }}>
                            {agent.performance.averageTime}s
                          </Text>
                        </div>
                      </Space>
                      
                      {/* 模拟执行进度 */}
                      {workflowStatus === 'running' && agent.status === 'busy' && (
                        <Progress
                          percent={Math.floor(Math.random() * 100)}
                          size="small"
                          style={{ marginTop: 8 }}
                          strokeColor="#1890ff"
                        />
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Agent详情模态框 */}
      <Modal
        title={
          <Space>
            <RobotOutlined />
            <span>{selectedAgent?.name}</span>
            <Tag color={getAgentStatusColor(selectedAgent?.status || 'inactive')}>
              {getAgentStatusText(selectedAgent?.status || 'inactive')}
            </Tag>
          </Space>
        }
        open={agentDetailVisible}
        onCancel={() => {
          setAgentDetailVisible(false);
          setSelectedAgent(null);
        }}
        footer={[
          <Button key="close" onClick={() => setAgentDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedAgent && (
          <div>
            {/* 基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>基本信息</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Agent类型:</Text>
                  <Text style={{ marginLeft: 8 }}>{selectedAgent.type}</Text>
                </div>
                <div>
                  <Text strong>描述:</Text>
                  <Text style={{ marginLeft: 8 }}>{selectedAgent.description}</Text>
                </div>
                <div>
                  <Text strong>最后活跃:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {selectedAgent.performance.lastActive || '从未活跃'}
                  </Text>
                </div>
              </Space>
            </div>

            {/* 性能指标 */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>性能指标</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>完成任务数:</Text>
                  <Text strong>{selectedAgent.performance.tasksCompleted}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>平均执行时间:</Text>
                  <Text strong>{selectedAgent.performance.averageTime}秒</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>成功率:</Text>
                  <Text strong>{selectedAgent.performance.successRate}%</Text>
                </div>
              </Space>
              
              <Progress
                percent={selectedAgent.performance.successRate}
                strokeColor="#52c41a"
                style={{ marginTop: 16 }}
              />
            </div>

            {/* 配置信息 */}
            <div>
              <Title level={5}>配置信息</Title>
              <div style={{ 
                background: '#f5f5f5', 
                padding: 12, 
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                {Object.keys(selectedAgent.config).length > 0 ? (
                  <pre>{JSON.stringify(selectedAgent.config, null, 2)}</pre>
                ) : (
                  <Text type="secondary">暂无配置信息</Text>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AgentExecutor;
