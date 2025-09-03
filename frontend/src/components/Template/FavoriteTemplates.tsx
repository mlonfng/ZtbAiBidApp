import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
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
  List,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarFilled,
  UserOutlined,
  DeleteOutlined,
  HeartOutlined,
} from '@ant-design/icons';

const { Search } = Input;
const { Text, Title } = Typography;
const { Meta } = Card;

interface FavoriteTemplate {
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
  addTime: Date;
  fileSize: string;
  pageCount: number;
}

const FavoriteTemplates: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteTemplate[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<FavoriteTemplate | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // 生成模拟收藏模板数据
  const generateMockFavorites = (): FavoriteTemplate[] => {
    const categories = ['商务投标', '技术方案', '工程建设', '服务采购', '产品销售'];
    const tags = ['精品推荐', '热门', '免费', '专业', '实用'];
    const authors = [
      { id: 'author1', name: '张设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=张设计师' },
      { id: 'author2', name: '李专家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=李专家' },
      { id: 'author3', name: '王顾问', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=王顾问' },
      { id: 'author4', name: '赵经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=赵经理' },
    ];

    return Array.from({ length: 12 }, (_, index) => ({
      id: `favorite_${index + 1}`,
      title: `收藏的${categories[index % categories.length]}模板 ${index + 1}`,
      description: `这是一个收藏的${categories[index % categories.length]}模板，具有很高的实用价值和专业水准。`,
      category: categories[index % categories.length],
      tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
      author: authors[index % authors.length],
      thumbnail: `https://picsum.photos/300/200?random=${index + 200}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      downloads: Math.floor(Math.random() * 2000) + 500,
      addTime: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      fileSize: `${(Math.random() * 8 + 2).toFixed(1)}MB`,
      pageCount: Math.floor(Math.random() * 40) + 15,
    }));
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockFavorites = generateMockFavorites();
      setFavorites(mockFavorites);
      setFilteredFavorites(mockFavorites);
      setLoading(false);
    }, 1000);
  }, []);

  // 搜索过滤
  useEffect(() => {
    let filtered = favorites;

    if (searchText) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description.toLowerCase().includes(searchText.toLowerCase()) ||
        template.category.toLowerCase().includes(searchText.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredFavorites(filtered);
  }, [favorites, searchText]);

  // 预览模板
  const handlePreview = (template: FavoriteTemplate) => {
    setSelectedTemplate(template);
    setPreviewModalVisible(true);
  };

  // 下载模板
  const handleDownload = (template: FavoriteTemplate) => {
    message.success(`开始下载模板: ${template.title}`);
    // TODO: 实现下载逻辑
  };

  // 使用模板
  const handleUseTemplate = (template: FavoriteTemplate) => {
    message.success(`开始使用模板: ${template.title}`);
    // TODO: 实现使用模板逻辑
  };

  // 取消收藏
  const handleRemoveFavorite = (template: FavoriteTemplate) => {
    Modal.confirm({
      title: '取消收藏',
      content: `确定要取消收藏模板 "${template.title}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const updatedFavorites = favorites.filter(f => f.id !== template.id);
        setFavorites(updatedFavorites);
        message.success('已取消收藏');
      },
    });
  };

  // 清空收藏夹
  const handleClearAll = () => {
    Modal.confirm({
      title: '清空收藏夹',
      content: '确定要清空所有收藏的模板吗？此操作不可恢复。',
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setFavorites([]);
        message.success('收藏夹已清空');
      },
    });
  };

  return (
    <div>
      {/* 工具栏 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="搜索收藏的模板"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Text type="secondary">
            共收藏 {filteredFavorites.length} 个模板
          </Text>
        </Space>
        
        <Space>
          {favorites.length > 0 && (
            <Button danger onClick={handleClearAll}>
              清空收藏夹
            </Button>
          )}
        </Space>
      </div>

      {/* 收藏模板展示 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text>加载中...</Text>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <Empty
          image={<HeartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Text type="secondary">
                {favorites.length === 0 ? '还没有收藏任何模板' : '没有找到匹配的模板'}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {favorites.length === 0 ? '去模板库逛逛，收藏喜欢的模板吧' : '试试其他搜索关键词'}
              </Text>
            </div>
          }
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredFavorites.map(template => (
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
                      icon={<StarFilled />}
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        color: '#faad14',
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(template);
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
                  <Tooltip title="取消收藏">
                    <DeleteOutlined onClick={() => handleRemoveFavorite(template)} />
                  </Tooltip>,
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
                        <span>{template.fileSize}</span>
                        <span>收藏于: {template.addTime.toLocaleDateString()}</span>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="primary"
                          size="small"
                          block
                          onClick={() => handleUseTemplate(template)}
                        >
                          使用模板
                        </Button>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
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
              <div>
                <Text strong>收藏时间：</Text>
                <Text>{selectedTemplate.addTime.toLocaleDateString()}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FavoriteTemplates;
