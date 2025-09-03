import React, { useEffect, useState } from 'react';
import { Layout, Tabs, Card, Button, Space, Typography, App } from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAgents } from '../../store/slices/agentSlice';

import AgentOverview from '../../components/Agent/AgentOverview';
import AgentList from '../../components/Agent/AgentList';
import AgentMonitor from '../../components/Agent/AgentMonitor';
import AgentLogs from '../../components/Agent/AgentLogs';
import SystemStatus from '../../components/Agent/SystemStatus';

const { Content } = Layout;
const { Title } = Typography;

const AgentManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { agents, loading } = useAppSelector(state => state.agent);

  useEffect(() => {
    dispatch(fetchAgents());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchAgents()).unwrap();
      message.success('数据刷新成功');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <BarChartOutlined />
          <span>概览</span>
        </Space>
      ),
      children: <AgentOverview agents={agents} />,
    },
    {
      key: 'agents',
      label: (
        <Space>
          <RobotOutlined />
          <span>Agent列表</span>
        </Space>
      ),
      children: <AgentList agents={agents} loading={loading} />,
    },
    {
      key: 'monitor',
      label: (
        <Space>
          <BarChartOutlined />
          <span>性能监控</span>
        </Space>
      ),
      children: <AgentMonitor agents={agents} />,
    },
    {
      key: 'logs',
      label: (
        <Space>
          <FileTextOutlined />
          <span>日志管理</span>
        </Space>
      ),
      children: <AgentLogs />,
    },
    {
      key: 'system',
      label: (
        <Space>
          <SettingOutlined />
          <span>系统状态</span>
        </Space>
      ),
      children: <SystemStatus />,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Agent管理中心
            </Title>
            <Typography.Text type="secondary">
              管理和监控所有AI Agent的运行状态
            </Typography.Text>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              刷新数据
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.info('添加Agent功能开发中...')}
            >
              添加Agent
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default AgentManagement;
