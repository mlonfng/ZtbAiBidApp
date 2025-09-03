import React, { useState } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Input, 
  Select, 
  Avatar, 
  Badge, 
  Tooltip, 
  Modal, 
  Progress,
  Typography,
  message,
} from 'antd';
import {
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { useAppDispatch } from '../../store';
import { startAgent, stopAgent, restartAgent } from '../../store/slices/agentSlice';
import { Agent } from '../../store/slices/agentSlice';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface AgentListProps {
  agents: Agent[];
  loading: boolean;
}

const AgentList: React.FC<AgentListProps> = ({ agents, loading }) => {
  const dispatch = useAppDispatch();

  // 确保 agents 是数组
  const safeAgents = Array.isArray(agents) ? agents : [];

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);

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

  // 获取Agent状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'busy':
        return 'processing';
      case 'error':
        return 'error';
      default:
        return 'default';
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

  // Agent操作处理
  const handleAgentAction = async (agent: Agent, action: 'start' | 'stop' | 'restart') => {
    try {
      switch (action) {
        case 'start':
          await dispatch(startAgent(agent.id)).unwrap();
          message.success(`${getAgentTypeName(agent.type)}启动成功`);
          break;
        case 'stop':
          await dispatch(stopAgent(agent.id)).unwrap();
          message.success(`${getAgentTypeName(agent.type)}停止成功`);
          break;
        case 'restart':
          await dispatch(restartAgent(agent.id)).unwrap();
          message.success(`${getAgentTypeName(agent.type)}重启成功`);
          break;
      }
    } catch (error) {
      message.error(`操作失败: ${error}`);
    }
  };

  // 查看Agent详情
  const handleViewDetail = (agent: Agent) => {
    setSelectedAgent(agent);
    setDetailModalVisible(true);
  };

  // 配置Agent
  const handleConfig = (agent: Agent) => {
    setSelectedAgent(agent);
    setConfigModalVisible(true);
  };

  // 删除Agent
  const handleDelete = (agent: Agent) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除Agent "${getAgentTypeName(agent.type)}" 吗？`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.success('Agent删除成功');
        // TODO: 实现删除逻辑
      },
    });
  };

  // 过滤Agent
  const filteredAgents = safeAgents.filter(agent => {
    const matchesSearch = getAgentTypeName(agent.type).toLowerCase().includes(searchText.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || agent.status === statusFilter;
    const matchesType = !typeFilter || agent.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 获取唯一的Agent类型
  const getUniqueTypes = () => {
    const typeSet = new Set(agents.map(agent => agent.type));
    const types = Array.from(typeSet);
    return types.map(type => ({ value: type, label: getAgentTypeName(type) }));
  };

  const columns: ColumnsType<Agent> = [
    {
      title: 'Agent',
      key: 'agent',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge
            dot
            color={record.status === 'active' ? '#52c41a' : 
                   record.status === 'busy' ? '#faad14' : 
                   record.status === 'error' ? '#ff4d4f' : '#d9d9d9'}
            offset={[-5, 5]}
          >
            <Avatar
              icon={<RobotOutlined />}
              style={{
                backgroundColor: record.status === 'active' ? '#52c41a' : 
                                record.status === 'busy' ? '#faad14' : 
                                record.status === 'error' ? '#ff4d4f' : '#d9d9d9',
              }}
            />
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>{getAgentTypeName(record.type)}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          </div>
        </div>
      ),
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
      title: '性能指标',
      key: 'performance',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12 }}>成功率:</Text>
            <Text strong style={{ fontSize: 12 }}>{record.performance.successRate}%</Text>
          </div>
          <Progress
            percent={record.performance.successRate}
            size="small"
            strokeColor="#52c41a"
            trailColor="#f0f0f0"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontSize: 12 }}>完成任务: {record.performance.tasksCompleted}</Text>
            <Text style={{ fontSize: 12 }}>平均时间: {record.performance.averageTime}ms</Text>
          </div>
        </div>
      ),
    },
    {
      title: '最后活跃',
      dataIndex: ['performance', 'lastActive'],
      key: 'lastActive',
      width: 120,
      render: (lastActive) => (
        <Text style={{ fontSize: 12 }}>
          {lastActive ? new Date(lastActive).toLocaleString() : '从未活跃'}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          
          <Tooltip title="配置">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => handleConfig(record)}
            />
          </Tooltip>
          
          {record.status === 'inactive' ? (
            <Tooltip title="启动">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleAgentAction(record, 'start')}
              />
            </Tooltip>
          ) : (
            <Tooltip title="停止">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleAgentAction(record, 'stop')}
              />
            </Tooltip>
          )}
          
          <Tooltip title="重启">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleAgentAction(record, 'restart')}
            />
          </Tooltip>
          
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 筛选工具栏 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Search
          placeholder="搜索Agent名称或描述"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        
        <Select
          placeholder="状态筛选"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          allowClear
        >
          <Option value="active">活跃</Option>
          <Option value="busy">忙碌</Option>
          <Option value="error">错误</Option>
          <Option value="inactive">离线</Option>
        </Select>
        
        <Select
          placeholder="类型筛选"
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 150 }}
          allowClear
        >
          {getUniqueTypes().map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
        
        <Text type="secondary">
          共 {filteredAgents.length} 个Agent
        </Text>
      </div>

      {/* Agent表格 */}
      <Table
        columns={columns}
        dataSource={filteredAgents}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />

      {/* Agent详情模态框 */}
      <Modal
        title={`Agent详情 - ${selectedAgent ? getAgentTypeName(selectedAgent.type) : ''}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAgent(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedAgent && (
          <div>
            {/* Agent详情内容 */}
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>基本信息</Text>
                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text>Agent ID: </Text>
                    <Text code>{selectedAgent.id}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>类型: </Text>
                    <Text>{getAgentTypeName(selectedAgent.type)}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>状态: </Text>
                    <Tag color={getStatusColor(selectedAgent.status)}>
                      {getStatusText(selectedAgent.status)}
                    </Tag>
                  </div>
                  <div>
                    <Text>描述: </Text>
                    <Text>{selectedAgent.description}</Text>
                  </div>
                </div>
              </div>
              
              <div>
                <Text strong>性能指标</Text>
                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text>完成任务数: </Text>
                    <Text strong>{selectedAgent.performance.tasksCompleted}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>平均执行时间: </Text>
                    <Text strong>{selectedAgent.performance.averageTime}ms</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>成功率: </Text>
                    <Text strong>{selectedAgent.performance.successRate}%</Text>
                  </div>
                  <div>
                    <Text>最后活跃: </Text>
                    <Text>{selectedAgent.performance.lastActive || '从未活跃'}</Text>
                  </div>
                </div>
              </div>
            </Space>
          </div>
        )}
      </Modal>

      {/* Agent配置模态框 */}
      <Modal
        title={`配置Agent - ${selectedAgent ? getAgentTypeName(selectedAgent.type) : ''}`}
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          setSelectedAgent(null);
        }}
        onOk={() => {
          message.success('配置保存成功');
          setConfigModalVisible(false);
        }}
        width={800}
      >
        <div style={{ padding: '20px 0' }}>
          <Text>Agent配置功能开发中...</Text>
        </div>
      </Modal>
    </div>
  );
};

export default AgentList;
