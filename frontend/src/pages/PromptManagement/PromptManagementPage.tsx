import React, { useState } from 'react';
import { Card, Button, Typography, Space, Table, Tag, Modal, Form, Input, Select, Row, Col, Tabs, Alert, Divider } from 'antd';
import { 
  BulbOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  RobotOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Prompt {
  id: string;
  name: string;
  category: string;
  type: 'system' | 'user' | 'template';
  content: string;
  description: string;
  tags: string[];
  favorite: boolean;
  usage: number;
  lastUsed: string;
  createdAt: string;
  variables?: string[];
}

const PromptManagementPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');

  // 模拟提示词数据
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: '1',
      name: '招标文件分析提示词',
      category: '文件分析',
      type: 'system',
      content: `请分析以下招标文件，提取关键信息：

1. 项目基本信息：
   - 项目名称
   - 项目编号
   - 招标人信息
   - 投标截止时间

2. 技术要求：
   - 核心技术指标
   - 设备配置要求
   - 实施标准

3. 商务要求：
   - 预算范围
   - 付款方式
   - 履约保证金

4. 评标方法：
   - 评分标准
   - 权重分配
   - 关键评分点

请以结构化的方式输出分析结果。`,
      description: '用于分析招标文件并提取关键信息的系统提示词',
      tags: ['招标分析', '信息提取', '系统'],
      favorite: true,
      usage: 156,
      lastUsed: '2024-11-01 14:30',
      createdAt: '2024-10-15 09:00',
      variables: ['招标文件内容'],
    },
    {
      id: '2',
      name: '技术方案生成提示词',
      category: '内容生成',
      type: 'template',
      content: `基于以下招标要求，生成技术实施方案：

项目背景：{project_background}
技术要求：{technical_requirements}
实施周期：{implementation_period}

请按以下结构生成技术方案：

一、项目理解与分析
1. 项目背景理解
2. 需求分析
3. 技术难点识别

二、技术实施方案
1. 总体技术路线
2. 关键技术选择
3. 实施步骤规划

三、质量保证措施
1. 质量控制体系
2. 测试验收方案
3. 风险控制措施

请确保方案具有针对性和可操作性。`,
      description: '用于生成技术实施方案的模板提示词',
      tags: ['技术方案', '内容生成', '模板'],
      favorite: false,
      usage: 89,
      lastUsed: '2024-10-30 16:45',
      createdAt: '2024-10-20 11:30',
      variables: ['project_background', 'technical_requirements', 'implementation_period'],
    },
    {
      id: '3',
      name: '商务方案优化提示词',
      category: '内容生成',
      type: 'user',
      content: `请帮我优化以下商务方案，使其更具竞争力：

当前方案：{current_proposal}
竞争对手情况：{competitor_info}
预算限制：{budget_limit}

优化要求：
1. 提高性价比表现
2. 突出我方优势
3. 合理控制成本
4. 增强方案吸引力

请提供具体的优化建议和修改方案。`,
      description: '用于优化商务方案的用户提示词',
      tags: ['商务方案', '优化', '用户'],
      favorite: true,
      usage: 67,
      lastUsed: '2024-10-29 10:20',
      createdAt: '2024-10-25 14:15',
      variables: ['current_proposal', 'competitor_info', 'budget_limit'],
    },
    {
      id: '4',
      name: '资质证明整理提示词',
      category: '资料管理',
      type: 'template',
      content: `请帮我整理以下资质证明材料：

企业基本信息：{company_info}
项目要求：{project_requirements}
现有资质：{existing_qualifications}

整理要求：
1. 按重要性排序
2. 标注有效期
3. 识别缺失资质
4. 提供补充建议

输出格式：
- 必需资质清单
- 加分资质清单
- 资质状态说明
- 改进建议`,
      description: '用于整理和分析资质证明材料的模板',
      tags: ['资质管理', '材料整理', '模板'],
      favorite: false,
      usage: 34,
      lastUsed: '2024-10-28 09:15',
      createdAt: '2024-10-22 16:45',
      variables: ['company_info', 'project_requirements', 'existing_qualifications'],
    },
  ]);

  const categories = ['全部', '文件分析', '内容生成', '资料管理', '格式配置', '其他'];
  const promptTypes = [
    { value: 'system', label: '系统提示词', color: 'blue' },
    { value: 'template', label: '模板提示词', color: 'green' },
    { value: 'user', label: '用户提示词', color: 'orange' },
  ];

  const handleAddPrompt = () => {
    setEditingPrompt(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    form.setFieldsValue(prompt);
    setModalVisible(true);
  };

  const handleSavePrompt = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingPrompt) {
        // 编辑现有提示词
        setPrompts(prev => prev.map(p => 
          p.id === editingPrompt.id ? { ...p, ...values } : p
        ));
      } else {
        // 添加新提示词
        const newPrompt: Prompt = {
          id: Date.now().toString(),
          ...values,
          favorite: false,
          usage: 0,
          lastUsed: '',
          createdAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
          variables: extractVariables(values.content),
        };
        setPrompts(prev => [...prev, newPrompt]);
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleToggleFavorite = (promptId: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === promptId ? { ...p, favorite: !p.favorite } : p
    ));
  };

  const handleDeletePrompt = (promptId: string) => {
    setPrompts(prev => prev.filter(p => p.id !== promptId));
  };

  const getFilteredPrompts = () => {
    if (activeTab === 'all') return prompts;
    if (activeTab === 'favorites') return prompts.filter(p => p.favorite);
    return prompts.filter(p => p.category === activeTab);
  };

  const columns = [
    {
      title: '提示词名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Prompt) => (
        <Space>
          <Button 
            type="text" 
            icon={record.favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            size="small"
            onClick={() => handleToggleFavorite(record.id)}
          />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeInfo = promptTypes.find(t => t.value === type);
        return <Tag color={typeInfo?.color}>{typeInfo?.label}</Tag>;
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usage',
      key: 'usage',
      sorter: (a: Prompt, b: Prompt) => a.usage - b.usage,
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (lastUsed: string) => lastUsed || '未使用',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Prompt) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => {
              setSelectedPrompt(record);
              setPreviewModalVisible(true);
            }}
          >
            预览
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditPrompt(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            size="small"
          >
            复制
          </Button>
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            size="small"
            danger
            onClick={() => handleDeletePrompt(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const filteredPrompts = getFilteredPrompts();

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {prompts.length}
              </div>
              <div style={{ color: '#666' }}>总提示词</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {prompts.filter(p => p.favorite).length}
              </div>
              <div style={{ color: '#666' }}>收藏提示词</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {prompts.filter(p => p.type === 'system').length}
              </div>
              <div style={{ color: '#666' }}>系统提示词</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {prompts.reduce((sum, p) => sum + p.usage, 0)}
              </div>
              <div style={{ color: '#666' }}>总使用次数</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 操作区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Alert
              message="提示词管理"
              description="管理AI提示词模板，支持分类、收藏、编辑等功能。合理使用提示词可以显著提升AI生成内容的质量。"
              type="info"
              showIcon
              closable
            />
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPrompt}>
              添加提示词
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 主要内容 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: '全部提示词',
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredPrompts}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                />
              ),
            },
            {
              key: 'favorites',
              label: (
                <Space>
                  <StarFilled style={{ color: '#faad14' }} />
                  收藏夹
                  <Tag color="orange">
                    {prompts.filter(p => p.favorite).length}
                  </Tag>
                </Space>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredPrompts}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            ...categories.slice(1, -1).map(category => ({
              key: category,
              label: (
                <Space>
                  {category}
                  <Tag color="blue">
                    {prompts.filter(p => p.category === category).length}
                  </Tag>
                </Space>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredPrompts}
                  rowKey="id"
                  pagination={false}
                />
              ),
            })),
          ]}
        />
      </Card>

      {/* 添加/编辑提示词模态框 */}
      <Modal
        title={editingPrompt ? '编辑提示词' : '添加提示词'}
        open={modalVisible}
        onOk={handleSavePrompt}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="提示词名称"
                rules={[{ required: true, message: '请输入提示词名称' }]}
              >
                <Input placeholder="请输入提示词名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  {categories.slice(1).map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  {promptTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="请输入标签">
                  <Option value="系统">系统</Option>
                  <Option value="模板">模板</Option>
                  <Option value="用户">用户</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请简要描述提示词的用途" />
          </Form.Item>

          <Form.Item
            name="content"
            label="提示词内容"
            rules={[{ required: true, message: '请输入提示词内容' }]}
          >
            <TextArea 
              rows={10} 
              placeholder="请输入提示词内容，可以使用 {变量名} 的格式定义变量"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title="提示词预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          <Button key="copy" icon={<CopyOutlined />}>
            复制内容
          </Button>,
          <Button key="use" type="primary" icon={<RobotOutlined />}>
            立即使用
          </Button>,
        ]}
        width={800}
      >
        {selectedPrompt && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>名称：</Text>
              <Text>{selectedPrompt.name}</Text>
            </div>
            
            <div>
              <Text strong>描述：</Text>
              <Text>{selectedPrompt.description}</Text>
            </div>

            {selectedPrompt.variables && selectedPrompt.variables.length > 0 && (
              <div>
                <Text strong>变量：</Text>
                <Space wrap>
                  {selectedPrompt.variables.map(variable => (
                    <Tag key={variable} color="purple">{variable}</Tag>
                  ))}
                </Space>
              </div>
            )}

            <Divider />

            <div>
              <Text strong>内容：</Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 6, 
                marginTop: 8,
                whiteSpace: 'pre-line',
                fontFamily: 'monospace',
              }}>
                {selectedPrompt.content}
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PromptManagementPage;
