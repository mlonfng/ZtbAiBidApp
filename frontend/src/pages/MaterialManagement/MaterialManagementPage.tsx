import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Typography, Space, Table, Tag, Modal, Form, Input, Select, DatePicker, Progress, Tabs, Alert, Descriptions, Row, Col, message, Spin, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FolderOutlined, PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, SafetyCertificateOutlined, TrophyOutlined, BankOutlined, TeamOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { materialAPI, materialStepAPI } from '../../services/api';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';


const { Title, Text } = Typography;
const { Option } = Select;

interface Material {
  id: string;
  name: string;
  type: string;

  category: string;
  uploadDate: string;
  size: string;
  status: 'active' | 'expired' | 'pending';
  expiryDate?: string;
  description?: string;
  tags?: string[];
  isRequired?: boolean;
  score?: number;
}

const MaterialManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();

  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      name: '营业执照',
      type: 'PDF',
      category: '企业资质',
      uploadDate: '2024-01-15',
      size: '2.3 MB',
      status: 'active',
      expiryDate: '2025-01-15',
      description: '企业法人营业执照副本',
      tags: ['必需', '基础资质'],
      isRequired: true,
      score: 95,
    },
    {
      id: '2',
      name: '项目经验证明',
      type: 'DOCX',
      category: '项目经验',
      uploadDate: '2024-01-10',
      size: '1.8 MB',
      status: 'active',
      description: '近三年类似项目经验证明材料',
      tags: ['重要', '加分项'],
      isRequired: false,
      score: 88,
    },
    {
      id: '3',
      name: '资质证书',
      type: 'PDF',
      category: '企业资质',
      uploadDate: '2024-01-08',
      size: '3.1 MB',
      status: 'expired',
      expiryDate: '2024-01-01',
      description: '行业相关资质证书',
      tags: ['必需', '已过期'],
      isRequired: true,
      score: 0,
    },
    {
      id: '4',
      name: '财务审计报告',
      type: 'PDF',
      category: '财务证明',
      uploadDate: '2024-01-05',
      size: '4.2 MB',
      status: 'pending',
      description: '最近一年财务审计报告',
      tags: ['审核中'],
      isRequired: true,
      score: 0,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any>(null);
  const [stepStatus, setStepStatus] = useState<'pending'|'running'|'completed'|'error'|'cancelled'>('pending');
  const [stepProgress, setStepProgress] = useState<number>(0);

  // 加载数据
  const loadMaterialData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      // 并行加载资料列表和分类
      const [materialsResponse, categoriesResponse] = await Promise.all([
        materialAPI.getMaterialList(projectId),
        materialAPI.getCategories()
      ]);

      if (materialsResponse.success) {
        setMaterials(materialsResponse.data || []);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }
    } catch (error) {
      console.error('加载资料数据失败:', error);
      message.error('加载资料数据失败');
    } finally {
      setLoading(false);
    }

    // 调用 Step API 标记步骤完成（最小实现）
    try {
      const stepRes = await materialStepAPI.execute(projectId, { action: 'refresh' });
      if (!stepRes.success) {
        console.warn('material step execute warn:', stepRes.message);
      }
    } catch (e) {
      console.warn('material step execute failed (ignored):', e);
    }

  };

      {/* 顶部统一状态条 */}
      <Alert
        style={{ marginBottom: 16 }}
        message={`资料管理任务状态：${stepStatus}`}
        type={stepStatus === 'error' ? 'error' : stepStatus === 'completed' ? 'success' : 'info'}
        description={<Progress percent={stepProgress} size="small" />}
        showIcon
      />

  useEffect(() => {
    if (projectId) {
      loadMaterialData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 分析资料需求
  const handleAnalyzeRequirements = async () => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setAnalyzing(true);
      // 触发 Step 任务（幂等）
      const exec = await materialStepAPI.execute(projectId, { action: 'analyze_requirements' });
      if (!exec.success) {
        message.error(exec.message || '资料需求分析启动失败');
        setAnalyzing(false);
        return;
      }
      // 等待进入运行态
      const enteredRunning = await (async () => {
        for (let i = 0; i < 12; i++) {
          try {
            const st = await materialStepAPI.getStatus(projectId);
            if (st?.success) {
              const { status, progress } = st.data || {};
              setStepStatus((status as any) || 'running');
              setStepProgress(progress ?? 0);
              if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
                return true;
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 1000));
        }
        return false;
      })();
      if (enteredRunning) message.success('资料需求分析已启动'); else message.info('资料需求分析已提交，正在排队...');
      // 轮询完成并拉取结果
      const poll = async () => {
        try {
          const st = await materialStepAPI.getStatus(projectId);
          if (st.success && st.data) {
            setStepStatus((st.data.status as any) || 'running');
            setStepProgress(st.data.progress ?? 0);
            if (st.data.status === 'completed') {
              const res = await materialStepAPI.getResult(projectId);
              if (res.success) setRequirements(res.data);
              setAnalyzing(false);
              return;
            }
            if (st.data.status === 'error' || st.data.status === 'cancelled') {
              setAnalyzing(false);
              message.error(`任务${st.data.status === 'error' ? '失败' : '已取消'}`);
              return;
            }
          }
        } catch {}
        setTimeout(poll, 1500);
      };
      poll();
    } catch (error) {
      console.error('资料需求分析失败:', error);
      message.error('资料需求分析失败');
      setAnalyzing(false);
    }
  };

  // 上传资料文件
  const handleUploadMaterial = async (file: File, categoryId: string, itemId: string, description?: string) => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setUploading(true);

      const response = await materialAPI.uploadMaterial(projectId, categoryId, itemId, file, description);

      if (response.success) {
        message.success('资料上传成功');
        // 重新加载资料列表
        loadMaterialData();
      } else {
        message.error(response.message || '资料上传失败');
      }
    } catch (error) {
      console.error('资料上传失败:', error);
      message.error('资料上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除资料
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const response = await materialAPI.deleteMaterial(materialId);

      if (response.success) {
        message.success('资料删除成功');
        // 重新加载资料列表
        loadMaterialData();
      } else {
        message.error(response.message || '资料删除失败');
      }
    } catch (error) {
      console.error('资料删除失败:', error);
      message.error('资料删除失败');
    }
  };

  // 导出报告
  const handleExportReport = async () => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setLoading(true);
      // 触发 Step 任务（幂等）
      const exec = await materialStepAPI.execute(projectId, { action: 'export_report' });
      if (!exec.success) {
        message.error(exec.message || '报告导出启动失败');
        setLoading(false);
        return;
      }
      // 等待进入运行态
      const enteredRunning = await (async () => {
        for (let i = 0; i < 12; i++) {
          try {
            const st = await materialStepAPI.getStatus(projectId);
            if (st?.success) {
              const { status, progress } = st.data || {};
              setStepStatus((status as any) || 'running');
              setStepProgress(progress ?? 0);
              if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
                return true;
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 1000));
        }
        return false;
      })();
      if (enteredRunning) message.success('报告导出任务已启动'); else message.info('报告导出任务已提交，正在排队...');
      // 轮询完成并拉取结果
      const poll = async () => {
        try {
          const st = await materialStepAPI.getStatus(projectId);
          if (st.success && st.data) {
            setStepStatus((st.data.status as any) || 'running');
            setStepProgress(st.data.progress ?? 0);
            if (st.data.status === 'completed') {
              const res = await materialStepAPI.getResult(projectId);
              if (res.success) {
                const url = res.data?.report_url || res.data?.files?.[0]?.url;
                if (url) window.open(url, '_blank'); else message.warning('导出完成但未返回下载链接');
              }
              setLoading(false);
              return;
            }
            if (st.data.status === 'error' || st.data.status === 'cancelled') {
              message.error(`报告导出任务${st.data.status === 'error' ? '失败' : '已取消'}`);
              setLoading(false);
              return;
            }
          }
        } catch {}
        setTimeout(poll, 1500);
      };
      poll();
    } catch (error) {
      console.error('报告导出失败:', error);
      message.error('报告导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 跳转到下一步
  const handleNextStep = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/step/framework-generation`);
    }
  };

  const materialCategories = categories.length > 0 ? categories : [
    { value: '企业资质', label: '企业资质', icon: <SafetyCertificateOutlined />, color: 'blue' },
    { value: '项目经验', label: '项目经验', icon: <TrophyOutlined />, color: 'green' },
    { value: '技术证明', label: '技术证明', icon: <FileTextOutlined />, color: 'orange' },
    { value: '财务证明', label: '财务证明', icon: <BankOutlined />, color: 'purple' },
    { value: '人员证书', label: '人员证书', icon: <TeamOutlined />, color: 'cyan' },
    { value: '其他资料', label: '其他资料', icon: <FolderOutlined />, color: 'default' },
  ];

  const getCategoryInfo = (category: string) => {
    return materialCategories.find(cat => cat.value === category) || materialCategories[5];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'expired': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '有效';
      case 'expired': return '已过期';
      case 'pending': return '待审核';
      default: return '未知';
    }
  };

  const columns = [
    {
      title: '资料名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Material) => (
        <Space>
          {record.isRequired && <Tag color="red">必需</Tag>}
          <Text strong={record.isRequired}>{name}</Text>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryInfo = getCategoryInfo(category);
        return (
          <Tag color={categoryInfo.color} icon={categoryInfo.icon}>
            {category}
          </Tag>
        );
      },
    },
    {
      title: '文件类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '质量评分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number, record: Material) => {
        if (record.status === 'pending') {
          return <Tag color="orange">待评估</Tag>;
        }
        const color = score >= 90 ? 'green' : score >= 70 ? 'orange' : 'red';
        return (
          <Space>
            <Progress
              percent={score}
              size="small"
              strokeColor={color}
              style={{ width: 60 }}
            />
            <Text style={{ color }}>{score}分</Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Material) => {
        const color = getStatusColor(status);
        const text = getStatusText(status);
        return (
          <Space direction="vertical" size="small">
            <Tag color={color}>{text}</Tag>
            {record.expiryDate && status === 'expired' && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                过期: {record.expiryDate}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Material) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedMaterial(record);
              setViewModalVisible(true);
            }}
          >
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            编辑
          </Button>
          <Button type="link" icon={<DeleteOutlined />} size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAddMaterial = () => {
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newMaterial: Material = {
        id: Date.now().toString(),
        name: values.name,
        type: 'PDF', // 根据实际文件类型设置
        category: values.category,
        uploadDate: new Date().toISOString().split('T')[0],
        size: '0 MB', // 根据实际文件大小设置
        status: 'pending',
      };
      setMaterials(prev => [...prev, newMaterial]);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.docx,.doc,.jpg,.png',
    beforeUpload: () => false, // 阻止自动上传
  };

  const getFilteredMaterials = () => {
    if (activeTab === 'all') return materials;
    return materials.filter(material => material.category === activeTab);
  };

  const getStatistics = () => {
    const total = materials.length;
    const active = materials.filter(m => m.status === 'active').length;
    const expired = materials.filter(m => m.status === 'expired').length;
    const pending = materials.filter(m => m.status === 'pending').length;
    const required = materials.filter(m => m.isRequired).length;
    const avgScore = materials.filter(m => (m.score || 0) > 0).reduce((sum, m) => sum + (m.score || 0), 0) / materials.filter(m => (m.score || 0) > 0).length || 0;

    return { total, active, expired, pending, required, avgScore };
  };

  const stats = getStatistics();

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
      {/* 页面顶部导航（返回/上一步/下一步） */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>流程导航</Text>
          <Space>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回项目流程</Button>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/file-formatting`)}>上一步</Button>
            <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/step/framework-generation`)} disabled={materials.length === 0}>
              下一步
            </Button>
          </Space>
        </div>
      </Card>


      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
              <div style={{ color: '#666' }}>总资料数</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{stats.active}</div>
              <div style={{ color: '#666' }}>有效资料</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{stats.expired}</div>
              <div style={{ color: '#666' }}>过期资料</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>{stats.pending}</div>
              <div style={{ color: '#666' }}>待审核</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>{stats.required}</div>
              <div style={{ color: '#666' }}>必需资料</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#13c2c2' }}>{stats.avgScore.toFixed(0)}</div>
              <div style={{ color: '#666' }}>平均评分</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAnalyzeRequirements}
            loading={analyzing}
            disabled={!projectId}
          >
            分析资料需求
          </Button>

          <Button
            icon={<PlusOutlined />}
            onClick={handleAddMaterial}
            disabled={!projectId}
          >
            添加资料
          </Button>

          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={!projectId}
            >
              批量上传
            </Button>
          </Upload>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportReport}
            loading={loading}
            disabled={!projectId}
          >
            导出报告
          </Button>
        </Space>

        <Alert
          message="资料管理提示"
          description="请及时上传和更新投标所需的各类资料文件，确保资料的有效性和完整性。红色标记为必需资料，请优先处理。"
          type="info"
          showIcon
          closable
        />
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: '全部资料',
              children: (
                <Table
                  columns={columns}
                  dataSource={getFilteredMaterials()}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `�?${range[0]}-${range[1]} 条，�?${total} 条`,
                  }}
                />
              ),
            },
            ...materialCategories.map(category => ({
              key: category.value,
              label: (
                <Space>
                  {category.icon}
                  {category.label}
                  <Tag color={category.color}>
                    {materials.filter(m => m.category === category.value).length}
                  </Tag>
                </Space>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={getFilteredMaterials()}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `�?${range[0]}-${range[1]} 条，�?${total} 条`,
                  }}
                />
              ),
            })),
          ]}
        />
      </Card>

      <Modal
        title="添加资料"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="资料名称"
            rules={[{ required: true, message: '请输入资料名称' }]}
          >
            <Input placeholder="请输入资料名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="资料分类"
            rules={[{ required: true, message: '请选择资料分类' }]}
          >
            <Select placeholder="请选择资料分类">
              {materialCategories.map(category => (
                <Option key={category.value} value={category.value}>
                  <Space>
                    {category.icon}
                    {category.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="上传文件">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资料详情查看模态框 */}
      <Modal
        title="资料详情"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedMaterial(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />}>
            下载文件
          </Button>,
        ]}
        width={800}
      >
        {selectedMaterial && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="资料名称" span={2}>
              <Space>
                {selectedMaterial?.isRequired && <Tag color="red">必需</Tag>}
                <Text strong>{selectedMaterial?.name}</Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="资料分类">
              <Tag color={getCategoryInfo(selectedMaterial?.category || '').color} icon={getCategoryInfo(selectedMaterial?.category || '').icon}>
                {selectedMaterial?.category}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="文件类型">
              <Tag color="blue">{selectedMaterial?.type}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="文件大小">
              {selectedMaterial?.size}
            </Descriptions.Item>

            <Descriptions.Item label="上传日期">
              {selectedMaterial?.uploadDate}
            </Descriptions.Item>

            {selectedMaterial?.expiryDate && (
              <Descriptions.Item label="有效期至">
                <Text type={selectedMaterial?.status === 'expired' ? 'danger' : 'secondary'}>
                  {selectedMaterial?.expiryDate}
                </Text>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedMaterial?.status || '')}>
                {getStatusText(selectedMaterial?.status || '')}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="质量评分">
              {selectedMaterial?.status === 'pending' ? (
                <Tag color="orange">待评估</Tag>
              ) : (
                <Space>
                  <Progress
                    percent={selectedMaterial?.score || 0}
                    size="small"
                    strokeColor={(selectedMaterial?.score || 0) >= 90 ? '#52c41a' : (selectedMaterial?.score || 0) >= 70 ? '#fa8c16' : '#f5222d'}
                    style={{ width: 100 }}
                  />
                  <Text>{selectedMaterial?.score || 0}分</Text>
                </Space>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="标签" span={2}>
              <Space wrap>
                {selectedMaterial?.tags?.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </Descriptions.Item>

            {selectedMaterial?.description && (
              <Descriptions.Item label="描述" span={2}>
                {selectedMaterial?.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 资料需求分析结果 */}
      {requirements && (
        <Card title="资料需求分析结果" style={{ marginBottom: 24 }}>
          <Alert
            message="资料需求分析完成"
            description="系统已根据招标文件分析出所需的资料清单，请按照要求准备相关材料。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 这里可以显示具体的需求分析结果 */}
          <Descriptions bordered>
            <Descriptions.Item label="分析状态">
              <Tag color="green">已完成</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="需求类型">
              {requirements.analysis_type || 'auto'}
            </Descriptions.Item>
            <Descriptions.Item label="分析时间">
              {requirements.analyzed_at || new Date().toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 下一步按钮 */}
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleNextStep}
              disabled={!projectId}
            >
              下一步：框架生成
            </Button>

            <Button
              size="large"
              onClick={handleExportReport}
              loading={loading}
              disabled={!projectId}
            >
              导出资料清单
            </Button>
          </Space>
        </div>
      </Card>

      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="material-management"
        canProceed={materials.length > 0}
      />
    </div>
  );
};

export default MaterialManagementPage;
