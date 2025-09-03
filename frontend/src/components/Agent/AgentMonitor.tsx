import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, DatePicker, Space, Typography, Empty } from 'antd';
import { Line, Column, Pie } from '@ant-design/plots';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

import { Agent } from '../../store/slices/agentSlice';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface AgentMonitorProps {
  agents: Agent[];
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ agents }) => {
  // 确保 agents 是数组
  const safeAgents = Array.isArray(agents) ? agents : [];

  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<[any, any] | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [taskData, setTaskData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

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

  // 生成模拟性能数据
  const generatePerformanceData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = time.getHours();
      
      if (selectedAgent === 'all') {
        // 所有Agent的平均性能
        data.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          successRate: Math.floor(Math.random() * 20) + 80,
          responseTime: Math.floor(Math.random() * 500) + 200,
          throughput: Math.floor(Math.random() * 50) + 20,
        });
      } else {
        // 特定Agent的性能
        const agent = safeAgents.find(a => a.id === selectedAgent);
        if (agent) {
          data.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            successRate: Math.floor(Math.random() * 10) + agent.performance.successRate - 5,
            responseTime: Math.floor(Math.random() * 100) + agent.performance.averageTime - 50,
            throughput: Math.floor(Math.random() * 20) + 10,
          });
        }
      }
    }
    
    return data;
  };

  // 生成任务统计数据
  const generateTaskData = () => {
    if (selectedAgent === 'all') {
      return safeAgents.map(agent => ({
        agent: getAgentTypeName(agent.type),
        completed: agent.performance.tasksCompleted,
        success: Math.floor(agent.performance.tasksCompleted * agent.performance.successRate / 100),
        failed: agent.performance.tasksCompleted - Math.floor(agent.performance.tasksCompleted * agent.performance.successRate / 100),
      }));
    } else {
      const agent = safeAgents.find(a => a.id === selectedAgent);
      if (agent) {
        const completed = agent.performance.tasksCompleted;
        const success = Math.floor(completed * agent.performance.successRate / 100);
        const failed = completed - success;
        
        return [
          { type: '成功', count: success },
          { type: '失败', count: failed },
        ];
      }
    }
    return [];
  };

  // 生成状态分布数据
  const generateStatusData = () => {
    const statusCount = safeAgents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusNames: Record<string, string> = {
      active: '活跃',
      busy: '忙碌',
      error: '错误',
      inactive: '离线',
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      type: statusNames[status] || status,
      value: count,
    }));
  };

  useEffect(() => {
    setPerformanceData(generatePerformanceData());
    setTaskData(generateTaskData());
    setStatusData(generateStatusData());
  }, [selectedAgent, agents]);

  // 性能趋势图配置
  const performanceConfig = {
    data: performanceData,
    xField: 'time',
    yField: 'successRate',
    seriesField: 'metric',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a', '#faad14'],
  };

  // 响应时间图配置
  const responseTimeConfig = {
    data: performanceData,
    xField: 'time',
    yField: 'responseTime',
    smooth: true,
    color: '#722ed1',
    point: {
      size: 3,
      shape: 'circle',
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  // 任务统计图配置
  const taskConfig = selectedAgent === 'all' ? {
    data: taskData,
    xField: 'agent',
    yField: 'completed',
    color: '#1890ff',
    columnWidthRatio: 0.6,
    animation: {
      appear: {
        animation: 'scale-in-y',
        duration: 1000,
      },
    },
  } : {
    data: taskData,
    angleField: 'count',
    colorField: 'type',
    radius: 0.8,
    color: ['#52c41a', '#ff4d4f'],
    animation: {
      appear: {
        animation: 'grow-in-xy',
        duration: 1000,
      },
    },
  };

  // 状态分布图配置
  const statusConfig = {
    data: statusData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    color: ['#52c41a', '#faad14', '#ff4d4f', '#d9d9d9'],
    animation: {
      appear: {
        animation: 'grow-in-xy',
        duration: 1000,
      },
    },
  };

  return (
    <div>
      {/* 筛选控件 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <div>
            <Text strong>选择Agent:</Text>
            <Select
              value={selectedAgent}
              onChange={setSelectedAgent}
              style={{ width: 200, marginLeft: 8 }}
            >
              <Option value="all">所有Agent</Option>
              {safeAgents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {getAgentTypeName(agent.type)}
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Text strong>时间范围:</Text>
            <RangePicker
              value={timeRange}
              onChange={setTimeRange}
              style={{ marginLeft: 8 }}
              showTime
            />
          </div>
        </Space>
      </Card>

      {safeAgents.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无Agent数据"
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {/* 成功率趋势 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <LineChartOutlined />
                  <span>成功率趋势</span>
                </Space>
              }
            >
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
            </Card>
          </Col>

          {/* 响应时间趋势 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>响应时间趋势</span>
                </Space>
              }
            >
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
            </Card>
          </Col>

          {/* 任务统计 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <BarChartOutlined />
                  <span>{selectedAgent === 'all' ? '任务完成统计' : '任务成功率'}</span>
                </Space>
              }
            >
              {selectedAgent === 'all' ? (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
              ) : (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
              )}
            </Card>
          </Col>

          {/* Agent状态分布 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <PieChartOutlined />
                  <span>Agent状态分布</span>
                </Space>
              }
            >
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AgentMonitor;
