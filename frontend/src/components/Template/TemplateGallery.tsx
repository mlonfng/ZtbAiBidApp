import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Rate,
  Avatar,
  Tooltip,
  Modal,
  message,
  Empty,
  Pagination,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  StarFilled,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FilterOutlined,
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { Meta } = Card;

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  thumbnail: string;
  rating: number;
  downloads: number;
  favorites: number;
  createTime: Date;
  updateTime: Date;
  isPublic: boolean;
  isFavorited: boolean;
  fileSize: string;
  pageCount: number;
}

const TemplateGallery: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // 生成模拟模板数据
  const generateMockTemplates = (): Template[] => {
    const categories = ['商务投标', '技术方案', '工程建设', '服务采购', '产品销售'];
    const tags = ['标准模板', '精品推荐', '热门', '新上架', '免费', '付费'];
    const authors = [
      { id: 'author1', name: '张设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=张设计师' },
      { id: 'author2', name: '李专家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=李专家' },
      { id: 'author3', name: '王顾问', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=王顾问' },
      { id: 'author4', name: '赵经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=赵经理' },
    ];

    return Array.from({ length: 24 }, (_, index) => ({
      id: `template_${index + 1}`,
      title: `${categories[index % categories.length]}模板 ${index + 1}`,
      description: `这是一个专业的${categories[index % categories.length]}模板，包含完整的文档结构和精美的设计，适用于各种投标场景。`,
      category: categories[index % categories.length],
      tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
      author: authors[index % authors.length],
      thumbnail: `https://picsum.photos/300/200?random=${index + 1}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      downloads: Math.floor(Math.random() * 1000) + 100,
      favorites: Math.floor(Math.random() * 200) + 20,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      isPublic: Math.random() > 0.2,
      isFavorited: Math.random() > 0.7,
      fileSize: `${(Math.random() * 10 + 1).toFixed(1)}MB`,
      pageCount: Math.floor(Math.random() * 50) + 10,
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

  // 过滤和排序模板
  useEffect(() => {
    let filtered = templates;

    // 文本搜索
    if (searchText) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description.toLowerCase().includes(searchText.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // 分类过滤
    if (categoryFilter) {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // 排序
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => b.updateTime.getTime() - a.updateTime.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'favorites':
        filtered.sort((a, b) => b.favorites - a.favorites);
        break;
    }

    setFilteredTemplates(filtered);
    setCurrentPage(1);
  }, [templates, searchText, categoryFilter, sortBy]);

  // 获取当前页模板
  const getCurrentPageTemplates = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTemplates.slice(startIndex, endIndex);
  };

  // 获取唯一分类
  const getUniqueCategories = () => {
    return [...new Set(templates.map(template => template.category))];
  };

  // 预览模板
  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewModalVisible(true);
  };

  // 下载模板
  const handleDownload = (template: Template) => {
    message.success(`开始下载模板: ${template.title}`);
    // TODO: 实现下载逻辑
  };

  // 收藏/取消收藏
  const handleToggleFavorite = (template: Template) => {
    const updatedTemplates = templates.map(t =>
      t.id === template.id ? { ...t, isFavorited: !t.isFavorited } : t
    );
    setTemplates(updatedTemplates);
    message.success(template.isFavorited ? '已取消收藏' : '已添加到收藏夹');
  };

  // 使用模板
  const handleUseTemplate = (template: Template) => {
    message.success(`开始使用模板: ${template.title}`);
    // TODO: 实现使用模板逻辑
  };

  const currentPageTemplates = getCurrentPageTemplates();

  return (
    <div>
      {/* 搜索和筛选工具栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索模板名称、描述或标签"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="选择分类"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {getUniqueCategories().map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={12} sm={6} md={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
            >
              <Option value="latest">最新更新</Option>
              <Option value="popular">下载最多</Option>
              <Option value="rating">评分最高</Option>
              <Option value="favorites">收藏最多</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">
                共找到 {filteredTemplates.length} 个模板
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 模板网格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text>加载中...</Text>
        </div>
      ) : currentPageTemplates.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无模板"
        />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {currentPageTemplates.map(template => (
              <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ position: 'relative' }}>
                      <img
                        alt={template.title}
                        src={template.thumbnail}
                        style={{ height: 200, width: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 4,
                      }}>
                        {template.tags.slice(0, 2).map(tag => (
                          <Tag key={tag} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <Button
                        type="text"
                        icon={template.isFavorited ? <StarFilled /> : <StarOutlined />}
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          color: template.isFavorited ? '#faad14' : '#fff',
                          background: 'rgba(0, 0, 0, 0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(template);
                        }}
                      />
                    </div>
                  }
                  actions={[
                    <Tooltip title="预览">
                      <EyeOutlined onClick={() => handlePreview(template)} />
                    </Tooltip>,
                    <Tooltip title="下载">
                      <DownloadOutlined onClick={() => handleDownload(template)} />
                    </Tooltip>,
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleUseTemplate(template)}
                    >
                      使用
                    </Button>,
                  ]}
                >
                  <Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong ellipsis style={{ flex: 1 }}>
                          {template.title}
                        </Text>
                        <Rate disabled defaultValue={template.rating} allowHalf style={{ fontSize: 12 }} />
                      </div>
                    }
                    description={
                      <div>
                        <Text ellipsis style={{ display: 'block', marginBottom: 8 }}>
                          {template.description}
                        </Text>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Avatar size="small" src={template.author.avatar} icon={<UserOutlined />} />
                          <Text style={{ fontSize: 12 }}>{template.author.name}</Text>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                          <span>下载: {template.downloads}</span>
                          <span>收藏: {template.favorites}</span>
                          <span>{template.fileSize}</span>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* 分页 */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredTemplates.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            />
          </div>
        </>
      )}

      {/* 预览模态框 */}
      <Modal
        title={`预览模板 - ${selectedTemplate?.title}`}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setSelectedTemplate(null);
        }}
        footer={[
          <Button key="download" onClick={() => selectedTemplate && handleDownload(selectedTemplate)}>
            下载模板
          </Button>,
          <Button key="use" type="primary" onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}>
            使用模板
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
            <div style={{ marginBottom: 16 }}>
              <Text strong>分类：</Text>
              <Tag color="blue">{selectedTemplate.category}</Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>标签：</Text>
              <Space wrap>
                {selectedTemplate.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text strong>作者：</Text>
                <Text>{selectedTemplate.author.name}</Text>
              </div>
              <div>
                <Text strong>页数：</Text>
                <Text>{selectedTemplate.pageCount} 页</Text>
              </div>
              <div>
                <Text strong>大小：</Text>
                <Text>{selectedTemplate.fileSize}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateGallery;
