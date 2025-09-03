import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Progress, Alert, Row, Col, Statistic, Badge, Table, Tag, Tabs } from 'antd';
import { 
  MonitorOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  RobotOutlined,
  WifiOutlined,
  MoreOutlined,
  HddOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastCheck: string;
  responseTime?: number;
  uptime?: string;
  details?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  threshold: number;
}

const SystemMonitorPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 系统状态数据
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    {
      id: '1',
      name: 'DeepSeek API',
      status: 'online',
      lastCheck: '2024-11-01 14:30:25',
      responseTime: 245,
      uptime: '99.9%',
      details: 'API响应正常，所有服务可用',
    },
    {
      id: '2',
      name: 'OpenAI API',
      status: 'online',
      lastCheck: '2024-11-01 14:30:20',
      responseTime: 180,
      uptime: '99.8%',
      details: 'API响应正常',
    },
    {
      id: '3',
      name: '数据库连接',
      status: 'online',
      lastCheck: '2024-11-01 14:30:30',
      responseTime: 15,
      uptime: '100%',
      details: '数据库连接正常，查询响应快速',
    },
    {
      id: '4',
      name: '文件存储服务',
      status: 'warning',
      lastCheck: '2024-11-01 14:29:45',
      responseTime: 850,
      uptime: '98.5%',
      details: '存储空间使用率较高，建议清理',
    },
    {
      id: '5',
      name: 'AI Agent服务',
      status: 'online',
      lastCheck: '2024-11-01 14:30:15',
      responseTime: 320,
      uptime: '99.7%',
      details: '3个Agent实例运行正常',
    },
    {
      id: '6',
      name: '网络连接',
      status: 'error',
      lastCheck: '2024-11-01 14:28:10',
      responseTime: 0,
      uptime: '95.2%',
      details: '外网连接异常，正在重试',
    },
  ]);

  // 性能指标数据
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'CPU使用率', value: 45, unit: '%', status: 'normal', threshold: 80 },
    { name: '内存使用率', value: 68, unit: '%', status: 'warning', threshold: 85 },
    { name: '磁盘使用率', value: 82, unit: '%', status: 'warning', threshold: 90 },
    { name: '网络延迟', value: 25, unit: 'ms', status: 'normal', threshold: 100 },
    { name: 'API调用量', value: 1250, unit: '/h', status: 'normal', threshold: 2000 },
    { name: '错误率', value: 0.5, unit: '%', status: 'normal', threshold: 5 },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 模拟刷新数据
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 随机更新一些状态
      setSystemStatus(prev => prev.map(item => ({
        ...item,
        lastCheck: new Date().toLocaleString(),
        responseTime: Math.floor(Math.random() * 500) + 50,
      })));
      
      setPerformanceMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * 10),
      })));
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // 30秒自动刷新

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'offline':
        return <CloseCircleOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('API')) return <ApiOutlined />;
    if (name.includes('数据库')) return <DatabaseOutlined />;
    if (name.includes('存储')) return <HddOutlined />;
    if (name.includes('Agent')) return <RobotOutlined />;
    if (name.includes('网络')) return <WifiOutlined />;
    return <CloudServerOutlined />;
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'normal': return '#52c41a';
      case 'warning': return '#faad14';
      case 'critical': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const onlineServices = systemStatus.filter(s => s.status === 'online').length;
  const warningServices = systemStatus.filter(s => s.status === 'warning').length;
  const errorServices = systemStatus.filter(s => s.status === 'error').length;
  const avgResponseTime = Math.round(
    systemStatus.filter(s => s.responseTime).reduce((sum, s) => sum + (s.responseTime || 0), 0) / 
    systemStatus.filter(s => s.responseTime).length
  );

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SystemStatus) => (
        <Space>
          {getServiceIcon(name)}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={getStatusColor(status) as any} 
          text={status === 'online' ? '在线' : status === 'warning' ? '警告' : status === 'error' ? '错误' : '离线'}
        />
      ),
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => time ? `${time}ms` : '-',
      sorter: (a: SystemStatus, b: SystemStatus) => (a.responseTime || 0) - (b.responseTime || 0),
    },
    {
      title: '可用性',
      dataIndex: 'uptime',
      key: 'uptime',
    },
    {
      title: '最后检查',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 总体状态概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线服务"
              value={onlineServices}
              suffix={`/ ${systemStatus.length}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告服务"
              value={warningServices}
              valueStyle={{ color: warningServices > 0 ? '#faad14' : '#52c41a' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误服务"
              value={errorServices}
              valueStyle={{ color: errorServices > 0 ? '#f5222d' : '#52c41a' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={avgResponseTime}
              suffix="ms"
              valueStyle={{ color: avgResponseTime > 500 ? '#f5222d' : avgResponseTime > 200 ? '#faad14' : '#52c41a' }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统警告 */}
      {(warningServices > 0 || errorServices > 0) && (
        <Alert
          message="系统状态警告"
          description={`检测到 ${warningServices} 个警告和 ${errorServices} 个错误，请及时处理。`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 操作区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text type="secondary">
                最后更新: {lastUpdate.toLocaleString()}
              </Text>
              <Text type="secondary">
                自动刷新: 30秒
              </Text>
            </Space>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              loading={refreshing}
              onClick={handleRefresh}
            >
              立即刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 主要内容 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'services',
              label: '服务状态',
              children: (
                <Table
                  columns={columns}
                  dataSource={systemStatus}
                  rowKey="id"
                  pagination={false}
                  rowClassName={(record) => {
                    if (record.status === 'error') return 'error-row';
                    if (record.status === 'warning') return 'warning-row';
                    return '';
                  }}
                />
              ),
            },
            {
              key: 'performance',
              label: '性能指标',
              children: (
                <Row gutter={[16, 16]}>
                  {performanceMetrics.map((metric, index) => (
                    <Col span={8} key={index}>
                      <Card size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>{metric.name}</Text>
                            <Tag color={metric.status === 'normal' ? 'green' : metric.status === 'warning' ? 'orange' : 'red'}>
                              {metric.status === 'normal' ? '正常' : metric.status === 'warning' ? '警告' : '严重'}
                            </Tag>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Progress
                              percent={metric.name.includes('率') ? metric.value : (metric.value / metric.threshold) * 100}
                              strokeColor={getMetricColor(metric.status)}
                              style={{ flex: 1, marginRight: 12 }}
                              size="small"
                            />
                            <Text strong style={{ color: getMetricColor(metric.status) }}>
                              {metric.value.toFixed(metric.name.includes('率') ? 1 : 0)}{metric.unit}
                            </Text>
                          </div>
                          
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            阈值: {metric.threshold}{metric.unit}
                          </Text>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: 'alerts',
              label: '告警历史',
              children: (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Text type="secondary">告警历史功能开发中...</Text>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <style>{`
        .error-row {
          background-color: #fff2f0;
        }
        .warning-row {
          background-color: #fffbe6;
        }
      `}</style>
    </div>
  );
};

export default SystemMonitorPage;
