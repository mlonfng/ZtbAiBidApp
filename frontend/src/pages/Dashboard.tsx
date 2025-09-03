import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, List, Progress, Tag, Space, Button } from 'antd';
import {
  ProjectOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  TeamOutlined,
// eslint-disable-next-line @typescript-eslint/no-unused-vars

  TrophyOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import { Line, Column, Pie } from '@ant-design/plots';
import { useDesktopApp } from '../hooks/useDesktopApp';
import DesktopDashboard from '../components/Desktop/DesktopDashboard';

const { Title, Text } = Typography;

interface DashboardData {
  bidProjects: {
    total: number;
    active: number;
    completed: number;
    growth: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    growth: number;
  };
  agents: {
    total: number;
    online: number;
    busy: number;
    efficiency: number;
  };
  workflows: {
    total: number;
    running: number;
    completed: number;
    success_rate: number;
  };
  templates: {
    total: number;
    downloads: number;
    favorites: number;
    growth: number;
  };
  bidAnalysis: {
    total: number;
    processed: number;
    success_rate: number;
    avg_time: number;
  };
  contentGeneration: {
    total: number;
    generated: number;
    ai_assisted: number;
    efficiency: number;
  };
  documentExport: {
    total: number;
    exported: number;
    formats: number;
    success_rate: number;
  };
}

const Dashboard: React.FC = () => {
  const { isElectron } = useDesktopApp();

  const [data, setData] = useState<DashboardData>({
    bidProjects: { total: 0, active: 0, completed: 0, growth: 0 },
    projects: { total: 0, active: 0, completed: 0, growth: 0 },
    agents: { total: 0, online: 0, busy: 0, efficiency: 0 },
    workflows: { total: 0, running: 0, completed: 0, success_rate: 0 },
    templates: { total: 0, downloads: 0, favorites: 0, growth: 0 },
    bidAnalysis: { total: 0, processed: 0, success_rate: 0, avg_time: 0 },
    contentGeneration: { total: 0, generated: 0, ai_assisted: 0, efficiency: 0 },
    documentExport: { total: 0, exported: 0, formats: 0, success_rate: 0 },
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setData({
        bidProjects: { total: 156, active: 23, completed: 133, growth: 12.5 },
        projects: { total: 156, active: 23, completed: 133, growth: 12.5 },
        agents: { total: 8, online: 7, busy: 3, efficiency: 94.2 },
        workflows: { total: 89, running: 5, completed: 84, success_rate: 96.8 },
        templates: { total: 45, downloads: 1234, favorites: 567, growth: 8.3 },
        bidAnalysis: { total: 89, processed: 84, success_rate: 94.4, avg_time: 2.5 },
        contentGeneration: { total: 234, generated: 198, ai_assisted: 156, efficiency: 84.6 },
        documentExport: { total: 145, exported: 142, formats: 5, success_rate: 97.9 },
      });

      setRecentActivities([
        { id: 1, type: 'project', title: '新建商务投标项目', time: '2分钟前', user: '张三' },
        { id: 2, type: 'workflow', title: '技术方案工作流完成', time: '5分钟前', user: '李四' },
        { id: 3, type: 'template', title: '下载工程建设模板', time: '10分钟前', user: '王五' },
        { id: 4, type: 'agent', title: 'AI内容生成器启动', time: '15分钟前', user: '系统' },
        { id: 5, type: 'collaboration', title: '邀请新成员加入项目', time: '20分钟前', user: '赵六' },
      ]);

      setPerformanceData([
        { date: '2024-01', value: 85 },
        { date: '2024-02', value: 88 },
        { date: '2024-03', value: 92 },
        { date: '2024-04', value: 89 },
        { date: '2024-05', value: 94 },
        { date: '2024-06', value: 96 },
      ]);
    }, 1000);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <ProjectOutlined style={{ color: '#1890ff' }} />;
      case 'workflow': return <ThunderboltOutlined style={{ color: '#52c41a' }} />;
      case 'template': return <FileTextOutlined style={{ color: '#fa8c16' }} />;
      case 'agent': return <RobotOutlined style={{ color: '#722ed1' }} />;
      case 'collaboration': return <TeamOutlined style={{ color: '#eb2f96' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const lineConfig = {
    data: performanceData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 4,
      shape: 'circle',
    },
    yAxis: {
      min: 80,
      max: 100,
    },
  };

  const agentStatusData = [
    { type: '在线', value: data.agents.online, color: '#52c41a' },
    { type: '忙碌', value: data.agents.busy, color: '#faad14' },
    { type: '离线', value: data.agents.total - data.agents.online, color: '#d9d9d9' },
  ];

  const pieConfig = {
    data: agentStatusData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    color: agentStatusData.map(item => item.color),
  };

  // 如果是桌面应用，使用专用的桌面Dashboard
  if (isElectron) {
    return <DesktopDashboard />;
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="项目总数"
              value={data.projects.total}
              prefix={<ProjectOutlined />}
              suffix={
                <Space>
                  <Tag color={data.projects.growth > 0 ? 'green' : 'red'}>
                    {data.projects.growth > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(data.projects.growth)}%
                  </Tag>
                </Space>
              }
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              活跃: {data.projects.active} | 已完成: {data.projects.completed}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="AI Agent"
              value={data.agents.online}
              suffix="个"
              prefix={<RobotOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#666' }}>效率: </Text>
              <Text strong style={{ color: '#52c41a' }}>{data.agents.efficiency}%</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="工作流"
              value={data.workflows.total}
              prefix={<ThunderboltOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={data.workflows.success_rate}
                size="small"
                status="active"
                format={(percent) => `成功率 ${percent}%`}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="模板库"
              value={data.templates.total}
              prefix={<FileTextOutlined />}
              suffix={
                <Tag color="blue">
                  下载 {data.templates.downloads}
                </Tag>
              }
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              收藏: {data.templates.favorites}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 性能趋势 */}
        <Col xs={24} lg={16}>
          <Card title="系统性能趋势" style={{ height: 400 }}>
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
          </Card>
        </Col>

        {/* Agent状态分布 */}
        <Col xs={24} lg={8}>
          <Card title="Agent状态分布" style={{ height: 400 }}>
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #d9d9d9", borderRadius: 4 }}>图表组件临时禁用</div>
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card
            title="最近活动"
            extra={<Button type="link">查看全部</Button>}
            style={{ height: 400 }}
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getActivityIcon(item.type)}
                    title={item.title}
                    description={
                      <Space>
                        <Text type="secondary">{item.user}</Text>
                        <Text type="secondary">·</Text>
                        <Text type="secondary">{item.time}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作" style={{ height: 400 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  styles={{ body: { padding: 24  }}}
                >
                  <ProjectOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                  <div>创建项目</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  styles={{ body: { padding: 24  }}}
                >
                  <ThunderboltOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 16 }} />
                  <div>启动工作流</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  styles={{ body: { padding: 24  }}}
                >
                  <FileTextOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 16 }} />
                  <div>浏览模板</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  styles={{ body: { padding: 24  }}}
                >
                  <RobotOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 16 }} />
                  <div>管理Agent</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
