import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Progress, Row, Col, Tag, Steps, List, Modal, message, Checkbox, Alert, Spin, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ExportOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  Html5Outlined,
  DownloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import { exportStepAPI } from '../../services/api';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';


const { Text } = Typography;

interface ExportOption {
  format: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  size?: string;
  status?: 'pending' | 'exporting' | 'completed' | 'failed';
}

interface DocumentSection {
  id: string;
  name: string;
  included: boolean;
  pages: number;
  status: 'ready' | 'missing' | 'incomplete';
}

const DocumentExportPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [activeExportType, setActiveExportType] = useState<string | null>(null);

  const [stepStatus, setStepStatus] = useState<'pending'|'in_progress'|'completed'|'error'|'cancelled'>('pending');

  // 导出格式选项
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    {
      format: 'docx',
      name: 'Word文档',
      icon: <FileWordOutlined style={{ color: '#1890ff' }} />,
      description: '可编辑的Word文档格式，便于后续修改',
      status: 'pending',
    },
    {
      format: 'pdf',
      name: 'PDF文档',
      icon: <FilePdfOutlined style={{ color: '#f5222d' }} />,
      description: '便携式文档格式，适合正式提交',
      status: 'pending',
    },
    {
      format: 'html',
      name: 'HTML网页',
      icon: <Html5Outlined style={{ color: '#fa8c16' }} />,
      description: '网页格式，便于在线查看和分享',
      status: 'pending',
    },
  ]);

  // 文档章节
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([
    { id: '1', name: '投标函及投标函附录', included: true, pages: 2, status: 'ready' },
    { id: '2', name: '法定代表人身份证明', included: true, pages: 1, status: 'ready' },
    { id: '3', name: '授权委托书', included: true, pages: 1, status: 'ready' },
    { id: '4', name: '项目理解与需求分析', included: true, pages: 3, status: 'ready' },
    { id: '5', name: '技术实施方案', included: true, pages: 5, status: 'ready' },
    { id: '6', name: '设备配置方案', included: true, pages: 4, status: 'ready' },
    { id: '7', name: '价格方案', included: true, pages: 2, status: 'ready' },
    { id: '8', name: '服务承诺', included: true, pages: 2, status: 'ready' },
    { id: '9', name: '企业资质证明', included: true, pages: 6, status: 'ready' },
    { id: '10', name: '项目经验证明', included: false, pages: 3, status: 'incomplete' },
  ]);

  const steps = [
    { title: '选择导出格式', description: '选择需要导出的文档格式' },
    { title: '配置导出选项', description: '设置章节和导出参数' },
    { title: '生成文档', description: '系统生成最终文档' },
    { title: '下载文档', description: '下载生成的文档文件' },
  ];

  const loadExportHistory = React.useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await exportStepAPI.getResult(projectId);
      if (response.success) {
        // 假设结果中包含导出历史数据
        setExportHistory(response.data?.export_history || response.data || []);
      }
    } catch (error) {
      console.error('加载导出历史失败:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 加载导出历史
  useEffect(() => {
    if (projectId) {
      loadExportHistory();
    }
  }, [projectId, loadExportHistory]);

  // 导出DOCX
  const handleExportDocx = async () => {
    await handleExportFormat('docx');
  };

  // 导出PDF
  const handleExportPdf = async () => {
    await handleExportFormat('pdf');
  };

  // 导出HTML
  const handleExportHtml = async () => {
    await handleExportFormat('html');
  };

  // 批量导出
  const handleBatchExport = async () => {
    await handleExportFormat('all');
  };

  // 通用导出处理函数
  const handleExportFormat = async (format: string) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setExporting(true);
      setExportProgress(0);
      setCurrentStep(1);
      setActiveExportType(format);

      // 收集导出配置
      const exportConfig = {
        include_images: true,
        include_tables: true,
        page_numbers: true,
        watermark: false,
        sections: documentSections.filter(s => s.included).map(s => s.id)
      };

      // 使用 Step API 执行导出
      const response = await exportStepAPI.execute(projectId, format, exportConfig);

      if (response.success) {
        setStepStatus('in_progress');

        // 等待进入运行态再提示，提升体验
        const enteredRunning = await (async () => {
          for (let i = 0; i < 12; i++) { // 最多约12秒
            try {
              const st = await exportStepAPI.getStatus(projectId);
              if (st?.success) {
                const { status, progress } = st.data || {};
                setStepStatus((status as any) || 'in_progress');
                if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
                  return true;
                }
              }
            } catch {}
            await new Promise(r => setTimeout(r, 1000));
          }
          return false;
        })();
        if (enteredRunning) {
          message.success(`${format.toUpperCase()}导出任务已启动`);
        } else {
          message.info('导出任务已提交，正在排队...');
        }

        // 开始监控导出进度
        monitorExportProgress();
      } else {
        message.error(response.message || '导出启动失败');
        setExporting(false);
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
      setExporting(false);
    }
  };

  // 监控导出进度
  const monitorExportProgress = async () => {
    const checkProgress = async () => {
      try {
        if (!projectId) return;
        const response = await exportStepAPI.getStatus(projectId);

        if (response.success && response.data) {
          const { status, progress } = response.data;

          setExportProgress(progress || 0);

          if (status === 'completed') {
            setExporting(false);
            setCurrentStep(3);
            setStepStatus('completed');
            message.success('导出完成');

            // 获取结果以更新文件大小信息
            try {
              const resultResponse = await exportStepAPI.getResult(projectId);
              if (resultResponse.success) {
                const result = resultResponse.data;
                setExportOptions(prev => prev.map(option => ({
                  ...option,
                  status: 'completed',
                  size: result?.file_size || result?.size || '未知大小',
                })));
              }
            } catch (error) {
              console.warn('获取导出结果失败:', error);
              setExportOptions(prev => prev.map(option => ({
                ...option,
                status: 'completed',
                size: '未知大小',
              })));
            }

            // 重新加载导出历史
            loadExportHistory();
            return;
          } else if (status === 'error' || status === 'cancelled') {
            setExporting(false);
            setStepStatus(status);
            message.error(status === 'cancelled' ? '导出已取消' : '导出失败');

            setExportOptions(prev => prev.map(option => ({
              ...option,
              status: 'failed',
            })));
            return;
          }

          // 继续监控
          setTimeout(checkProgress, 2000);
        }
      } catch (error) {
        console.error('获取导出状态失败:', error);
        setExporting(false);
        message.error('获取导出状态失败');
      }
    };

    checkProgress();
  };

  // 下载导出文件
  const handleDownload = async (taskId: string) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setLoading(true);

      // 使用Step API获取结果，结果中应包含下载链接
      const resultResponse = await exportStepAPI.getResult(projectId);

      if (resultResponse.success) {
        const result = resultResponse.data;
        const downloadUrl = result?.download_url || result?.file_url || result?.url;
        
        if (downloadUrl) {
          message.success('文件准备完成');
          window.open(downloadUrl, '_blank');
        } else {
          message.warning('文件准备完成但未返回下载链接');
        }
      } else {
        message.error(resultResponse.message || '文件下载准备失败');
      }
    } catch (error) {
      console.error('文件下载失败:', error);
      message.error('文件下载失败');
    } finally {
      setLoading(false);
    }
  };


  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    setDocumentSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, included: checked } : section
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'missing':
        return <ExportOutlined style={{ color: '#f5222d' }} />;
      case 'incomplete':
        return <LoadingOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ready':
        return <Tag color="green">就绪</Tag>;
      case 'missing':
        return <Tag color="red">缺失</Tag>;
      case 'incomplete':
        return <Tag color="orange">未完成</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  const includedSections = documentSections.filter(s => s.included);
  const totalPages = includedSections.reduce((sum, s) => sum + s.pages, 0);
  const readySections = includedSections.filter(s => s.status === 'ready').length;

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
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Alert
            message={`导出任务状态：${stepStatus}`}
            type={stepStatus === 'error' ? 'error' : stepStatus === 'completed' ? 'success' : 'info'}
            icon
          />
          <Space>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回流程</Button>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/format-config`)}>上一步</Button>
            <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>
              完成
            </Button>
          </Space>
        </div>
      </Card>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{includedSections.length}</div>
              <div style={{ color: '#666' }}>包含章节</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{readySections}</div>
              <div style={{ color: '#666' }}>就绪章节</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>{totalPages}</div>
              <div style={{ color: '#666' }}>总页数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                {exportOptions.filter(o => o.status === 'completed').length}
              </div>
              <div style={{ color: '#666' }}>已导出格式</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 左侧：导出配置 */}
        <Col span={10}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 导出格式选择 */}
            <Card title="导出格式" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {exportOptions.map(option => (
                  <Card key={option.format} size="small" style={{ background: '#fafafa' }}>
                    <Row align="middle">
                      <Col flex="auto">
                        <Space>
                          {option.icon}
                          <div>
                            <Text strong>{option.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {option.description}
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Space direction="vertical" align="end">
                          {option.status === 'completed' && (
                            <>
                              <Tag color="green">已完成</Tag>
                              <Text type="secondary">{option.size}</Text>
                              <Button size="small" icon={<DownloadOutlined />}>
                                下载
                              </Button>
                            </>
                          )}
                          {option.status === 'pending' && (
                            <Tag color="default">待导出</Tag>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>

            {/* 章节选择 */}
            <Card title="章节选择" size="small">
              <List
                size="small"
                dataSource={documentSections}
                renderItem={(section) => (
                  <List.Item>
                    <Row style={{ width: '100%' }} align="middle">
                      <Col flex="auto">
                        <Space>
                          <Checkbox
                            checked={section.included}
                            onChange={(e) => handleSectionToggle(section.id, e.target.checked)}
                            disabled={section.status === 'missing'}
                          />
                          {getStatusIcon(section.status)}
                          <div>
                            <Text>{section.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {section.pages} 页
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        {getStatusTag(section.status)}
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>

        {/* 右侧：导出操作和进度 */}
        <Col span={14}>
          <Card title="导出操作">
            {!exporting && currentStep < 2 && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                  message="导出准备就绪"
                  description={`已选择 ${includedSections.length} 个章节，共 ${totalPages} 页。点击开始导出按钮生成最终文档。`}
                  type="success"
                  showIcon
                />

                <div style={{ textAlign: 'center' }}>
                  <Space wrap>
                    <Button
                      type="primary"
                      size="large"
                      icon={<FileWordOutlined />}
                      onClick={handleExportDocx}
                      loading={exporting && activeExportType === 'docx'}
                      disabled={readySections !== includedSections.length || !projectId}
                    >
                      导出DOCX
                    </Button>

                    <Button
                      size="large"
                      icon={<FilePdfOutlined />}
                      onClick={handleExportPdf}
                      loading={exporting && activeExportType === 'pdf'}
                      disabled={readySections !== includedSections.length || !projectId}
                    >
                      导出PDF
                    </Button>

                    <Button
                      size="large"
                      icon={<Html5Outlined />}
                      onClick={handleExportHtml}
                      loading={exporting && activeExportType === 'html'}
                      disabled={readySections !== includedSections.length || !projectId}
                    >
                      导出HTML
                    </Button>

                    <Button
                      size="large"
                      icon={<FileZipOutlined />}
                      onClick={handleBatchExport}
                      loading={exporting && activeExportType === 'all'}
                      disabled={readySections !== includedSections.length || !projectId}
                    >
                      批量导出
                    </Button>
                  </Space>
                </div>
              </Space>
            )}

            {exporting && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                  message="正在导出文档..."
                  description="系统正在生成最终文档，请稍候。"
                  type="info"
                  showIcon
                />

                <Progress
                  percent={exportProgress}
                  status="active"
                  strokeColor="#1890ff"
                />

                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                  正在处理第 {Math.floor(exportProgress / 10) + 1} 个章节...
                </Text>
              </Space>
            )}

            {!exporting && currentStep >= 2 && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                  message="文档导出完成"
                  description="所有格式的文档已成功生成，您可以下载使用。"
                  type="success"
                  showIcon
                />

                <div style={{ textAlign: 'center' }}>
                  <Space>
                    <Button icon={<EyeOutlined />} onClick={() => setPreviewModalVisible(true)}>
                      预览文档
                    </Button>
                    <Button type="primary" icon={<FileZipOutlined />}>
                      打包下载全部
                    </Button>
                  </Space>
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 预览模态框 */}
      <Modal
        title="文档预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />}>
            下载此文档
          </Button>,
        ]}
      >
        <div style={{ height: 400, background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
          <Text type="secondary">文档预览功能开发中...</Text>
        </div>
      </Modal>

      {/* 导出历史 */}
      {exportHistory.length > 0 && (
        <Card title="导出历史" style={{ marginTop: 24 }}>
          <List
            dataSource={exportHistory}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button
                    key="download"
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(item.task_id)}
                    loading={loading}
                  >
                    下载
                  </Button>,
                  <Button
                    key="preview"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      // TODO: 实现预览功能
                      message.info('预览功能开发中');
                    }}
                  >
                    预览
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.export_format?.toUpperCase()}</Text>
                      <Tag color={item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'orange'}>
                        {item.status === 'completed' ? '已完成' : item.status === 'failed' ? '失败' : '进行中'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">
                        导出时间: {item.created_at ? new Date(item.created_at).toLocaleString() : '未知'}
                      </Text>
                      {item.file_size && (
                        <Text type="secondary">文件大小: {item.file_size}</Text>
                      )}
                      {item.sections_count && (
                        <Text type="secondary">包含章节: {item.sections_count} 个</Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="document-export"
        canProceed={exportHistory.length > 0}
      />
    </div>
  );
};

export default DocumentExportPage;
