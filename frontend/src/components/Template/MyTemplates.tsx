import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Upload,
  Progress,
  App,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface MyTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'private';
  createTime: Date;
  updateTime: Date;
  fileSize: string;
  downloads: number;
  isShared: boolean;
  thumbnail: string;
}

const MyTemplates: React.FC = () => {
  const { message } = App.useApp();
  const [templates, setTemplates] = useState<MyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<MyTemplate | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // 生成模拟我的模板数据
  const generateMockTemplates = (): MyTemplate[] => {
    const categories = ['商务投标', '技术方案', '工程建设', '服务采购'];
    const statuses: MyTemplate['status'][] = ['draft', 'published', 'private'];

    return Array.from({ length: 15 }, (_, index) => ({
      id: `my_template_${index + 1}`,
      title: `我的${categories[index % categories.length]}模板 ${index + 1}`,
      description: `这是我创建的${categories[index % categories.length]}模板，包含了丰富的内容和专业的设计。`,
      category: categories[index % categories.length],
      status: statuses[index % statuses.length],
      createTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      fileSize: `${(Math.random() * 15 + 1).toFixed(1)}MB`,
      downloads: Math.floor(Math.random() * 500),
      isShared: Math.random() > 0.5,
      thumbnail: `https://picsum.photos/300/200?random=${index + 100}`,
    }));
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockTemplates = generateMockTemplates();
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  // 过滤模板
  useEffect(() => {
    let filtered = templates;

    if (searchText) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(template => template.status === statusFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchText, statusFilter]);

  // 获取状态文本
  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      private: '私有',
    };
    return texts[status] || status;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      published: 'success',
      private: 'warning',
    };
    return colors[status] || 'default';
  };

  // 预览模板
  const handlePreview = (template: MyTemplate) => {
    setSelectedTemplate(template);
    setPreviewModalVisible(true);
  };

  // 编辑模板
  const handleEdit = (template: MyTemplate) => {
    message.info(`编辑模板: ${template.title}`);
    // TODO: 跳转到模板编辑器
  };

  // 分享模板
  const handleShare = (template: MyTemplate) => {
    setSelectedTemplate(template);
    setShareModalVisible(true);
  };

  // 确认分享
  const handleConfirmShare = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t =>
      t.id === selectedTemplate.id
        ? { ...t, isShared: true, status: 'published' as const }
        : t
    );
    
    setTemplates(updatedTemplates);
    setShareModalVisible(false);
    setSelectedTemplate(null);
    message.success('模板分享成功');
  };

  // 下载模板
  const handleDownload = (template: MyTemplate) => {
    message.success(`开始下载: ${template.title}`);
    // TODO: 实现下载逻辑
  };

  // 删除模板
  const handleDelete = (template: MyTemplate) => {
    const updatedTemplates = templates.filter(t => t.id !== template.id);
    setTemplates(updatedTemplates);
    message.success('模板删除成功');
  };

  // 上传模板
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.docx,.pdf,.pptx',
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.type === 'application/pdf' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      
      if (!isValidType) {
        message.error('只支持上传 Word、PDF、PowerPoint 文件！');
        return false;
      }
      
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('文件大小不能超过 50MB！');
        return false;
      }
      
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        setUploadModalVisible(false);
        // TODO: 刷新模板列表
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  const columns: ColumnsType<MyTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '下载次数',
      dataIndex: 'downloads',
      key: 'downloads',
      width: 100,
      sorter: (a, b) => a.downloads - b.downloads,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 120,
      render: (time) => time.toLocaleDateString(),
      sorter: (a, b) => a.updateTime.getTime() - b.updateTime.getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title="分享">
            <Button
              type="text"
              size="small"
              icon={<ShareAltOutlined />}
              onClick={() => handleShare(record)}
              disabled={record.isShared}
            />
          </Tooltip>
          
          <Tooltip title="下载">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 工具栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="搜索模板名称或描述"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="draft">草稿</Option>
            <Option value="published">已发布</Option>
            <Option value="private">私有</Option>
          </Select>
        </Space>
        
        <Space>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            上传模板
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => message.info('创建新模板功能开发中...')}
          >
            创建模板
          </Button>
        </Space>
      </div>

      {/* 模板表格 */}
      <Table
        columns={columns}
        dataSource={filteredTemplates}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />

      {/* 预览模态框 */}
      <Modal
        title={`预览模板 - ${selectedTemplate?.title}`}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setSelectedTemplate(null);
        }}
        footer={[
          <Button key="edit" onClick={() => selectedTemplate && handleEdit(selectedTemplate)}>
            编辑模板
          </Button>,
          <Button key="download" onClick={() => selectedTemplate && handleDownload(selectedTemplate)}>
            下载模板
          </Button>,
        ]}
        width={800}
      >
        {selectedTemplate && (
          <div>
            <img
              src={selectedTemplate.thumbnail}
              alt={selectedTemplate.title}
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Text strong>描述：</Text>
              <Text>{selectedTemplate.description}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text strong>分类：</Text>
                <Tag color="blue">{selectedTemplate.category}</Tag>
              </div>
              <div>
                <Text strong>状态：</Text>
                <Tag color={getStatusColor(selectedTemplate.status)}>
                  {getStatusText(selectedTemplate.status)}
                </Tag>
              </div>
              <div>
                <Text strong>大小：</Text>
                <Text>{selectedTemplate.fileSize}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 分享模态框 */}
      <Modal
        title="分享模板"
        open={shareModalVisible}
        onOk={handleConfirmShare}
        onCancel={() => {
          setShareModalVisible(false);
          setSelectedTemplate(null);
        }}
        okText="确认分享"
        cancelText="取消"
      >
        <div>
          <p>确定要将模板 "{selectedTemplate?.title}" 分享到模板库吗？</p>
          <p style={{ color: '#666', fontSize: 12 }}>
            分享后，其他用户将可以查看和使用这个模板。
          </p>
        </div>
      </Modal>

      {/* 上传模板模态框 */}
      <Modal
        title="上传模板"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 Word (.docx)、PDF (.pdf)、PowerPoint (.pptx) 格式
              <br />
              文件大小不超过 50MB
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
};

export default MyTemplates;
