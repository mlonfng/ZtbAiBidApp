import React from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Typography, Space, Tag } from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import { Agent } from '../../store/slices/agentSlice';

const { Text, Title } = Typography;

interface AgentOverviewProps {
  agents: Agent[];
}

const AgentOverview: React.FC<AgentOverviewProps> = ({ agents }) => {
  // 确保 agents 是数组
  const safeAgents = Array.isArray(agents) ? agents : [];

  // 计算统计数据
  const getStatistics = () => {
    const totalAgents = safeAgents.length;
    const activeAgents = safeAgents.filter(agent => agent.status === 'active').length;
    const busyAgents = safeAgents.filter(agent => agent.status === 'busy').length;
    const errorAgents = safeAgents.filter(agent => agent.status === 'error').length;
    const inactiveAgents = safeAgents.filter(agent => agent.status === 'inactive').length;

    const totalTasks = safeAgents.reduce((sum, agent) => sum + agent.performance.tasksCompleted, 0);
    const avgSuccessRate = safeAgents.length > 0
      ? Math.round(safeAgents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / safeAgents.length)
      : 0;
    const avgResponseTime = safeAgents.length > 0
      ? Math.round(safeAgents.reduce((sum, agent) => sum + agent.performance.averageTime, 0) / safeAgents.length)
      : 0;

    return {
      totalAgents,
      activeAgents,
      busyAgents,
      errorAgents,
      inactiveAgents,
      totalTasks,
      avgSuccessRate,
      avgResponseTime,
    };
  };

  const stats = getStatistics();

  // 获取Agent状态颜色
  const getStatusColor = (status: string) => {
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

  // 获取Agent状态文本
  const getStatusText = (status: string) => {
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

  // 获取Agent类型显示名称
  const getAgentTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
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
    return typeNames[type] || type;
  };

  // 获取性能最佳的Agent
  const getTopPerformingAgents = () => {
    return safeAgents
      .filter(agent => agent.performance.tasksCompleted > 0)
      .sort((a, b) => b.performance.successRate - a.performance.successRate)
      .slice(0, 5);
  };

  const topAgents = getTopPerformingAgents();

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总Agent数"
              value={stats.totalAgents}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃Agent"
              value={stats.activeAgents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="忙碌Agent"
              value={stats.busyAgents}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="异常Agent"
              value={stats.errorAgents}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总完成任务"
              value={stats.totalTasks}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均成功率"
              value={stats.avgSuccessRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={stats.avgResponseTime}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="系统健康度"
              value={Math.round((stats.activeAgents / Math.max(stats.totalAgents, 1)) * 100)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ 
                color: stats.activeAgents / Math.max(stats.totalAgents, 1) > 0.8 ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Agent状态分布 */}
        <Col xs={24} lg={12}>
          <Card title="Agent状态分布">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>活跃</Text>
                <Text>{stats.activeAgents}/{stats.totalAgents}</Text>
              </div>
              <Progress
                percent={Math.round((stats.activeAgents / Math.max(stats.totalAgents, 1)) * 100)}
                strokeColor="#52c41a"
                trailColor="#f0f0f0"
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>忙碌</Text>
                <Text>{stats.busyAgents}/{stats.totalAgents}</Text>
              </div>
              <Progress
                percent={Math.round((stats.busyAgents / Math.max(stats.totalAgents, 1)) * 100)}
                strokeColor="#faad14"
                trailColor="#f0f0f0"
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>异常</Text>
                <Text>{stats.errorAgents}/{stats.totalAgents}</Text>
              </div>
              <Progress
                percent={Math.round((stats.errorAgents / Math.max(stats.totalAgents, 1)) * 100)}
                strokeColor="#ff4d4f"
                trailColor="#f0f0f0"
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>离线</Text>
                <Text>{stats.inactiveAgents}/{stats.totalAgents}</Text>
              </div>
              <Progress
                percent={Math.round((stats.inactiveAgents / Math.max(stats.totalAgents, 1)) * 100)}
                strokeColor="#d9d9d9"
                trailColor="#f0f0f0"
              />
            </div>
          </Card>
        </Col>

        {/* 性能最佳Agent */}
        <Col xs={24} lg={12}>
          <Card title="性能最佳Agent" extra={<Text type="secondary">按成功率排序</Text>}>
            {topAgents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                <RobotOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>暂无性能数据</div>
              </div>
            ) : (
              <List
                dataSource={topAgents}
                renderItem={(agent, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: 'relative' }}>
                          <Avatar
                            icon={<RobotOutlined />}
                            style={{ backgroundColor: getStatusColor(agent.status) }}
                          />
                          {index < 3 && (
                            <div style={{
                              position: 'absolute',
                              top: -5,
                              right: -5,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              color: '#fff',
                              fontWeight: 'bold',
                            }}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                      }
                      title={
                        <Space>
                          <span>{getAgentTypeName(agent.type)}</span>
                          <Tag color={getStatusColor(agent.status)}>
                            {getStatusText(agent.status)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <div>
                            <Text style={{ fontSize: 12, color: '#666' }}>成功率:</Text>
                            <Text strong style={{ marginLeft: 4, color: '#52c41a' }}>
                              {agent.performance.successRate}%
                            </Text>
                          </div>
                          <div>
                            <Text style={{ fontSize: 12, color: '#666' }}>完成任务:</Text>
                            <Text strong style={{ marginLeft: 4 }}>
                              {agent.performance.tasksCompleted}
                            </Text>
                          </div>
                          <div>
                            <Text style={{ fontSize: 12, color: '#666' }}>平均时间:</Text>
                            <Text strong style={{ marginLeft: 4 }}>
                              {agent.performance.averageTime}ms
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AgentOverview;
