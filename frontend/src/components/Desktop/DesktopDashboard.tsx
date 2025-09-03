import React, { useEffect } from 'react';
import { Card, Row, Col, Button, List, Progress, Typography, Space, Tag, Statistic, Alert } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  RobotOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDesktopApp } from '../../hooks/useDesktopApp';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  initializeDesktopApp,

  refreshSystemStatus,
  syncOfflineData,
  setCurrentProject
} from '../../store/slices/desktopSlice';

const { Title, Text, Paragraph } = Typography;

interface RecentProject {
  id: string;
  name: string;
  progress: number;
  lastModified: string;
  status: 'active' | 'completed' | 'paused';
  type: string;
}

interface SystemStatus {
  backend: boolean;
  aiModel: 'local' | 'remote' | 'hybrid';
  database: boolean;
  network: 'online' | 'offline' | 'unstable';
}

const DesktopDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isElectron, checkSystemStatus } = useDesktopApp();

  // 从Redux store获取状态
  const {
    localProjects,
    systemStatus,
    aiConfig,
    offlineStatus,
    storageStats,
    loading,
    error
  } = useAppSelector(state => state.desktop);

  // 初始化桌面应用
  useEffect(() => {
    dispatch(initializeDesktopApp());
  }, [dispatch]);

  // 定期刷新系统状态（仅在组件挂载时设置一次）
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(refreshSystemStatus());
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [dispatch]);

  // 处理项目操作
  const handleOpenProject = (projectId: string) => {
    const project = localProjects.find(p => p.id === projectId);
    if (project) {
      dispatch(setCurrentProject(project));
      navigate(`/projects/${projectId}/workflow`);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    // 这里可以添加确认对话框
    // dispatch(deleteLocalProject(projectId));
  };

  const handleSyncData = () => {
    dispatch(syncOfflineData());
  };

  const handleRefreshStatus = () => {
    dispatch(refreshSystemStatus());
  };

  // 获取状态颜色
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'processing';
      case 'completed':
        return 'success';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'paused':
        return '已暂停';
      default:
        return '未知';
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 桌面应用标题栏 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          ZtbAi智能投标系统 - 项目管理中心
        </Title>
        <Text type="secondary">
          {isElectron ? '桌面版' : 'Web版'} | 本地化智能投标文件生成平台
        </Text>
      </div>

      {/* 系统状态栏 */}
      {isElectron && (
        <Alert
          message={
            <Space>
              <span>系统状态:</span>
              <Tag color={systemStatus.backend ? 'green' : 'red'}>
                🟢 本地服务: {systemStatus.backend ? '正常' : '异常'}
              </Tag>
              <Tag color="blue">
                🤖 AI模式: {aiConfig.mode === 'hybrid' ? '混合' : aiConfig.mode === 'local' ? '本地' : '远程'}
              </Tag>
              <Tag color={systemStatus.database ? 'green' : 'red'}>
                💾 数据库: {systemStatus.database ? '正常' : '异常'}
              </Tag>
              <Tag color={offlineStatus.isOnline ? 'green' : 'red'}>
                🌐 网络: {offlineStatus.isOnline ? '在线' : '离线'}
              </Tag>
              {offlineStatus.pendingTasks > 0 && (
                <Tag color="orange">
                  📋 待同步: {offlineStatus.pendingTasks}
                </Tag>
              )}
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRefreshStatus}
                loading={loading.sync}
              >
                刷新
              </Button>
            </Space>
          }
          type="info"
          style={{ marginBottom: '24px' }}
          action={
            offlineStatus.pendingTasks > 0 ? (
              <Button
                size="small"
                type="primary"
                icon={<SyncOutlined />}
                onClick={handleSyncData}
                loading={loading.sync}
              >
                同步数据
              </Button>
            ) : undefined
          }
        />
      )}

      <Row gutter={[24, 24]}>
        {/* 左侧：项目操作区域 */}
        <Col xs={24} lg={16}>
          {/* 项目操作卡片 */}
          <Card title="项目操作" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/projects/new')}
                  style={{ width: '100%', height: '80px' }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>新建项目</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>创建新的投标项目</div>
                  </div>
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  size="large"
                  icon={<FolderOpenOutlined />}
                  onClick={() => navigate('/projects')}
                  style={{ width: '100%', height: '80px' }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>打开项目</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>打开现有项目</div>
                  </div>
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  size="large"
                  icon={<UnorderedListOutlined />}
                  onClick={() => navigate('/projects')}
                  style={{ width: '100%', height: '80px' }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>查看所有项目</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>管理所有项目</div>
                  </div>
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 最近项目 */}
          <Card
            title="最近项目"
            style={{ marginBottom: '24px' }}
            loading={loading.projects}
          >
            <List
              dataSource={localProjects.slice(0, 5)} // 只显示最近5个项目
              renderItem={(project) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      打开
                    </Button>,
                    <Button
                      type="link"
                      danger
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      删除
                    </Button>,
                    <Button type="link">
                      导出
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{project.name}</span>
                        <Tag color={getStatusColor(project.status || 'draft')}>
                          {getStatusText(project.status || 'draft')}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <Text type="secondary">类型: {project.type}</Text>
                          <Text type="secondary" style={{ marginLeft: '16px' }}>
                            最后修改: {project.lastModified}
                          </Text>
                        </div>
                        <Progress
                          percent={project.progress}
                          size="small"
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧：系统管理和统计 */}
        <Col xs={24} lg={8}>
          {/* 系统管理 */}
          <Card title="系统管理" style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                icon={<SettingOutlined />}
                onClick={() => navigate('/settings')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                系统设置
              </Button>
              <Button
                icon={<RobotOutlined />}
                onClick={() => navigate('/service-mode')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                AI配置
              </Button>
              <Button
                icon={<BarChartOutlined />}
                onClick={() => navigate('/system-monitor')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                系统状态
              </Button>
            </Space>
          </Card>

          {/* 项目统计 */}
          <Card title="项目统计" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总项目数"
                  value={localProjects.length}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已完成"
                  value={localProjects.filter(p => p.status === 'completed').length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12} style={{ marginTop: '16px' }}>
                <Statistic
                  title="进行中"
                  value={localProjects.filter(p => p.status === 'active').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12} style={{ marginTop: '16px' }}>
                <Statistic
                  title="已暂停"
                  value={localProjects.filter(p => p.status === 'paused').length}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 存储统计 */}
          <Card title="存储统计" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="已使用"
                  value={(storageStats.totalSize / 1024 / 1024).toFixed(2)}
                  suffix="MB"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="可用空间"
                  value={(storageStats.available / 1024 / 1024).toFixed(2)}
                  suffix="MB"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
            <Progress
              percent={Math.round((storageStats.totalSize / (storageStats.totalSize + storageStats.available)) * 100)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ marginTop: '16px' }}
            />
          </Card>

          {/* 使用提示 */}
          <Card title="使用提示">
            <Paragraph style={{ fontSize: '14px' }}>
              <Text strong>桌面应用优势:</Text>
              <br />
              • 完全本地化部署，数据安全可控
              <br />
              • 支持离线工作，无需网络连接
              <br />
              • 双模式AI，本地和远程智能切换
              <br />
              • 项目导向设计，工作流程清晰
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DesktopDashboard;
