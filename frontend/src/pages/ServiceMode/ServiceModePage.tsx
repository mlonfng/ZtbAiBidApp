import React, { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Space, Alert, Tag, message, Spin, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  GiftOutlined,
  RobotOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { serviceStepAPI } from '../../services/api';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';

import { useStepProgress } from '../../hooks/useStepProgress';
import { handleStepApiError } from '../../utils/errorHandler';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import styles from './ServiceModePage.module.scss';

const { Title, Text, Paragraph } = Typography;

interface ServiceMode {
  key: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  limitations: string[];
  price: string;
  recommended?: boolean;
}

const ServiceModePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();

    const [selectedMode, setSelectedMode] = useState<string>('ai');
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [availableModes, setAvailableModes] = useState<ServiceMode[]>([]);

  // 使用步骤进度管理Hook
  const { markStepCompleted } = useStepProgress(projectId || '', 'service-mode');

  const serviceModes: ServiceMode[] = [
    {
      key: 'free',
      name: '免费模式',
      icon: <GiftOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: '基础功能体验，适合初次使用和简单项目',
      features: [
        '基础项目管理',
        '简单文件上传',
        '基础模板使用',
        '标准格式导出',
      ],
      limitations: [
        '每月限制5个项目',
        '文件大小限制10MB',
        '不支持AI智能分析',
        '基础技术支持',
      ],
      price: '免费',
    },
    {
      key: 'ai',
      name: 'AI智能模式',
      icon: <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      description: 'AI驱动的智能投标文件生成，大幅提升效率和质量',
      features: [
        '智能招标文件分析',
        'AI辅助内容生成',
        '自动框架生成',
        '智能格式优化',
        '多格式文档导出',
        '实时协作功能',
      ],
      limitations: [
        '需要稳定网络连接',
        '依赖AI服务可用性',
      ],
      price: '按使用量计费',
      recommended: true,
    },
    {
      key: 'manual',
      name: '人工模式',
      icon: <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      description: '专业人工服务，提供定制化的投标文件编制服务',
      features: [
        '专业顾问一对一服务',
        '定制化文件编制',
        '行业专家审核',
        '质量保证承诺',
        '7x24小时支持',
        '无限修改次数',
      ],
      limitations: [
        '服务周期较长',
        '需要预约排队',
      ],
      price: '按项目报价',
    },
  ];

  // 加载当前服务模式和可用模式
  useEffect(() => {
    let cancelled = false;

    // 从 project 对象同步当前模式
    if (project?.service_mode) {
      setCurrentMode(project.service_mode);
      setSelectedMode(project.service_mode);
    }

    const loadAvailableModes = async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        // 使用硬编码的服务模式数据，避免调用不存在的API
        const modes = serviceModes;
        if (!cancelled) {
          setAvailableModes(modes);
        }
      } catch (error) {
        message.error('加载可用服务模式失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAvailableModes();
    return () => { cancelled = true; };
  }, [project]);

  const handleApplyMode = useCallback(async (goToNextStep: boolean) => {
    console.log('handleApplyMode called with projectId:', projectId);
    console.log('handleApplyMode called with selectedMode:', selectedMode);
    console.log('URL pathname:', window.location.pathname);

    setApplying(true);
    try {
      let response: any;
      if (!projectId) {
        console.error('ProjectId is undefined or null:', projectId);
        message.error(`项目ID不存在，无法保存服务模式。当前值: ${projectId}`);
        setApplying(false);
        return;
      }
      response = await serviceStepAPI.execute(projectId, selectedMode);

      if (response.success) {
        const selectedModeInfo = availableModes.find(mode => mode.key === selectedMode);
        message.success(`服务模式已设置为: ${selectedModeInfo?.name}`);
        setCurrentMode(selectedMode);

        markStepCompleted({ currentMode: selectedMode });
        if (goToNextStep) {
          navigate(`/projects/${projectId}/step/file-formatting`);
        }
      } else {
        message.error(response.message || '设置服务模式失败');
      }
    } catch (error) {
      // 使用新的错误处理机制
      handleStepApiError(error, 'service-mode', 'execute', {
        customMessage: '设置服务模式失败，请重试'
      });
    } finally {
      setApplying(false);
    }
  }, [projectId, selectedMode, navigate, markStepCompleted, availableModes]);

  const renderModeCard = (mode: ServiceMode) => (
    <div
      key={mode.key}
      className={`${styles.modeCard} ${selectedMode === mode.key ? styles.selected : ''}`}
      onClick={() => setSelectedMode(mode.key)}
    >
      {mode.recommended && <div className={styles.recommendTag}>推荐</div>}
      <span className={styles.cardIcon} style={{ color: mode.key === 'free' ? '#52c41a' : mode.key === 'ai' ? '#1890ff' : '#722ed1' }}>
        {mode.icon}
      </span>
      <Title level={5} className={styles.cardTitle}>{mode.name}</Title>
      <Text className={styles.cardPrice}>{mode.price}</Text>
      <ul className={styles.featureList}>
        {mode.features.map((feature, index) => (
          <li key={index} className={styles.featureItem}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text>{feature}</Text>
          </li>
        ))}
      </ul>
    </div>
  );

  const selectedModeInfo = availableModes.find(mode => mode.key === selectedMode);

  // 使用可用模式数据，如果没有则使用默认数据
  const displayModes = availableModes.length > 0 ? availableModes : serviceModes;

  if (isProjectLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (projectError) {
    return <Result status="error" title="加载项目失败" subTitle={projectError} />;
  }

  const renderCurrentSelection = () => {
    const mode = availableModes.find(m => m.key === selectedMode);
    if (!mode) return null;
    return (
      <div className={styles.currentSelection}>
        <Title level={5}>当前选择</Title>
        <Space align="center" size="large">
          <span style={{ fontSize: 24, color: mode.key === 'free' ? '#52c41a' : mode.key === 'ai' ? '#1890ff' : '#722ed1' }}>{mode.icon}</span>
          <Text strong>{mode.name}</Text>
          <Tag color={mode.key === 'free' ? 'green' : mode.key === 'ai' ? 'blue' : 'purple'}>{mode.price}</Tag>
        </Space>
        <Paragraph type="secondary" style={{ marginTop: 16 }}>{mode.description}</Paragraph>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <ProjectInfoHeader project={project} isLoading={isProjectLoading} onRefresh={() => projectId && dispatch(getProject(projectId))} />
      <Alert
        message="选择适合您的服务模式"
        description="根据您的需求和预算选择最适合的服务模式。您可以在项目设置中随时更改服务模式。"
        type="info"
        showIcon
        className={styles.selectionInfo}
      />

      <div className={styles.modeCardsContainer}>
        {availableModes.map(renderModeCard)}
      </div>

      {selectedMode && renderCurrentSelection()}

      <div className={styles.footerButtons}>
        <Space>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>返回项目</Button>
          <Button onClick={() => handleApplyMode(false)} loading={applying}>保存</Button>
          <Button type="primary" onClick={() => handleApplyMode(true)} loading={applying}>保存并下一步</Button>
        </Space>
      </div>
    </div>
  );
};

export default ServiceModePage;
