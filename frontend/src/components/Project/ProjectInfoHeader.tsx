import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import { Typography, Descriptions, Tag, Space, Tooltip, Button, Skeleton, Progress, message } from 'antd';
import { Project } from '../../store/slices/projectSlice';
import dayjs from 'dayjs';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOutlined, // Using FolderOutlined for consistency
  InfoCircleOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  CopyOutlined,
  FileDoneOutlined // Icon for file count
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProjectInfoHeaderProps {
  project: Project | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProjectInfoHeader: React.FC<ProjectInfoHeaderProps> = ({ project, isLoading, onRefresh }) => {
  // Skeleton 占位
  if (isLoading) {
    return (
      <div style={{ marginBottom: 16, padding: '16px 24px', background: '#fff' }}>
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
        <Skeleton active paragraph={{ rows: 1 }} title={false} style={{ marginTop: 8 }} />
      </div>
    );
  }

  if (!project) return null;

  const getStatusTag = (status: string | null) => {
    switch (status) {
      case 'in_progress':
        return <Tag color="processing">进行中</Tag>;
      case 'completed':
        return <Tag color="success">已完成</Tag>;
      case 'draft':
        return <Tag>草稿</Tag>;
      default:
        return <Tag>{status || '未知'}</Tag>;
    }
  };

  const openProjectFolder = async () => {
    try {
      const api = (window as any).electronAPI;
      const path = project.project_path;
      if (!api?.openPath || !path) return message.warning('未检测到项目目录');
      const res = await api.openPath(path);
      if (!res?.success) message.error(res?.message || '打开目录失败');
    } catch (e) {
      message.error('打开目录失败');
    }
  };

  const copyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(project.id);
      message.success('项目ID已复制');
    } catch {
      message.warning('复制失败');
    }
  };

  const copyProjectPath = async () => {
    if (!project.project_path) {
      message.info('项目路径不存在');
      return;
    }
    try {
      await navigator.clipboard.writeText(project.project_path);
      message.success('项目路径已复制');
    } catch {
      message.warning('复制失败');
    }
  };

  const totalProgress = project.progress?.total_progress ?? undefined;

  return (
    <PageHeader
      ghost={false}
      title={
        <Space size={8}>
          <Title level={4} style={{ margin: 0 }}>{project.name || '未命名项目'}</Title>
          <Tooltip title={`项目ID：${project.id}`}>
            <Button size="small" icon={<CopyOutlined />} onClick={copyProjectId} />
          </Tooltip>
          {getStatusTag(project.status)}
          {project.service_mode && <Tag color="blue">{project.service_mode}</Tag>}
        </Space>
      }
      style={{ marginBottom: 16, padding: '16px 24px', background: '#fff' }}
      extra={
        <Space>
          {typeof totalProgress === 'number' && (
            <Space>
              <Text type="secondary">总体进度</Text>
              <Progress percent={Math.round(totalProgress)} size="small" style={{ width: 120 }} />
            </Space>
          )}
          <Tooltip title="打开项目目录">
            <Button icon={<FolderOpenOutlined />} onClick={openProjectFolder} />
          </Tooltip>
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={onRefresh} />
          </Tooltip>
        </Space>
      }
    >
      <Descriptions size="small" column={3}>
        <Descriptions.Item label={<Space><FileTextOutlined />招标文件</Space>}>
          {project.bid_document_name || '未命名'}
        </Descriptions.Item>
        <Descriptions.Item label={<Space><InfoCircleOutlined />当前步骤</Space>}>
          {project.current_step || '未开始'}
        </Descriptions.Item>
        <Descriptions.Item label={<Space><FileDoneOutlined />文件总数</Space>}>
          {project.files?.length ?? 0}
        </Descriptions.Item>
        <Descriptions.Item label={<Space><FolderOutlined />项目路径</Space>} span={2}>
          <Space>
            <Text style={{ maxWidth: 400 }} ellipsis={{ tooltip: project.project_path }}>
              {project.project_path || '未指定'}
            </Text>
            <Tooltip title="复制路径">
              <Button size="small" icon={<CopyOutlined />} onClick={copyProjectPath} disabled={!project.project_path} />
            </Tooltip>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={<Space><ClockCircleOutlined />创建时间</Space>}>
          {project.created_at ? dayjs(project.created_at).format('YYYY-MM-DD HH:mm:ss') : '未知'}
        </Descriptions.Item>
        {project.updated_at && (
          <Descriptions.Item label={<Space><ClockCircleOutlined />更新时间</Space>}>
            {dayjs(project.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        )}
      </Descriptions>
    </PageHeader>
  );
};

export default ProjectInfoHeader;
