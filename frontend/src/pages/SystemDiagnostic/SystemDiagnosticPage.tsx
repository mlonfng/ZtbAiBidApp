import React, { useState } from 'react';
import { Card, Button, Typography, Space, Table, Tag, Tabs, Alert, Row, Col, Input, Select, DatePicker, Collapse } from 'antd';
import {
  BugOutlined,
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  module: string;
  message: string;
  details?: string;
  userId?: string;
  ip?: string;
}

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
  duration?: number;
}

const SystemDiagnosticPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [logLevel, setLogLevel] = useState('all');
  const [running, setRunning] = useState(false);

  // 模拟日志数据
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-11-01 14:30:25',
      level: 'info',
      module: 'AI服务',
      message: 'DeepSeek API调用成功',
      details: '生成技术方案内容，耗时245ms',
      userId: 'user123',
      ip: '192.168.1.100',
    },
    {
      id: '2',
      timestamp: '2024-11-01 14:29:45',
      level: 'warning',
      module: '文件存储',
      message: '存储空间使用率达到85%',
      details: '当前使用空间: 850GB / 1TB，建议清理临时文件',
      ip: '192.168.1.100',
    },
    {
      id: '3',
      timestamp: '2024-11-01 14:28:10',
      level: 'error',
      module: '网络连接',
      message: '外网API连接超时',
      details: 'OpenAI API连接超时，错误代码: TIMEOUT_ERROR',
      ip: '192.168.1.100',
    },
    {
      id: '4',
      timestamp: '2024-11-01 14:27:30',
      level: 'info',
      module: '用户认证',
      message: '用户登录成功',
      details: '用户admin登录成功',
      userId: 'admin',
      ip: '192.168.1.101',
    },
    {
      id: '5',
      timestamp: '2024-11-01 14:26:15',
      level: 'debug',
      module: '数据库',
      message: '执行查询操作',
      details: 'SELECT * FROM projects WHERE status = "active"',
      ip: '192.168.1.100',
    },
    {
      id: '6',
      timestamp: '2024-11-01 14:25:00',
      level: 'error',
      module: 'AI服务',
      message: 'AI内容生成失败',
      details: '提示词解析错误，缺少必要参数',
      userId: 'user456',
      ip: '192.168.1.102',
    },
  ]);

  // 诊断测试项目
  const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTest[]>([
    {
      id: '1',
      name: 'API连接测试',
      description: '测试所有外部API的连接状态',
      status: 'pending',
    },
    {
      id: '2',
      name: '数据库连接测试',
      description: '检查数据库连接和查询性能',
      status: 'pending',
    },
    {
      id: '3',
      name: '文件系统检查',
      description: '检查文件存储空间和权限',
      status: 'pending',
    },
    {
      id: '4',
      name: '内存使用检查',
      description: '检查系统内存使用情况',
      status: 'pending',
    },
    {
      id: '5',
      name: 'AI服务测试',
      description: '测试AI模型服务的可用性',
      status: 'pending',
    },
  ]);

  const handleRunDiagnostics = async () => {
    setRunning(true);
    
    try {
      // 模拟诊断过程
      for (let i = 0; i < diagnosticTests.length; i++) {
        setDiagnosticTests(prev => prev.map((test, index) => 
          index === i ? { ...test, status: 'running' } : test
        ));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 随机生成测试结果
        const passed = Math.random() > 0.3;
        setDiagnosticTests(prev => prev.map((test, index) => 
          index === i ? { 
            ...test, 
            status: passed ? 'passed' : 'failed',
            result: passed ? '测试通过' : '测试失败，需要检查配置',
            duration: Math.floor(Math.random() * 1000) + 100,
          } : test
        ));
      }
    } catch (error) {
      console.error('诊断失败:', error);
    } finally {
      setRunning(false);
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'debug':
        return <BugOutlined style={{ color: '#722ed1' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'blue';
      case 'warning': return 'orange';
      case 'error': return 'red';
      case 'debug': return 'purple';
      default: return 'default';
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'running':
        return <ReloadOutlined spin style={{ color: '#1890ff' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return null;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchText.toLowerCase()) ||
                         log.module.toLowerCase().includes(searchText.toLowerCase());
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    return matchesSearch && matchesLevel;
  });

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={getLogColor(level)} icon={getLogIcon(level)}>
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      render: (userId: string) => userId || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
    },
  ];

  const testColumns = [
    {
      title: '测试项目',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DiagnosticTest) => (
        <Space>
          {getTestStatusIcon(record.status)}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'default', text: '待执行' },
          running: { color: 'processing', text: '执行中' },
          passed: { color: 'success', text: '通过' },
          failed: { color: 'error', text: '失败' },
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => result || '-',
    },
  ];

  const errorCount = logs.filter(log => log.level === 'error').length;
  const warningCount = logs.filter(log => log.level === 'warning').length;
  const passedTests = diagnosticTests.filter(test => test.status === 'passed').length;
  const failedTests = diagnosticTests.filter(test => test.status === 'failed').length;

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{errorCount}</div>
              <div style={{ color: '#666' }}>错误日志</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{warningCount}</div>
              <div style={{ color: '#666' }}>警告日志</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{passedTests}</div>
              <div style={{ color: '#666' }}>通过测试</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{failedTests}</div>
              <div style={{ color: '#666' }}>失败测试</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'logs',
              label: (
                <Space>
                  <FileTextOutlined />
                  系统日志
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 日志过滤器 */}
                  <Card size="small">
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Input
                          placeholder="搜索日志内容..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                      </Col>
                      <Col span={4}>
                        <Select
                          value={logLevel}
                          onChange={setLogLevel}
                          style={{ width: '100%' }}
                        >
                          <Option value="all">全部级别</Option>
                          <Option value="error">错误</Option>
                          <Option value="warning">警告</Option>
                          <Option value="info">信息</Option>
                          <Option value="debug">调试</Option>
                        </Select>
                      </Col>
                      <Col span={8}>
                        <RangePicker style={{ width: '100%' }} />
                      </Col>
                      <Col span={4}>
                        <Space>
                          <Button icon={<ReloadOutlined />}>刷新</Button>
                          <Button icon={<DownloadOutlined />}>导出</Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* 日志表格 */}
                  <Table
                    columns={logColumns}
                    dataSource={filteredLogs}
                    rowKey="id"
                    size="small"
                    expandable={{
                      expandedRowRender: (record) => (
                        <div style={{ padding: 16, background: '#fafafa' }}>
                          <Text strong>详细信息：</Text>
                          <br />
                          <Text code>{record.details}</Text>
                        </div>
                      ),
                    }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    }}
                  />
                </Space>
              ),
            },
            {
              key: 'diagnostic',
              label: (
                <Space>
                  <ToolOutlined />
                  系统诊断
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 诊断控制 */}
                  <Card size="small">
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Alert
                          message="系统诊断"
                          description="运行系统诊断可以检查各个组件的运行状态，帮助发现潜在问题。"
                          type="info"
                          showIcon
                        />
                      </Col>
                      <Col>
                        <Button 
                          type="primary" 
                          icon={<ToolOutlined />}
                          loading={running}
                          onClick={handleRunDiagnostics}
                        >
                          {running ? '诊断中...' : '运行诊断'}
                        </Button>
                      </Col>
                    </Row>
                  </Card>

                  {/* 诊断结果 */}
                  <Table
                    columns={testColumns}
                    dataSource={diagnosticTests}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                </Space>
              ),
            },
            {
              key: 'troubleshooting',
              label: '故障排除',
              children: (
                <Collapse>
                  <Panel header="AI服务连接问题" key="1">
                    <Space direction="vertical">
                      <Text strong>常见原因：</Text>
                      <ul>
                        <li>API密钥配置错误</li>
                        <li>网络连接问题</li>
                        <li>API配额不足</li>
                      </ul>
                      <Text strong>解决方案：</Text>
                      <ul>
                        <li>检查AI配置页面的API密钥设置</li>
                        <li>测试网络连接</li>
                        <li>查看API使用量</li>
                      </ul>
                    </Space>
                  </Panel>
                  <Panel header="文件上传失败" key="2">
                    <Space direction="vertical">
                      <Text strong>常见原因：</Text>
                      <ul>
                        <li>文件格式不支持</li>
                        <li>文件大小超限</li>
                        <li>存储空间不足</li>
                      </ul>
                      <Text strong>解决方案：</Text>
                      <ul>
                        <li>检查文件格式是否为PDF或DOCX</li>
                        <li>确保文件大小小于50MB</li>
                        <li>清理临时文件释放空间</li>
                      </ul>
                    </Space>
                  </Panel>
                  <Panel header="系统性能问题" key="3">
                    <Space direction="vertical">
                      <Text strong>常见原因：</Text>
                      <ul>
                        <li>内存使用率过高</li>
                        <li>CPU负载过重</li>
                        <li>磁盘空间不足</li>
                      </ul>
                      <Text strong>解决方案：</Text>
                      <ul>
                        <li>重启相关服务</li>
                        <li>清理系统缓存</li>
                        <li>优化系统配置</li>
                      </ul>
                    </Space>
                  </Panel>
                </Collapse>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SystemDiagnosticPage;
