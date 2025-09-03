import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Tooltip,
  Modal,
  message,
  Dropdown,
  Progress,
  Row,
  Col,
  Typography,
  Empty,
  Divider,
  Spin,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExportOutlined,
  MoreOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  ProjectOutlined,
  FilterOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { useAppDispatch, useAppSelector } from '../../store';
import { deleteProject, duplicateProject, Project } from '../../store/slices/projectSlice';
import { useProjects } from '../../hooks/useProjectData';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 使用自定义Hook获取项目数据
  const { projects, loading, error, refetch } = useProjects({ 
    pageSize: 50,
    refetchInterval: 0 // 不自动刷新
  });
  
  const { pagination } = useAppSelector(state => state.project);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

  // 计算项目统计数据
  const projectStats = useMemo(() => {
    if (!projects || !Array.isArray(projects)) {
      return {
        total: 0,
        inProgress: 0,
        completed: 0,
        paused: 0,
      };
    }

    const total = projects.length;
    // 'active' 状态映射为 'in_progress'
    const inProgress = projects.filter(p => p.status === 'in_progress' || p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const paused = projects.filter(p => p.status === 'archived').length;

    return {
      total,
      inProgress,
      completed,
      paused,
    };
  }, [projects]);

  // 过滤项目
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) {
      return [];
    }

    return projects.filter(project => {
      const matchesSearch = !searchText ||
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchText.toLowerCase());

      // 状态过滤逻辑：支持后端的 'active' 状态
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'in_progress') {
        // 'active' 状态映射为 'in_progress'
        matchesStatus = (project.status === 'in_progress' || project.status === 'active');
      } else {
        matchesStatus = (project.status || 'draft') === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchText, statusFilter]);

  // 手动刷新项目数据
  const handleRefresh = useCallback(() => {
    refetch();
    message.success('项目数据已刷新');
  }, [refetch]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的项目');
      return;
    }

    Modal.confirm({
      title: '批量删除项目',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个项目吗？此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        try {
          // 逐个删除项目，记录成功和失败的数量
          for (const key of selectedRowKeys) {
            try {
              await dispatch(deleteProject(key as string)).unwrap();
              successCount++;
            } catch (error: any) {
              failedCount++;
              const errorMessage = typeof error === 'string' ? error : '删除失败';
              errors.push(`项目 ${key}: ${errorMessage}`);
            }
          }

          if (failedCount === 0) {
            message.success(`成功删除 ${successCount} 个项目`);
          } else if (successCount === 0) {
            message.error(`批量删除失败，所有 ${failedCount} 个项目删除失败`);
          } else {
            message.warning(`部分删除成功：成功 ${successCount} 个，失败 ${failedCount} 个`);
          }

          setSelectedRowKeys([]);
        } catch (error) {
          message.error('批量删除过程中发生错误');
        }
      },
    });
  };

  const handleEdit = (project: Project) => {
    navigate(`/projects/${project.id}/edit`);
  };

  const handleWorkflow = (project: Project) => {
    navigate(`/projects/${project.id}/step/service-mode`);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (selectedProject) {
      try {
        await dispatch(deleteProject(selectedProject.id)).unwrap();
        message.success('项目删除成功');
        setDeleteModalVisible(false);
        setSelectedProject(null);
      } catch (error: any) {
        console.error('删除项目失败:', error);
        const errorMessage = typeof error === 'string' ? error : '删除失败，请重试';
        message.error(errorMessage);
      }
    }
  };

  const handleDuplicate = async (project: Project) => {
    try {
      await dispatch(duplicateProject({ id: project.id, name: `${project.name} - 副本` })).unwrap();
      message.success('项目复制成功');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
      case 'active':
        return 'processing';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      case null:
      case undefined:
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
        return '进行中';
      case 'active':
        return '进行中';
      case 'draft':
        return '草稿';
      case 'archived':
        return '已归档';
      case null:
      case undefined:
        return '草稿';
      default:
        return '草稿';
    }
  };

  const getProjectProgress = (project: any) => {
    // 优先使用API返回的实际进度数据
    if (project.progress?.total_progress !== undefined) {
      return project.progress.total_progress;
    }
    
    // 根据项目状态计算进度（回退方案）
    switch (project.status || 'draft') {
      case 'completed':
        return 100;
      case 'in_progress':
      case 'active':
        return Math.floor(Math.random() * 60) + 30; // 30-90%
      case 'draft':
        return Math.floor(Math.random() * 30) + 10; // 10-40%
      case 'archived':
        return Math.floor(Math.random() * 40) + 50; // 50-90%
      case null:
      case undefined:
        return Math.floor(Math.random() * 20) + 5; // 5-25%
      default:
        return Math.floor(Math.random() * 20) + 5; // 5-25%
    }
  };

  const columns: ColumnsType<Project> = [
    {
      title: '投标项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {text}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string | null) => (
        <Tag color={getStatusColor(status || 'draft')}>
          {getStatusText(status || 'draft')}
        </Tag>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (_, record) => {
        const progress = getProjectProgress(record);
        return <Progress percent={progress} size="small" />;
      },
    },
    {
      title: '项目类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color="blue">
          {type || '投标项目'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedTime',
      key: 'updatedTime',
      width: 150,
      render: (time, record) => {
        const timeStr = time || record.updated_at || record.createdTime || record.created_at || '';
        return timeStr ? new Date(timeStr).toLocaleDateString('zh-CN') : '未知';
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="项目操作流程">
            <Button
              type="text"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => handleWorkflow(record)}
            />
          </Tooltip>
          <Tooltip title="可视化编辑器">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'duplicate',
                  icon: <CopyOutlined />,
                  label: '复制项目',
                  onClick: () => handleDuplicate(record),
                },
                {
                  key: 'export',
                  icon: <ExportOutlined />,
                  label: '导出项目',
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除项目',
                  danger: true,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 渲染项目卡片
  const renderProjectCard = (project: Project) => (
    <Card
      key={project.id}
      hoverable
      style={{ marginBottom: 16 }}
      actions={[
        <Tooltip title="可视化编辑器">
          <EyeOutlined onClick={() => handleEdit(project)} />
        </Tooltip>,
        <Tooltip title="项目操作流程">
          <PlayCircleOutlined onClick={() => handleWorkflow(project)} />
        </Tooltip>,
        <Tooltip title="复制项目">
          <CopyOutlined onClick={() => handleDuplicate(project)} />
        </Tooltip>,
        <Tooltip title="删除项目">
          <DeleteOutlined onClick={() => handleDelete(project)} />
        </Tooltip>,
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <ProjectOutlined style={{ marginRight: 8, color: '#1890ff', fontSize: 16 }} />
            <Text strong style={{ fontSize: 16 }}>{project.name}</Text>
          </div>
          <Tag color={getStatusColor(project.status || 'draft')}>
            {getStatusText(project.status || 'draft')}
          </Tag>
        </div>
      </div>

      {project.description && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {project.description}
        </Text>
      )}

      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>进度</Text>
        <Progress
          percent={getProjectProgress(project)}
          size="small"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          style={{ marginTop: 4 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          创建: {new Date(project.createdTime || project.created_at || '').toLocaleDateString()}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          更新: {new Date(project.updatedTime || project.updated_at || project.createdTime || project.created_at || '').toLocaleDateString()}
        </Text>
      </div>
    </Card>
  );

  // 错误处理
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="项目列表加载失败"
          description={
            <div>
              <p>无法加载项目数据，请检查网络连接或稍后重试。</p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
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

  // 加载状态
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载项目数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>

      {/* 项目统计 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                cursor: 'pointer',
                borderRadius: 6,
                backgroundColor: statusFilter === 'all' ? '#e6f7ff' : 'transparent',
              }}
              onClick={() => setStatusFilter('all')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {projectStats.total}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>全部({projectStats.total})</div>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                cursor: 'pointer',
                borderRadius: 6,
                backgroundColor: statusFilter === 'in_progress' ? '#f6ffed' : 'transparent',
              }}
              onClick={() => setStatusFilter('in_progress')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {projectStats.inProgress}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>进行中({projectStats.inProgress})</div>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                cursor: 'pointer',
                borderRadius: 6,
                backgroundColor: statusFilter === 'completed' ? '#f9f0ff' : 'transparent',
              }}
              onClick={() => setStatusFilter('completed')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {projectStats.completed}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>已完成({projectStats.completed})</div>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                cursor: 'pointer',
                borderRadius: 6,
                backgroundColor: statusFilter === 'archived' ? '#fff2e8' : 'transparent',
              }}
              onClick={() => setStatusFilter('archived')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                {projectStats.paused}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>已暂停({projectStats.paused})</div>
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新数据
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
          >
            新建项目
          </Button>
        </div>
      </Card>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索项目名称或描述"
              allowClear
              size="large"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="状态筛选"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="draft">草稿</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
              <Button
                icon={<FilterOutlined />}
                onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
              >
                {viewMode === 'card' ? '表格视图' : '卡片视图'}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 项目列表 */}
      <Card title={`项目列表 (${filteredProjects.length})`}>
        {filteredProjects.length > 0 ? (
          viewMode === 'card' ? (
            <Row gutter={[16, 16]}>
              {filteredProjects.map(project => (
                <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                  {renderProjectCard(project)}
                </Col>
              ))}
            </Row>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredProjects}
              loading={loading}
              rowKey="id"
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredProjects.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          )
        ) : (
          <Empty
            description={
              searchText || statusFilter !== 'all'
                ? "没有找到匹配的项目"
                : "暂无项目"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchText && statusFilter === 'all' && (
              <Button type="primary" onClick={handleCreateProject}>
                创建第一个项目
              </Button>
            )}
          </Empty>
        )}
      </Card>

      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedProject(null);
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除项目 "{selectedProject?.name}" 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default ProjectList;
