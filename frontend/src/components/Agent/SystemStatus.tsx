import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Progress, Statistic, Alert, List, Typography, Space, Tag, Button } from 'antd';
import {
  CloudServerOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  activeConnections: number;
  queueSize: number;
  errorRate: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

const SystemStatus: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0天0小时0分钟',
    activeConnections: 0,
    queueSize: 0,
    errorRate: 0,
  });
  
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);

  // 生成模拟系统指标
  const generateMetrics = (): SystemMetrics => {
    const now = new Date();
    const startTime = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const uptime = now.getTime() - startTime.getTime();
    
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
    
    return {
      cpu: Math.floor(Math.random() * 40) + 20,
      memory: Math.floor(Math.random() * 30) + 50,
      disk: Math.floor(Math.random() * 20) + 30,
      network: Math.floor(Math.random() * 50) + 10,
      uptime: `${days}天${hours}小时${minutes}分钟`,
      activeConnections: Math.floor(Math.random() * 100) + 50,
      queueSize: Math.floor(Math.random() * 20),
      errorRate: Math.random() * 2,
    };
  };

  // 生成模拟系统告警
  const generateAlerts = (): SystemAlert[] => {
    const alertTypes: SystemAlert['type'][] = ['error', 'warning', 'info'];
    const alertMessages = [
      { type: 'error', title: 'Agent连接失败', message: '多媒体创作师Agent连接超时，请检查网络连接' },
      { type: 'warning', title: '内存使用率过高', message: '系统内存使用率达到85%，建议清理缓存' },
      { type: 'info', title: '系统更新', message: '系统已成功更新到最新版本' },
      { type: 'warning', title: '队列积压', message: '任务队列中有15个待处理任务' },
      { type: 'error', title: '数据库连接异常', message: '数据库连接池已满，部分请求可能失败' },
    ];

    return alertMessages.slice(0, Math.floor(Math.random() * 4) + 1).map((alert, index) => ({
      id: `alert_${index}`,
      type: alert.type as "error" | "warning" | "info",
      title: alert.title,
      message: alert.message,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    }));
  };

  // 刷新系统状态
  const refreshStatus = async () => {
    setLoading(true);
    
    // 模拟API调用
    setTimeout(() => {
      setMetrics(generateMetrics());
      setAlerts(generateAlerts());
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    refreshStatus();
    
    // 定时刷新
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // 获取状态颜色
  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return '#ff4d4f';
    if (value >= thresholds.warning) return '#faad14';
    return '#52c41a';
  };

  // 获取告警类型图标
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  return (
    <div>
      {/* 系统告警 */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              type={alert.type}
              message={alert.title}
              description={alert.message}
              showIcon
              style={{ marginBottom: 8 }}
              action={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {alert.timestamp.toLocaleString()}
                </Text>
              }
            />
          ))}
        </div>
      )}

      {/* 系统指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="CPU使用率"
              value={metrics.cpu}
              suffix="%"
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: getStatusColor(metrics.cpu, { warning: 70, danger: 90 }) }}
            />
            <Progress
              percent={metrics.cpu}
              strokeColor={getStatusColor(metrics.cpu, { warning: 70, danger: 90 })}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="内存使用率"
              value={metrics.memory}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: getStatusColor(metrics.memory, { warning: 80, danger: 95 }) }}
            />
            <Progress
              percent={metrics.memory}
              strokeColor={getStatusColor(metrics.memory, { warning: 80, danger: 95 })}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="磁盘使用率"
              value={metrics.disk}
              suffix="%"
              prefix={<CloudOutlined />}
              valueStyle={{ color: getStatusColor(metrics.disk, { warning: 80, danger: 95 }) }}
            />
            <Progress
              percent={metrics.disk}
              strokeColor={getStatusColor(metrics.disk, { warning: 80, danger: 95 })}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="网络使用率"
              value={metrics.network}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: getStatusColor(metrics.network, { warning: 80, danger: 95 }) }}
            />
            <Progress
              percent={metrics.network}
              strokeColor={getStatusColor(metrics.network, { warning: 80, danger: 95 })}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 系统信息 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>系统信息</span>
              </Space>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshStatus}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>系统运行时间:</Text>
                  <Text strong>{metrics.uptime}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>活跃连接数:</Text>
                  <Text strong>{metrics.activeConnections}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>任务队列长度:</Text>
                  <Text strong>{metrics.queueSize}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>错误率:</Text>
                  <Text strong style={{ color: metrics.errorRate > 1 ? '#ff4d4f' : '#52c41a' }}>
                    {metrics.errorRate.toFixed(2)}%
                  </Text>
                </div>
              </div>
              
              <div>
                <Text strong>系统状态</Text>
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      API服务正常
                    </Tag>
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      数据库连接正常
                    </Tag>
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      缓存服务正常
                    </Tag>
                    <Tag color={metrics.queueSize > 10 ? 'warning' : 'success'} 
                         icon={metrics.queueSize > 10 ? <WarningOutlined /> : <CheckCircleOutlined />}>
                      任务队列{metrics.queueSize > 10 ? '繁忙' : '正常'}
                    </Tag>
                  </Space>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 服务状态 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CloudServerOutlined />
                <span>服务状态</span>
              </Space>
            }
          >
            <List
              size="small"
              dataSource={[
                { name: 'Agent管理服务', status: 'running', port: 8001 },
                { name: '工作流引擎', status: 'running', port: 8002 },
                { name: '文档生成服务', status: 'running', port: 8003 },
                { name: '模板管理服务', status: 'running', port: 8004 },
                { name: '用户认证服务', status: 'running', port: 8005 },
                { name: '文件存储服务', status: 'running', port: 8006 },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Space>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: item.status === 'running' ? '#52c41a' : '#ff4d4f',
                        }}
                      />
                      <Text>{item.name}</Text>
                    </Space>
                    <Space>
                      <Tag color={item.status === 'running' ? 'success' : 'error'}>
                        {item.status === 'running' ? '运行中' : '已停止'}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        :{item.port}
                      </Text>
                    </Space>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemStatus;
