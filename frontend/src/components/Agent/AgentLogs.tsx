import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Typography, 
  Modal,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

interface LogEntry {
  id: string;
  timestamp: Date;
  agent: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
  taskId?: string;
  duration?: number;
}

const AgentLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [timeRange, setTimeRange] = useState<[any, any] | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 生成模拟日志数据
  const generateMockLogs = (): LogEntry[] => {
    const agents = [
      'requirement_analyzer',
      'content_generator', 
      'technical_writer',
      'quality_controller',
      'multimedia_creator'
    ];
    
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
    const messages = [
      '任务执行开始',
      '正在分析文档内容',
      '生成内容完成',
      '检测到潜在问题',
      '任务执行成功',
      '连接超时，正在重试',
      '配置文件加载失败',
      '性能监控数据更新',
      '缓存清理完成',
      '系统资源使用率正常',
    ];

    const mockLogs: LogEntry[] = [];
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      mockLogs.push({
        id: `log_${i + 1}`,
        timestamp,
        agent,
        level,
        message,
        details: {
          requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
        },
        taskId: Math.random() > 0.5 ? `task_${Math.random().toString(36).substr(2, 9)}` : undefined,
        duration: Math.random() > 0.3 ? Math.floor(Math.random() * 5000) + 100 : undefined,
      });
    }
    
    return mockLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  useEffect(() => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  // 过滤日志
  useEffect(() => {
    let filtered = logs;

    // 文本搜索
    if (searchText) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchText.toLowerCase()) ||
        log.agent.toLowerCase().includes(searchText.toLowerCase()) ||
        log.taskId?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 级别过滤
    if (levelFilter) {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Agent过滤
    if (agentFilter) {
      filtered = filtered.filter(log => log.agent === agentFilter);
    }

    // 时间范围过滤
    if (timeRange && timeRange[0] && timeRange[1]) {
      const [start, end] = timeRange;
      filtered = filtered.filter(log => {
        const logTime = log.timestamp.getTime();
        return logTime >= start.valueOf() && logTime <= end.valueOf();
      });
    }

    setFilteredLogs(filtered);
  }, [logs, searchText, levelFilter, agentFilter, timeRange]);

  // 获取Agent显示名称
  const getAgentDisplayName = (agent: string) => {
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
    return agentNames[agent] || agent;
  };

  // 获取日志级别颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'success';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  // 获取日志级别文本
  const getLevelText = (level: string) => {
    switch (level) {
      case 'error':
        return '错误';
      case 'warn':
        return '警告';
      case 'info':
        return '信息';
      case 'debug':
        return '调试';
      default:
        return level;
    }
  };

  // 查看日志详情
  const handleViewDetail = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  // 刷新日志
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
      setLoading(false);
      message.success('日志刷新成功');
    }, 1000);
  };

  // 导出日志
  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 清空日志
  const handleClear = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有日志吗？此操作不可恢复。',
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setLogs([]);
        setFilteredLogs([]);
        message.success('日志清空成功');
      },
    });
  };

  // 获取唯一的Agent列表
  const getUniqueAgents = () => {
    const agents = [...new Set(logs.map(log => log.agent))];
    return agents.map(agent => ({ value: agent, label: getAgentDisplayName(agent) }));
  };

  const columns: ColumnsType<LogEntry> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => (
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {timestamp.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => (
        <Tag color={getLevelColor(level)}>
          {getLevelText(level)}
        </Tag>
      ),
    },
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      width: 120,
      render: (agent) => (
        <Text style={{ fontSize: 12 }}>
          {getAgentDisplayName(agent)}
        </Text>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message) => (
        <Text style={{ fontSize: 12 }}>
          {message}
        </Text>
      ),
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 120,
      render: (taskId) => (
        taskId ? (
          <Text code style={{ fontSize: 11 }}>
            {taskId}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        )
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => (
        duration ? (
          <Text style={{ fontSize: 12 }}>
            {duration}ms
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        )
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {/* 筛选工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索日志内容"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="日志级别"
            value={levelFilter}
            onChange={setLevelFilter}
            style={{ width: 100 }}
            allowClear
          >
            <Option value="info">信息</Option>
            <Option value="warn">警告</Option>
            <Option value="error">错误</Option>
            <Option value="debug">调试</Option>
          </Select>
          
          <Select
            placeholder="Agent筛选"
            value={agentFilter}
            onChange={setAgentFilter}
            style={{ width: 150 }}
            allowClear
          >
            {getUniqueAgents().map(agent => (
              <Option key={agent.value} value={agent.value}>
                {agent.label}
              </Option>
            ))}
          </Select>
          
          <RangePicker
            value={timeRange}
            onChange={setTimeRange}
            showTime
            style={{ width: 300 }}
          />
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出
          </Button>
          
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClear}
          >
            清空
          </Button>
        </Space>
      </Card>

      {/* 日志表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>基本信息</Text>
                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text>时间: </Text>
                    <Text code>{selectedLog.timestamp.toLocaleString()}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>级别: </Text>
                    <Tag color={getLevelColor(selectedLog.level)}>
                      {getLevelText(selectedLog.level)}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>Agent: </Text>
                    <Text>{getAgentDisplayName(selectedLog.agent)}</Text>
                  </div>
                  {selectedLog.taskId && (
                    <div style={{ marginBottom: 8 }}>
                      <Text>任务ID: </Text>
                      <Text code>{selectedLog.taskId}</Text>
                    </div>
                  )}
                  {selectedLog.duration && (
                    <div>
                      <Text>执行时间: </Text>
                      <Text>{selectedLog.duration}ms</Text>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Text strong>消息内容</Text>
                <div style={{ 
                  marginTop: 8,
                  padding: 12,
                  background: '#f6f8fa',
                  border: '1px solid #e1e4e8',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedLog.message}
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <Text strong>详细信息</Text>
                  <div style={{ 
                    marginTop: 8,
                    padding: 12,
                    background: '#f6f8fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}>
                    <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentLogs;
