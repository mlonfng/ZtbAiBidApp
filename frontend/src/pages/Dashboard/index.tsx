import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Progress,
  List,
  Button,
  Space,
  Typography,
  Divider,
  Tag,
  Empty,
  Spin,
  Alert,
  Statistic
} from 'antd';
import {
  ProjectOutlined,
  AppstoreOutlined,
  RobotOutlined,
  TeamOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  FolderOpenOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PercentageOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../store';
import { useProjects } from '../../hooks/useProjectData';
import { useDashboardData, useSystemStatus, useRecentActivities } from '../../hooks/useDashboardData';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects({ pageSize: 50 });
  
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData({
    refreshInterval: 60000, // 每分钟刷新一次
  });
  
  const { status: systemStatus, loading: statusLoading, error: statusError, refetch: refetchStatus } = useSystemStatus();
  const { activities: recentActivities, loading: activitiesLoading } = useRecentActivities(5);

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    successRate: 0,
  });

  // 计算统计数据（如果API数据不可用，使用本地计算）
  useEffect(() => {
    if (dashboardData?.stats) {
      // 使用API返回的统计数据
      setStats({
        totalProjects: dashboardData.stats.totalProjects,
        activeProjects: dashboardData.stats.activeProjects,
        completedProjects: dashboardData.stats.completedProjects,
        successRate: dashboardData.stats.successRate,
      });
    } else if (projects.length > 0) {
      // 本地计算统计数据（回退方案）
      const total = projects.length;
      const active = projects.filter(p => p.status === 'in_progress').length;
      const completed = projects.filter(p => p.status === 'completed').length;
      const success = completed > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        totalProjects: total,
        activeProjects: active,
        completedProjects: completed,
        successRate: success,
      });
    }
  }, [projects, dashboardData]);

  // 获取最近项目（最多5个）
  const recentProjects = projects
    .sort((a, b) => {
      const timeA = a.updatedTime || a.updated_at || a.createdTime || a.created_at || '';
      const timeB = b.updatedTime || b.updated_at || b.createdTime || b.created_at || '';
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    })
    .slice(0, 5);

  // 快速操作处理函数
  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleViewProjects = () => {
    navigate('/projects');
  };

  const handleContinueProject = (projectId: string) => {
    navigate(`/projects/${projectId}/step/service-mode`);
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}/edit`);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'processing';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '制作中';
      case 'draft':
        return '草稿';
      case 'archived':
        return '已归档';
      default:
        return '未知';
    }
  };

  // 计算项目进度
  const getProjectProgress = (project: any) => {
    if (project.progress?.total_progress !== undefined) {
      return project.progress.total_progress;
    }
    
    switch (project.status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return Math.floor(Math.random() * 60) + 30; // 30-90%
      case 'draft':
        return Math.floor(Math.random() * 30) + 10; // 10-40%
      default:
        return 0;
    }
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '未知';
    const time = new Date(timeStr);
    if (isNaN(time.getTime())) return '未知';
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      return '刚刚';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSystemStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '正常';
      case 'degraded':
        return '降级';
      case 'down':
        return '宕机';
      case 'warning':
        return '警告';
      case 'critical':
        return '严重';
      default:
        return status;
    }
  };

  const isLoading = dashboardLoading || projectsLoading || statusLoading;
  const hasError = dashboardError || statusError;

  if (hasError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="仪表板加载失败"
          description={
            <div>
              <p>无法加载仪表板数据，请检查网络连接或稍后重试。</p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  refetchDashboard();
                  refetchStatus();
                  refetchProjects();
                }}
                style={{ marginTop: 16 }}
              >
                重新加载
              </Button>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载仪表板数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* 欢迎信息 */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            欢迎回来，{user?.displayName || '用户'}！
          </Title>
          <Text type="secondary">
            今天是 {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => {
            refetchDashboard();
            refetchStatus();
            refetchProjects();
          }}
          loading={isLoading}
        >
          刷新数据
        </Button>
      </div>

      {/* 项目概览统计 */}
      <Card
        title={
          <Space>
            <ProjectOutlined style={{ color: '#1890ff' }} />
            <span>项目概览</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Button type="link" onClick={handleViewProjects}>
            查看全部
          </Button>
        }
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="总项目数"
              value={stats.totalProjects}
              valueStyle={{ color: '#1890ff', fontSize: 32, fontWeight: 'bold' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="进行中"
              value={stats.activeProjects}
              valueStyle={{ color: '#52c41a', fontSize: 32, fontWeight: 'bold' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="已完成"
              value={stats.completedProjects}
              valueStyle={{ color: '#722ed1', fontSize: 32, fontWeight: 'bold' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="成功率"
              value={stats.successRate}
              suffix="%"
              valueStyle={{ color: '#fa8c16', fontSize: 32, fontWeight: 'bold' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 快速操作 */}
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>快速操作</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: 120, cursor: 'pointer' }}
              onClick={handleCreateProject}
            >
              <Space direction="vertical" size="small">
                <PlusOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>创建新项目</div>
                <div style={{ color: '#666', fontSize: 12 }}>上传招标文件开始制作</div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: 120, cursor: 'pointer' }}
              onClick={handleViewProjects}
            >
              <Space direction="vertical" size="small">
                <FolderOpenOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>项目管理</div>
                <div style={{ color: '#666', fontSize: 12 }}>查看和管理所有项目</div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 最近项目 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span>最近项目</span>
              </Space>
            }
            extra={<Button type="link" onClick={handleViewProjects}>查看全部</Button>}
            style={{ minHeight: 500 }}
          >
            {recentProjects.length > 0 ? (
              <List
                dataSource={recentProjects}
                renderItem={(project) => (
                  <List.Item
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <ProjectOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            <span style={{ fontSize: 16, fontWeight: 'bold' }}>{project.name}</span>
                            <Tag
                              color={getStatusColor(project.status || 'draft')}
                              style={{ marginLeft: 12 }}
                            >
                              {getStatusText(project.status || 'draft')}
                            </Tag>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Progress
                              percent={getProjectProgress(project)}
                              size="small"
                              strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            创建时间: {new Date(project.createdTime || project.created_at || '').toLocaleDateString()} |
                            最后更新: {formatTime(project.updatedTime || project.updated_at || project.createdTime || project.created_at || '')}
                          </div>
                        </div>
                        <div style={{ marginLeft: 16 }}>
                          <Space>
                            {project.status === 'in_progress' && (
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => handleContinueProject(project.id)}
                              >
                                继续制作
                              </Button>
                            )}
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewProject(project.id)}
                            >
                              查看
                            </Button>
                          </Space>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="暂无项目"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={handleCreateProject}>
                  创建第一个项目
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        {/* 系统状态 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#1890ff' }} />
                <span>系统状态</span>
              </Space>
            }
            style={{ minHeight: 500 }}
          >
            {systemStatus ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* AI服务状态 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>AI服务</span>
                    <Tag color={getSystemStatusColor(systemStatus.aiService.status)}>
                      {getSystemStatusText(systemStatus.aiService.status)}
                    </Tag>
                  </div>
                  <Progress 
                    percent={systemStatus.aiService.availability} 
                    size="small" 
                    strokeColor={systemStatus.aiService.status === 'normal' ? '#52c41a' : '#faad14'}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {systemStatus.aiService.message}
                  </div>
                </div>

                {/* 数据库状态 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>数据库</span>
                    <Tag color={getSystemStatusColor(systemStatus.database.status)}>
                      {getSystemStatusText(systemStatus.database.status)}
                    </Tag>
                  </div>
                  <Progress 
                    percent={systemStatus.database.availability} 
                    size="small" 
                    strokeColor={systemStatus.database.status === 'normal' ? '#52c41a' : '#faad14'}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {systemStatus.database.message}
                  </div>
                </div>

                {/* 存储空间 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>存储空间</span>
                    <Tag color={getSystemStatusColor(systemStatus.storage.status)}>
                      {systemStatus.storage.percentage}%
                    </Tag>
                  </div>
                  <Progress 
                    percent={systemStatus.storage.percentage} 
                    size="small" 
                    strokeColor={
                      systemStatus.storage.status === 'normal' ? '#52c41a' : 
                      systemStatus.storage.status === 'warning' ? '#faad14' : '#ff4d4f'
                    }
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    已使用 {systemStatus.storage.used}GB / {systemStatus.storage.total}GB
                  </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* 今日统计 */}
                {dashboardData?.stats.todayStats && (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 12 }}>今日统计</div>
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Statistic
                          title="新建项目"
                          value={dashboardData.stats.todayStats.newProjects}
                          valueStyle={{ color: '#1890ff', fontSize: 20, fontWeight: 'bold' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="完成项目"
                          value={dashboardData.stats.todayStats.completedProjects}
                          valueStyle={{ color: '#52c41a', fontSize: 20, fontWeight: 'bold' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="AI调用"
                          value={dashboardData.stats.todayStats.aiCalls}
                          valueStyle={{ color: '#722ed1', fontSize: 20, fontWeight: 'bold' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="文件导出"
                          value={dashboardData.stats.todayStats.documentExports}
                          valueStyle={{ color: '#fa8c16', fontSize: 20, fontWeight: 'bold' }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
                <div style={{ marginTop: 16, color: '#999' }}>加载系统状态中...</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;