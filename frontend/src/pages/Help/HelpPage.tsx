import React, { useState } from 'react';
import { Card, Button, Typography, Space, Collapse, Tabs, Input, List, Tag, Row, Col, Steps, Alert } from 'antd';
import { 
  QuestionCircleOutlined, 
  SearchOutlined, 
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  RobotOutlined,
  ExportOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

interface HelpItem {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: string[];
  duration: string;
}

const HelpPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 帮助文档数据
  const helpItems: HelpItem[] = [
    {
      id: '1',
      title: '如何创建投标项目？',
      category: '项目管理',
      content: `1. 点击"投标项目"菜单进入项目列表页面
2. 点击"创建新项目"按钮
3. 填写项目基本信息（项目名称、描述等）
4. 上传招标文件（支持PDF、DOCX格式）
5. 设置项目参数（截止时间、服务模式等）
6. 点击"创建项目"完成创建`,
      tags: ['项目', '创建', '招标文件'],
    },
    {
      id: '2',
      title: '如何配置AI模型？',
      category: 'AI配置',
      content: `1. 进入"系统配置"页面
2. 选择"AI配置"选项卡
3. 选择AI提供商（DeepSeek或OpenAI）
4. 输入API密钥
5. 配置API地址和模型参数
6. 点击"测试连接"验证配置
7. 保存配置`,
      tags: ['AI', '配置', 'API'],
    },
    {
      id: '3',
      title: '如何使用AI生成内容？',
      category: '内容生成',
      content: `1. 完成招标文件分析
2. 进入"内容生成"页面
3. 选择要生成的章节
4. 选择合适的提示词模板
5. 点击"AI生成"按钮
6. 等待生成完成
7. 预览和编辑生成的内容`,
      tags: ['AI', '内容生成', '提示词'],
    },
    {
      id: '4',
      title: '如何导出投标文件？',
      category: '文档导出',
      content: `1. 确保所有章节内容已完成
2. 进入"文档导出"页面
3. 选择要导出的格式（PDF、DOCX、HTML）
4. 选择包含的章节
5. 点击"开始导出"
6. 等待生成完成
7. 下载生成的文档`,
      tags: ['导出', '文档', 'PDF'],
    },
    {
      id: '5',
      title: '如何管理投标资料？',
      category: '资料管理',
      content: `1. 进入"资料管理"页面
2. 点击"添加资料"上传文件
3. 选择资料分类（企业资质、项目经验等）
4. 填写资料描述和标签
5. 系统会自动评估资料质量
6. 查看资料状态和有效期
7. 及时更新过期资料`,
      tags: ['资料', '管理', '上传'],
    },
  ];

  // 教程数据
  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: '快速入门指南',
      description: '从零开始学习如何使用ZtbAi创建第一个投标项目',
      duration: '10分钟',
      steps: [
        '注册并登录系统',
        '配置AI模型（可选）',
        '创建投标项目',
        '上传招标文件',
        '查看分析结果',
        '生成投标文件框架',
        '使用AI生成内容',
        '导出最终文档',
      ],
    },
    {
      id: '2',
      title: 'AI配置详解',
      description: '详细了解如何配置和优化AI模型设置',
      duration: '15分钟',
      steps: [
        '了解不同AI提供商',
        '获取API密钥',
        '配置API参数',
        '测试连接状态',
        '优化模型参数',
        '管理API使用量',
      ],
    },
    {
      id: '3',
      title: '高级功能使用',
      description: '学习提示词管理、格式配置等高级功能',
      duration: '20分钟',
      steps: [
        '创建自定义提示词',
        '配置文档格式',
        '使用系统监控',
        '查看系统日志',
        '故障排除技巧',
      ],
    },
  ];

  const categories = ['全部', '项目管理', 'AI配置', '内容生成', '文档导出', '资料管理', '系统设置'];

  const filteredItems = helpItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 快速搜索 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Search
              placeholder="搜索帮助内容..."
              allowClear
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={12}>
            <Space wrap>
              {categories.map(category => (
                <Tag
                  key={category}
                  color={activeCategory === category ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'faq',
              label: (
                <Space>
                  <QuestionCircleOutlined />
                  常见问题
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Alert
                    message="快速帮助"
                    description="如果您在使用过程中遇到问题，可以通过搜索功能快速找到解决方案。"
                    type="info"
                    showIcon
                    closable
                  />
                  
                  <Collapse>
                    {filteredItems.map(item => (
                      <Panel 
                        header={
                          <Space>
                            <Text strong>{item.title}</Text>
                            <Tag color="blue">{item.category}</Tag>
                          </Space>
                        } 
                        key={item.id}
                      >
                        <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {item.content}
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <Text type="secondary">标签：</Text>
                          <Space wrap>
                            {item.tags.map(tag => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                          </Space>
                        </div>
                      </Panel>
                    ))}
                  </Collapse>
                </Space>
              ),
            },
            {
              key: 'tutorials',
              label: (
                <Space>
                  <PlayCircleOutlined />
                  使用教程
                </Space>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  {tutorials.map(tutorial => (
                    <Col span={8} key={tutorial.id}>
                      <Card 
                        size="small"
                        title={tutorial.title}
                        extra={<Tag color="green">{tutorial.duration}</Tag>}
                        actions={[
                          <Button type="primary" icon={<PlayCircleOutlined />}>
                            开始学习
                          </Button>
                        ]}
                      >
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {tutorial.description}
                        </Paragraph>
                        
                        <Steps
                          direction="vertical"
                          size="small"
                          current={-1}
                          items={tutorial.steps.slice(0, 4).map((step, index) => ({
                            title: step,
                            description: index === 3 && tutorial.steps.length > 4 ? `...还有${tutorial.steps.length - 4}个步骤` : undefined,
                          }))}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: 'docs',
              label: (
                <Space>
                  <BookOutlined />
                  功能文档
                </Space>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Card size="small" hoverable>
                      <div style={{ textAlign: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                        <div><Text strong>项目管理</Text></div>
                        <div><Text type="secondary">投标项目创建和管理</Text></div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" hoverable>
                      <div style={{ textAlign: 'center' }}>
                        <RobotOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                        <div><Text strong>AI功能</Text></div>
                        <div><Text type="secondary">AI配置和内容生成</Text></div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" hoverable>
                      <div style={{ textAlign: 'center' }}>
                        <ExportOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
                        <div><Text strong>文档导出</Text></div>
                        <div><Text type="secondary">多格式文档导出</Text></div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" hoverable>
                      <div style={{ textAlign: 'center' }}>
                        <SettingOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                        <div><Text strong>系统设置</Text></div>
                        <div><Text type="secondary">系统配置和管理</Text></div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'contact',
              label: '联系支持',
              children: (
                <Row gutter={[24, 24]}>
                  <Col span={8}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <PhoneOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                        <Title level={4}>电话支持</Title>
                        <Paragraph>
                          工作时间：周一至周五 9:00-18:00
                          <br />
                          支持热线：400-123-4567
                        </Paragraph>
                        <Button type="primary">立即拨打</Button>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col span={8}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <MailOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Title level={4}>邮件支持</Title>
                        <Paragraph>
                          我们会在24小时内回复您的邮件
                          <br />
                          support@ztbai.com
                        </Paragraph>
                        <Button type="primary">发送邮件</Button>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col span={8}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <MessageOutlined style={{ fontSize: 48, color: '#fa8c16', marginBottom: 16 }} />
                        <Title level={4}>在线客服</Title>
                        <Paragraph>
                          实时在线支持，快速解决问题
                          <br />
                          工作时间内即时响应
                        </Paragraph>
                        <Button type="primary">开始对话</Button>
                      </div>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default HelpPage;
