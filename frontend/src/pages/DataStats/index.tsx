import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Typography, Space, DatePicker, Select } from 'antd';
import {
  BarChartOutlined,
  ProjectOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../../store';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const DataStats: React.FC = () => {
  const { projects } = useAppSelector(state => state.project);
  
  const [timeRange, setTimeRange] = useState<string>('month');
  
  // 计算统计数据
  const stats = {
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
    successRate: projects.length > 0 ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) : 0,
  };

  // 项目类型统计
  const projectTypeStats = [
    { type: '政府采购', count: Math.floor(projects.length * 0.4), rate: 85 },
    { type: '工程建设', count: Math.floor(projects.length * 0.3), rate: 78 },
    { type: '服务采购', count: Math.floor(projects.length * 0.2), rate: 92 },
    { type: '其他', count: Math.floor(projects.length * 0.1), rate: 70 },
  ];

  // 月度趋势数据
  const monthlyTrends = [
    { month: '1月', projects: 8, success: 6 },
    { month: '2月', projects: 12, success: 9 },
    { month: '3月', projects: 15, success: 12 },
    { month: '4月', projects: 10, success: 8 },
    { month: '5月', projects: 18, success: 15 },
    { month: '6月', projects: 14, success: 11 },
  ];

  const columns = [
    {
      title: '项目类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '项目数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: '成功率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => (
        <Space>
          <Progress percent={rate} size="small" style={{ width: 100 }} />
          <Text>{rate}%</Text>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>

      {/* 时间筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Text>时间范围：</Text>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="quarter">本季度</Option>
            <Option value="year">本年</Option>
          </Select>
          <RangePicker />
        </Space>
      </Card>

      {/* 核心指标 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={stats.totalProjects}
              prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <Space>
                  <RiseOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>+12%</Text>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedProjects}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <Space>
                  <RiseOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>+8%</Text>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgressProjects}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <Space>
                  <FallOutlined style={{ color: '#ff4d4f' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>-3%</Text>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功率"
              value={stats.successRate}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <Space>
                  <span>%</span>
                  <RiseOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>+5%</Text>
                </Space>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 项目类型分析 */}
        <Col xs={24} lg={12}>
          <Card title="项目类型分析" style={{ height: 400 }}>
            <Table
              dataSource={projectTypeStats}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 月度趋势 */}
        <Col xs={24} lg={12}>
          <Card title="月度趋势" style={{ height: 400 }}>
            <div style={{ padding: '20px 0' }}>
              {monthlyTrends.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.month}</Text>
                    <Text>{item.success}/{item.projects}</Text>
                  </div>
                  <Progress 
                    percent={Math.round((item.success / item.projects) * 100)} 
                    size="small"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细报告 */}
      <Card title="详细报告" style={{ marginTop: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                平均制作时间
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>
                3.2天
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>
                比上月减少0.5天
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                AI使用率
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#722ed1' }}>
                95%
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>
                AI功能使用率持续提升
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                用户满意度
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fa8c16' }}>
                4.8分
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>
                满分5分，用户反馈良好
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DataStats;
