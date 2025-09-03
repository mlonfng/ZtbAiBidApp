import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Input, Select, Tooltip, Modal } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ExecutionLogItem {
  id: number;
  step: string;
  status: 'completed' | 'running' | 'error';
  timestamp: Date;
  message: string;
}

interface TaskItem {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agent: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  result?: any;
  error?: string;
}

interface TaskMonitorProps {
  executionLog: ExecutionLogItem[];
  workflowStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

const TaskMonitor: React.FC<TaskMonitorProps> = ({
  executionLog,
  workflowStatus,
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  // 模拟任务数据
  const generateMockTasks = (): TaskItem[] => {
    const tasks: TaskItem[] = [];
    const agentNames = ['需求分析师', '内容生成器', '技术写作师', '质量控制师'];
    const taskTypes = ['文档分析', '内容生成', '格式转换', '质量检查'];
    
    for (let i = 1; i <= 10; i++) {
      const startTime = new Date(Date.now() - Math.random() * 3600000);
      const isCompleted = Math.random() > 0.3;
      const endTime = isCompleted ? new Date(startTime.getTime() + Math.random() * 1800000) : undefined;
      
      tasks.push({
        id: `task_${i}`,
        name: `${taskTypes[Math.floor(Math.random() * taskTypes.length)]}任务 ${i}`,
        type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
        status: isCompleted ? 'completed' : (Math.random() > 0.5 ? 'running' : 'pending'),
        agent: agentNames[Math.floor(Math.random() * agentNames.length)],
        startTime,
        endTime,
        duration: endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : undefined,
        progress: isCompleted ? 100 : Math.floor(Math.random() * 80) + 10,
        result: isCompleted ? { output: '任务执行成功', files: ['result.txt'] } : undefined,
        error: !isCompleted && Math.random() > 0.8 ? '执行过程中出现错误' : undefined,
      });
    }
    
    return tasks;
  };

  const [tasks] = useState<TaskItem[]>(generateMockTasks());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'processing';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'running':
        return '执行中';
      case 'failed':
        return '失败';
      case 'pending':
        return '等待中';
      default:
        return '未知';
    }
  };

  const handleViewTask = (task: TaskItem) => {
    setSelectedTask(task);
    setTaskDetailVisible(true);
  };

  const handleRetryTask = (task: TaskItem) => {
    console.log('重试任务:', task.name);
    // TODO: 实现任务重试逻辑
  };

  const handleCancelTask = (task: TaskItem) => {
    console.log('取消任务:', task.name);
    // TODO: 实现任务取消逻辑
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         task.agent.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<TaskItem> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getStatusIcon(record.status)}
            <Text strong>{text}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.type}
          </Text>
        </div>
      ),
    },
    {
      title: '执行Agent',
      dataIndex: 'agent',
      key: 'agent',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 100,
      render: (progress, record) => (
        <div>
          <Text style={{ fontSize: 12 }}>{progress}%</Text>
          {record.status === 'running' && (
            <div style={{ width: 60, height: 4, background: '#f0f0f0', borderRadius: 2, marginTop: 2 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#1890ff',
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (time) => time.toLocaleTimeString(),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => duration ? `${duration}s` : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTask(record)}
            />
          </Tooltip>
          {record.status === 'failed' && (
            <Tooltip title="重试">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleRetryTask(record)}
              />
            </Tooltip>
          )}
          {record.status === 'running' && (
            <Tooltip title="取消">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelTask(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="任务监控"
        extra={
          <Space>
            <Search
              placeholder="搜索任务"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              size="small"
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 100 }}
              size="small"
              allowClear
            >
              <Option value="pending">等待中</Option>
              <Option value="running">执行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 任务详情模态框 */}
      <Modal
        title={`任务详情 - ${selectedTask?.name}`}
        open={taskDetailVisible}
        onCancel={() => {
          setTaskDetailVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => setTaskDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedTask && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 基本信息 */}
              <div>
                <Text strong style={{ fontSize: 16 }}>基本信息</Text>
                <div style={{ marginTop: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>任务ID:</Text>
                      <Text>{selectedTask.id}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>任务类型:</Text>
                      <Text>{selectedTask.type}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>执行Agent:</Text>
                      <Text>{selectedTask.agent}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>状态:</Text>
                      <Tag color={getStatusColor(selectedTask.status)}>
                        {getStatusText(selectedTask.status)}
                      </Tag>
                    </div>
                  </Space>
                </div>
              </div>

              {/* 执行信息 */}
              <div>
                <Text strong style={{ fontSize: 16 }}>执行信息</Text>
                <div style={{ marginTop: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>开始时间:</Text>
                      <Text>{selectedTask.startTime.toLocaleString()}</Text>
                    </div>
                    {selectedTask.endTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>结束时间:</Text>
                        <Text>{selectedTask.endTime.toLocaleString()}</Text>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>执行进度:</Text>
                      <Text>{selectedTask.progress}%</Text>
                    </div>
                    {selectedTask.duration && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>执行耗时:</Text>
                        <Text>{selectedTask.duration}秒</Text>
                      </div>
                    )}
                  </Space>
                </div>
              </div>

              {/* 执行结果 */}
              {selectedTask.result && (
                <div>
                  <Text strong style={{ fontSize: 16 }}>执行结果</Text>
                  <div style={{ 
                    marginTop: 8,
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'monospace'
                  }}>
                    <pre>{JSON.stringify(selectedTask.result, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {selectedTask.error && (
                <div>
                  <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>错误信息</Text>
                  <div style={{ 
                    marginTop: 8,
                    background: '#fff2f0',
                    border: '1px solid #ffccc7',
                    padding: 12,
                    borderRadius: 6,
                    color: '#ff4d4f'
                  }}>
                    {selectedTask.error}
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
};

export default TaskMonitor;
