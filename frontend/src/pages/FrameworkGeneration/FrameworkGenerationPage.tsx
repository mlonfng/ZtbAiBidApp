import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Tree, Alert, Steps, Row, Col, Tag, Spin, Modal, Form, Input, Select, message, Checkbox, Descriptions, Progress, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BuildOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  DownOutlined,
  SaveOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { frameworkStepAPI } from '../../services/api';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';


const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
// eslint-disable-next-line @typescript-eslint/no-unused-vars

const { Option } = Select;

interface FrameworkNode {
  key: string;
  title: string;
  children?: FrameworkNode[];
  type: 'section' | 'chapter' | 'content';
  required: boolean;
  weight?: number;
  description?: string;
  status?: 'pending' | 'generated' | 'completed';
}

const FrameworkGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();

  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedFrameworkType, setSelectedFrameworkType] = useState('standard');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<FrameworkNode | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [stepStatus, setStepStatus] = useState<'pending'|'in_progress'|'completed'|'error'|'cancelled'>('pending');
  const [stepProgress, setStepProgress] = useState<number>(0);

  const [frameworkResult, setFrameworkResult] = useState<any>(null);

  // 模拟投标文件框架数据
  const [frameworkData, setFrameworkData] = useState<FrameworkNode[]>([
    {
      key: '1',
      title: '第一部分：商务文件',
      type: 'section',
      required: true,
      weight: 30,
      status: 'completed',
      children: [
        {
          key: '1-1',
          title: '第一章：投标函及投标函附录',
          type: 'chapter',
          required: true,
          status: 'completed',
          children: [
            { key: '1-1-1', title: '投标函', type: 'content', required: true, status: 'completed' },
            { key: '1-1-2', title: '投标函附录', type: 'content', required: true, status: 'completed' },
          ],
        },
        {
          key: '1-2',
          title: '第二章：法定代表人身份证明',
          type: 'chapter',
          required: true,
          status: 'generated',
          children: [
            { key: '1-2-1', title: '法定代表人身份证明书', type: 'content', required: true, status: 'generated' },
          ],
        },
        {
          key: '1-3',
          title: '第三章：授权委托书',
          type: 'chapter',
          required: true,
          status: 'pending',
          children: [
            { key: '1-3-1', title: '授权委托书', type: 'content', required: true, status: 'pending' },
          ],
        },
      ],
    },
    {
      key: '2',
      title: '第二部分：技术文件',
      type: 'section',
      required: true,
      weight: 60,
      status: 'generated',
      children: [
        {
          key: '2-1',
          title: '第一章：技术方案',
          type: 'chapter',
          required: true,
          status: 'generated',
          children: [
            { key: '2-1-1', title: '项目理解', type: 'content', required: true, status: 'generated' },
            { key: '2-1-2', title: '技术路线', type: 'content', required: true, status: 'pending' },
            { key: '2-1-3', title: '实施方案', type: 'content', required: true, status: 'pending' },
          ],
        },
        {
          key: '2-2',
          title: '第二章：设备配置方案',
          type: 'chapter',
          required: true,
          status: 'pending',
          children: [
            { key: '2-2-1', title: '设备清单', type: 'content', required: true, status: 'pending' },
            { key: '2-2-2', title: '技术参数', type: 'content', required: true, status: 'pending' },
          ],
        },
      ],
    },
    {
      key: '3',
      title: '第三部分：资格证明文件',
      type: 'section',
      required: true,
      weight: 10,
      status: 'pending',
      children: [
        {
          key: '3-1',
          title: '第一章：企业资质证明',
          type: 'chapter',
          required: true,
          status: 'pending',
          children: [
            { key: '3-1-1', title: '营业执照', type: 'content', required: true, status: 'pending' },
            { key: '3-1-2', title: '资质证书', type: 'content', required: true, status: 'pending' },
          ],
        },
      ],
    },
  ]);

  const steps = [
    { title: '分析招标文件', description: '提取关键信息和要求' },
    { title: '生成文件框架', description: 'AI智能生成投标文件结构' },

    { title: '调整框架结构', description: '根据需要调整和优化' },
    { title: '确认框架', description: '确认最终框架结构' },
  ];

  // 加载框架数据
  useEffect(() => {
    if (projectId) {
      loadExistingFramework();
    }
  }, [projectId]);

  const loadExistingFramework = async () => {
    if (!projectId) return;

    try {
      const response = await frameworkStepAPI.getResult(projectId);
      if (response.success && response.data) {
        setFrameworkResult(response.data);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('加载框架失败:', error);
    }
  };

  // 生成框架
  const handleGenerateFrameworkAPI = async () => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setGenerating(true);
      setCurrentStep(1);

      // 调用 Step API
      const response = await frameworkStepAPI.execute(projectId, selectedFrameworkType, selectedTemplate);

      if (response.success) {
        // 等待进入运行态再提示，提高体验
        const enteredRunning = await (async () => {
          for (let i = 0; i < 12; i++) {
            try {
              const st = await frameworkStepAPI.getStatus(projectId);
              if (st?.success && st.data) {
                const { status, progress } = st.data;
                setStepStatus((status as any) || 'in_progress');
                setStepProgress(progress || 0);
                if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
                  return true;
                }
              }
            } catch {}
            await new Promise(r => setTimeout(r, 1000));
          }
          return false;
        })();
        if (enteredRunning) message.success('框架生成任务已启动'); else message.info('框架生成任务已提交，正在排队...');

        // 轮询至完成
        const poll = async () => {
          try {
            const st = await frameworkStepAPI.getStatus(projectId);
            if (st.success && st.data) {
              setStepStatus((st.data.status as any) || 'in_progress');
              setStepProgress(st.data.progress || 0);
              if (st.data.status === 'completed') {
                const res = await frameworkStepAPI.getResult(projectId);
                if (res.success) setFrameworkResult(res.data);
                setGenerating(false);
                setCurrentStep(3);
                message.success('框架生成完成');
                return;
              }
              if (st.data.status === 'error' || st.data.status === 'cancelled') {
                setGenerating(false);
                message.error(`框架生成任务${st.data.status === 'error' ? '失败' : '已取消'}`);
                return;
              }
            }
          } catch {}
          setTimeout(poll, 1500);
        };
        poll();
      } else {
        message.error(response.message || '框架生成失败');
        setGenerating(false);
      }
    } catch (error) {
      console.error('框架生成失败:', error);
      message.error('框架生成失败');
      setGenerating(false);
    }
  };

  // 保存框架
  const handleSaveFramework = async () => {
    if (!projectId || !frameworkResult) {
      message.error('没有可保存的框架数据');
      return;
    }

    try {
      setLoading(true);
      message.info('框架保存功能需要后端API支持');
    } catch (error) {
      console.error('框架保存失败:', error);
      message.error('框架保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证框架
  const handleValidateFramework = async () => {
    if (!frameworkResult) {
      message.error('没有可验证的框架数据');
      return;
    }

    try {
      setLoading(true);
      message.info('框架验证功能需要后端API支持');
    } catch (error) {
      console.error('框架验证失败:', error);
      message.error('框架验证失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出框架
  const handleExportFramework = async (format: string = 'docx') => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setLoading(true);
      message.info('框架导出功能需要后端API支持');
    } catch (error) {
      console.error('框架导出失败:', error);
      message.error('框架导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 跳转到下一步
  const handleNextStep = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/step/content-generation`);
    }
  };

  const handleGenerateFramework = async () => {
    setGenerating(true);
    setCurrentStep(1);

    try {
      // 模拟AI生成框架过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentStep(2);

      // 更新框架状态
      setFrameworkData(prev => prev.map(section => ({
        ...section,
        status: section.status === 'pending' ? 'generated' : section.status,
        children: section.children?.map(chapter => ({
          ...chapter,
          status: chapter.status === 'pending' ? 'generated' : chapter.status,
          children: chapter.children?.map(content => ({
            ...content,
            status: content.status === 'pending' ? 'generated' : content.status,
          })),
        })),
      })));
    } catch (error) {
      console.error('框架生成失败:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'generated':
        return <RobotOutlined style={{ color: '#1890ff' }} />;
      case 'pending':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="green">已完成</Tag>;
      case 'generated':
        return <Tag color="blue">AI生成</Tag>;
      case 'pending':
        return <Tag color="orange">待处理</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  const renderTreeTitle = (node: FrameworkNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Space>
        {getStatusIcon(node.status)}
        <Text strong={node.type === 'section'} style={{ fontSize: node.type === 'section' ? 14 : 13 }}>
          {node.title}
        </Text>
        {node.required && <Tag color="red">必需</Tag>}
        {node.weight && <Tag color="blue">{node.weight}%</Tag>}
      </Space>
      <Space>
        {getStatusTag(node.status)}
        <Button type="text" size="small" icon={<EditOutlined />} />
      </Space>
    </div>
  );

  const treeData = frameworkData.map(section => ({
    ...section,
    title: renderTreeTitle(section),
    children: section.children?.map(chapter => ({
      ...chapter,
      title: renderTreeTitle(chapter),
      children: chapter.children?.map(content => ({
        ...content,
        title: renderTreeTitle(content),
      })),
    })),
  }));

  if (isProjectLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (projectError) {
    return <Result status="error" title="加载项目失败" subTitle={projectError} />;
  }

  if (!project) {
    return <Result status="warning" title="未找到项目" subTitle="请确保项目ID是否正确。" />;
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <ProjectInfoHeader project={project} isLoading={isProjectLoading} onRefresh={() => projectId && dispatch(getProject(projectId))} />
      {/* 步骤指示器和导航 */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Alert
            message={`任务状态：${stepStatus}`}
            type={stepStatus === 'error' ? 'error' : stepStatus === 'completed' ? 'success' : 'info'}
            icon
          />
          <Space>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回流程</Button>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/material-management`)}>上一步</Button>
            <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/step/content-generation`)} disabled={!frameworkResult}>
              下一步
            </Button>
          </Space>
        </div>
      </Card>


      {/* 操作区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Alert
              message="智能框架生成"
              description="基于招标文件分析结果，AI将自动生成符合要求的投标文件框架结构。您可以根据需要进行调整和优化。"
              type="info"
              showIcon
            />
          </Col>
          <Col>
            <Space wrap>
              <Button
                type="primary"
                size="large"
                icon={<RobotOutlined />}
                loading={generating}
                onClick={handleGenerateFrameworkAPI}
                disabled={!projectId}
              >
                {generating ? 'AI生成中...' : '智能生成框架'}
              </Button>

              <Button
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSaveFramework}
                loading={loading}
                disabled={!frameworkResult}
              >
                保存框架
              </Button>

              <Button
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleValidateFramework}
                loading={loading}
                disabled={!frameworkResult}
              >
                验证框架
              </Button>

              <Button
                size="large"
                icon={<DownloadOutlined />}
                onClick={() => handleExportFramework('docx')}
                loading={loading}
                disabled={!frameworkResult}
              >
                导出框架
              </Button>

              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={loadExistingFramework}
                loading={loading}
                disabled={!projectId}
              >
                重新加载
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 框架结构展示 */}
      <Row gutter={16}>
        <Col span={16}>
          <Card title="投标文件框架结构" extra={<FileTextOutlined />}>
            {generating ? (
              <div style={{ textAlign: 'center', padding: 100 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>AI正在分析招标文件，生成最优框架结构...</Text>
                </div>
              </div>
            ) : (
              <Tree
                showLine
                switcherIcon={<DownOutlined />}
                defaultExpandAll
                selectedKeys={selectedKeys}
                onSelect={(selectedKeys) => setSelectedKeys(selectedKeys as string[])}
                treeData={treeData}
                style={{ background: '#fafafa', padding: 16, borderRadius: 6 }}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="框架统计" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>总章节数:</Text>
                <Text strong>12</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>已完成:</Text>
                <Text style={{ color: '#52c41a' }}>3</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>AI生成:</Text>
                <Text style={{ color: '#1890ff' }}>5</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>待处理:</Text>
                <Text style={{ color: '#faad14' }}>4</Text>
              </div>
            </Space>
          </Card>

          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>批量生成内容</Button>
              <Button block>导出框架结构</Button>
              <Button block>保存为模板</Button>
              <Button block type="primary">开始内容编写</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 模板选择和配置 */}
      <Card title="框架配置" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>框架类型:</Text>
              <Select
                value={selectedFrameworkType}
                onChange={setSelectedFrameworkType}
                style={{ width: '100%' }}
                disabled={generating}
              >
                <Option value="standard">标准框架</Option>
                <Option value="technical">技术方案</Option>
                <Option value="commercial">商务方案</Option>
                <Option value="comprehensive">综合框架</Option>
              </Select>
            </Space>
          </Col>

          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>模板选择:</Text>
              <Select
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                style={{ width: '100%' }}
                placeholder="选择模板（可选）"
                allowClear
                disabled={generating}
                loading={loading}
              >
                {templates.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>生成选项:</Text>
              <Checkbox disabled>
                自动生成内容（功能暂不可用）
              </Checkbox>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 框架生成结果 */}
      {frameworkResult && (
        <Card title="框架生成结果" style={{ marginTop: 24 }}>
          <Alert
            message="框架生成完成"
            description="AI已根据招标文件生成投标文件框架，您可以进行调整或直接使用。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Descriptions bordered column={2}>
            <Descriptions.Item label="框架类型">
              {frameworkResult.type || selectedFrameworkType}
            </Descriptions.Item>
            <Descriptions.Item label="生成时间">
              {frameworkResult.generation_time ? new Date(frameworkResult.generation_time).toLocaleString() : '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="章节数量">
              {frameworkResult.chapters?.length || 0}
            </Descriptions.Item>
            <Descriptions.Item label="框架状态">
              <Tag color="green">{frameworkResult.status || 'generated'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="framework-generation"
        canProceed={!!frameworkResult}
      />
    </div>
  );
};

export default FrameworkGenerationPage;
