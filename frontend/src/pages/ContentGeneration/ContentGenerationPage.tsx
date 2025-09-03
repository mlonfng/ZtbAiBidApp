import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, Select, Progress, Tabs, Row, Col, Tag, Modal, Alert, Spin, Result } from 'antd';
import {
  EditOutlined,
  RobotOutlined,
  FileTextOutlined,
  BulbOutlined,

} from '@ant-design/icons';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import { contentStepAPI } from '../../services/api';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';


const { Title, Text } = Typography;
// const { Option } = Select;


interface ContentSection {
  id: string;
  title: string;
  type: 'technical' | 'business' | 'qualification';
  status: 'pending' | 'generating' | 'generated' | 'edited';
  content: string;
  aiPrompt?: string;
  wordCount?: number;
}

const ContentGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();
  const [generating, setGenerating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [stepStatus, setStepStatus] = useState<'pending'|'in_progress'|'completed'|'error'|'cancelled'>('pending');

  const [generationProgress, setGenerationProgress] = useState(0);

  // 模拟内容章节数据
  const [contentSections, setContentSections] = useState<ContentSection[]>([
    {
      id: '1',
      title: '项目理解与需求分析',
      type: 'technical',
      status: 'generated',
      content: `一、项目背景理解

汾西县档案整理服务及设备配置项目是一项重要的档案数字化建设工程，旨在通过现代化的档案管理技术和设备，提升档案管理的效率和质量。

二、需求分析

1. 档案数字化需求
   - 历史档案数字化扫描
   - 档案信息电子化管理
   - 档案检索系统建设

2. 设备配置需求
   - 高精度扫描设备
   - 档案存储设备
   - 网络安全设备

3. 服务实施需求
   - 专业档案整理服务
   - 系统培训服务
   - 技术支持服务

三、项目价值分析

本项目的实施将显著提升汾西县档案管理的现代化水平，为政府决策和公共服务提供有力支撑。`,
      wordCount: 245,
    },
    {
      id: '2',
      title: '技术实施方案',
      type: 'technical',
      status: 'pending',
      content: '',
    },
    {
      id: '3',
      title: '设备配置方案',
      type: 'technical',
      status: 'pending',
      content: '',
    },
    {
      id: '4',
      title: '价格方案',
      type: 'business',
      status: 'generating',
      content: '',
    },
    {
      id: '5',
      title: '服务承诺',
      type: 'business',
      status: 'pending',
      content: '',
    },
  ]);

  const handleGenerateContent = async (sectionId: string) => {
    if (!projectId) return;
    setGenerating(true);
    setGenerationProgress(0);
    setStepStatus('in_progress');

    try {
      // 启动 Step 任务（幂等）
      const exec = await contentStepAPI.execute(projectId, [sectionId]);
      if (!exec.success) {
        setGenerating(false);
        setStepStatus('error');
        return;
      }
      // 等待进入运行态
      const enteredRunning = await (async () => {
        for (let i = 0; i < 12; i++) {
          try {
            const st = await contentStepAPI.getStatus(projectId);
            if (st?.success) {
              const { status, progress } = st.data || {};
              setStepStatus((status as any) || 'in_progress');
              setGenerationProgress(progress ?? 0);
              if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
                return true;
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 1000));
        }
        return false;
      })();
      if (!enteredRunning) {
        // 提示排队中
      }
      // 轮询完成并拉取结果
      const poll = async () => {
        try {
          const st = await contentStepAPI.getStatus(projectId);
          if (st.success && st.data) {
            setStepStatus((st.data.status as any) || 'in_progress');
            setGenerationProgress(st.data.progress ?? 0);
            if (st.data.status === 'completed') {
              const res = await contentStepAPI.getResult(projectId);
              if (res.success) {
                // 根据返回结果更新对应章节
                const sections = Array.isArray(res.data?.sections) ? res.data.sections : [];
                setContentSections(prev => prev.map(section =>
                  section.id === sectionId
                    ? {
                        ...section,
                        status: 'generated',
                        content: generateMockContent(section.title),
                        wordCount: Math.floor(Math.random() * 500) + 200,
                      }
                    : section
                ));
              }
              setGenerating(false);
              return;
            }
            if (st.data.status === 'error' || st.data.status === 'cancelled') {
              setGenerating(false);
              return;
            }
          }
        } catch {}
        setTimeout(poll, 1500);
      };
      poll();
    } catch (error) {
      setGenerating(false);
      setStepStatus('error');
    }
  };

  const generateMockContent = (title: string) => {
    const mockContents: Record<string, string> = {
      '技术实施方案': `一、技术路线设计

1. 档案数字化技术路线
   - 采用高精度扫描技术
   - 实施OCR文字识别
   - 建立元数据标准

2. 系统架构设计
   - 分布式存储架构
   - 微服务技术架构
   - 云原生部署方案

3. 数据安全保障
   - 多重备份机制
   - 访问权限控制
   - 数据加密传输

二、实施步骤规划

第一阶段：系统部署与测试
第二阶段：档案数字化处理
第三阶段：系统上线运行
第四阶段：培训与验收`,

      '设备配置方案': `一、核心设备配置

1. 档案扫描设备
   - 高速文档扫描仪 × 2台
   - A3幅面彩色扫描仪 × 1台
   - 古籍专用扫描仪 × 1台

2. 存储设备
   - 企业级存储服务器 × 2台
   - 备份存储设备 × 1套
   - 网络附加存储 × 1套

3. 网络设备
   - 核心交换机 × 1台
   - 接入交换机 × 4台
   - 防火墙设备 × 1台

二、设备技术参数

所有设备均采用业界领先技术，确保系统稳定可靠运行。`,

      '价格方案': `一、项目总体报价

项目总价：4,980,000元（含税）

二、费用构成明细

1. 设备采购费用：3,200,000元
   - 扫描设备：1,800,000元
   - 存储设备：1,000,000元
   - 网络设备：400,000元

2. 软件开发费用：1,200,000元
   - 档案管理系统：800,000元
   - 定制化开发：400,000元

3. 实施服务费用：580,000元
   - 档案整理服务：380,000元
   - 培训服务：100,000元
   - 技术支持：100,000元

三、付款方式

合同签订后支付30%，设备到货验收后支付40%，项目验收合格后支付30%。`,

      '服务承诺': `一、质量承诺

1. 严格按照国家档案管理标准执行
2. 确保档案数字化质量达到优良等级
3. 提供完整的质量检测报告

二、进度承诺

1. 严格按照项目计划执行
2. 关键节点及时汇报进展
3. 确保项目按期完成

三、售后服务承诺

1. 提供3年免费质保服务
2. 7×24小时技术支持热线
3. 定期系统维护和升级服务

四、培训承诺

1. 提供完整的操作培训
2. 培训合格率达到100%
3. 提供详细的操作手册`,
    };

    return mockContents[title] || `这是${title}的AI生成内容示例。\n\n本章节将详细阐述相关方案和措施，确保项目的顺利实施和预期目标的实现。`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'green';
      case 'generating': return 'blue';
      case 'edited': return 'purple';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'generated': return 'AI已生成';
      case 'generating': return '生成中';
      case 'edited': return '已编辑';
      case 'pending': return '待生成';
      default: return '未知';
    }
  };

  // const getTypeText = (type: string) => {
  //   switch (type) {
  //     case 'technical': return '技术方案';
  //     case 'business': return '商务方案';
  //     case 'qualification': return '资格证明';
  //     default: return '其他';
  //   }
  // };

  const technicalSections = contentSections.filter(s => s.type === 'technical');
  const businessSections = contentSections.filter(s => s.type === 'business');
  const qualificationSections = contentSections.filter(s => s.type === 'qualification');

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
      {/* 页面顶部导航和状态 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text strong>流程导航</Text>
          <Space>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回流程</Button>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/framework-generation`)}>上一步</Button>
            <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/step/format-config`)} disabled={!contentSections.some(s => s.status === 'generated')}>
              下一步
            </Button>
          </Space>
        </div>
        <Alert
          message={`内容生成任务状态：${stepStatus}`}
          type={stepStatus === 'error' ? 'error' : stepStatus === 'completed' ? 'success' : 'info'}
          description={<Progress percent={generationProgress} size="small" />}
          showIcon
        />
      </Card>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {contentSections.length}
              </div>
              <div style={{ color: '#666' }}>总章节数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {contentSections.filter(s => s.status === 'generated').length}
              </div>
              <div style={{ color: '#666' }}>已生成</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {contentSections.filter(s => s.status === 'pending').length}
              </div>
              <div style={{ color: '#666' }}>待生成</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {contentSections.reduce((sum, s) => sum + (s.wordCount || 0), 0)}
              </div>
              <div style={{ color: '#666' }}>总字数</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'technical',
              label: (
                <Space>
                  <FileTextOutlined />
                  技术方案
                  <Tag color="blue">{technicalSections.length}</Tag>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {technicalSections.map(section => (
                    <Card key={section.id} size="small">
                      <Row gutter={16} align="middle">
                        <Col flex="auto">
                          <Space>
                            <Text strong>{section.title}</Text>
                            <Tag color={getStatusColor(section.status)}>
                              {getStatusText(section.status)}
                            </Tag>
                            {section.wordCount && (
                              <Text type="secondary">{section.wordCount} 字</Text>
                            )}
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            {section.status === 'generated' && (
                              <>
                                <Button
                                  size="small"
                                  icon={<FileTextOutlined />}
                                >
                                  预览
                                </Button>
                                <Button size="small" icon={<EditOutlined />}>
                                  编辑
                                </Button>
                              </>
                            )}
                            <Button
                              type="primary"
                              size="small"
                              icon={<RobotOutlined />}
                              loading={generating && selectedSection === section.id}
                              onClick={async () => {
                                setSelectedSection(section.id);
                                // 调用 Step API 执行（最小实现：仅标记步骤）
                                if (projectId) {
                                  try { await contentStepAPI.execute(projectId, [section.id]); } catch {}
                                }
                                handleGenerateContent(section.id);
                              }}
                            >
                              {section.status === 'generated' ? '重新生成' : 'AI生成'}
                            </Button>
                          </Space>
                        </Col>
                      </Row>

                      {generating && selectedSection === section.id && (
                        <div style={{ marginTop: 16 }}>
                          <Progress percent={generationProgress} status="active" />
                          <Text type="secondary">AI正在生成内容...</Text>
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              ),
            },
            {
              key: 'business',
              label: (
                <Space>
                  <BulbOutlined />
                  商务方案
                  <Tag color="green">{businessSections.length}</Tag>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {businessSections.map(section => (
                    <Card key={section.id} size="small">
                      <Row gutter={16} align="middle">
                        <Col flex="auto">
                          <Space>
                            <Text strong>{section.title}</Text>
                            <Tag color={getStatusColor(section.status)}>
                              {getStatusText(section.status)}
                            </Tag>
                            {section.wordCount && (
                              <Text type="secondary">{section.wordCount} 字</Text>
                            )}
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            {section.status === 'generated' && (
                              <>
                                <Button size="small" icon={<FileTextOutlined />}>
                                  预览
                                </Button>
                                <Button size="small" icon={<EditOutlined />}>
                                  编辑
                                </Button>
                              </>
                            )}
                            <Button
                              type="primary"
                              size="small"
                              icon={<RobotOutlined />}
                              loading={generating && selectedSection === section.id}
                              onClick={() => {
                                setSelectedSection(section.id);
                                handleGenerateContent(section.id);
                              }}
                            >
                              {section.status === 'generated' ? '重新生成' : 'AI生成'}
                            </Button>
                          </Space>
                        </Col>
                      </Row>

                      {generating && selectedSection === section.id && (
                        <div style={{ marginTop: 16 }}>
                          <Progress percent={generationProgress} status="active" />
                          <Text type="secondary">AI正在生成内容...</Text>
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="content-generation"
        canProceed={contentSections.some(section => section.status === 'generated')}
        strictMode={false}
      />
    </div>
  );
};

export default ContentGenerationPage;
