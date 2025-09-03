import React, { useState } from 'react';
import { Card, Button, Typography, Space, Tabs, Alert, Row, Col, Spin, Tag, Divider } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DownloadOutlined, 
  PrinterOutlined,
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: string;
  pages?: number;
  lastModified: string;
  content?: string;
}

const FilePreviewPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // 模拟文件信息
  const fileInfo: FileInfo = {
    id: '1',
    name: '招标文件-汾西县档案整理项目.pdf',
    type: 'PDF',
    size: '15.2 MB',
    pages: 45,
    lastModified: '2024-11-01 14:30:00',
    content: `
第一章 招标公告

一、项目概况
项目名称：汾西县购置档案整理服务及设备配置项目
项目编号：FXDAZL-2024-001
招标人：汾西县档案局
招标代理机构：山西省政府采购中心

二、项目内容
本项目主要包括：
1. 档案数字化扫描设备采购
2. 档案管理软件系统开发
3. 档案整理服务实施
4. 人员培训及技术支持

三、投标人资格要求
1. 具有独立法人资格
2. 具有档案管理相关资质
3. 具有3年以上类似项目经验
4. 注册资金不少于500万元

四、投标文件要求
投标文件应包括：
1. 商务文件
2. 技术文件
3. 资格证明文件
4. 投标保证金缴纳证明

五、评标方法
本项目采用综合评分法：
- 技术评分：60分
- 商务评分：30分
- 资信评分：10分

六、时间安排
- 投标文件递交截止时间：2024年11月15日 14:30
- 开标时间：2024年11月15日 15:00
- 开标地点：汾西县政务服务中心三楼会议室
    `,
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#f5222d' }} />;
      case 'docx':
      case 'doc':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在加载文件...</Text>
          </div>
        </div>
      );
    }

    if (fileInfo.type === 'PDF') {
      return (
        <div 
          style={{ 
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 24,
            minHeight: 600,
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center top',
            transition: 'transform 0.3s ease',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4}>招标文件预览</Title>
            <Text type="secondary">第 {currentPage} 页，共 {fileInfo.pages} 页</Text>
          </div>
          
          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
            {fileInfo.content}
          </div>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Text type="secondary">暂不支持此文件类型的预览</Text>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 文件信息卡片 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="large">
              <Space>
                {getFileIcon(fileInfo.type)}
                <div>
                  <Text strong style={{ fontSize: 16 }}>{fileInfo.name}</Text>
                  <br />
                  <Text type="secondary">
                    {fileInfo.size} • {fileInfo.pages && `${fileInfo.pages} 页 • `}
                    最后修改: {fileInfo.lastModified}
                  </Text>
                </div>
              </Space>
              <Tag color="blue">{fileInfo.type}</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />}>下载</Button>
              <Button icon={<PrinterOutlined />}>打印</Button>
              <Button icon={<FullscreenOutlined />}>全屏</Button>
              <Button 
                type={editMode ? 'primary' : 'default'} 
                icon={<EditOutlined />}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? '退出编辑' : '编辑'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 工具栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>缩放:</Text>
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={zoom <= 50} />
              <Text style={{ minWidth: 60, textAlign: 'center' }}>{zoom}%</Text>
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={zoom >= 200} />
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Text strong>旋转:</Text>
              <Button icon={<RotateLeftOutlined />} onClick={handleRotateLeft} />
              <Button icon={<RotateRightOutlined />} onClick={handleRotateRight} />
            </Space>
          </Col>

          {fileInfo.pages && (
            <Col>
              <Space>
                <Text strong>页面:</Text>
                <Button 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  上一页
                </Button>
                <Text style={{ minWidth: 80, textAlign: 'center' }}>
                  {currentPage} / {fileInfo.pages}
                </Text>
                <Button 
                  disabled={currentPage >= fileInfo.pages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  下一页
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </Card>

      {/* 主要内容区域 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'preview',
              label: '文件预览',
              children: (
                <div style={{ minHeight: 600, overflow: 'auto' }}>
                  {renderPreviewContent()}
                </div>
              ),
            },
            {
              key: 'analysis',
              label: '智能分析',
              children: (
                <div style={{ padding: 24 }}>
                  <Alert
                    message="AI分析结果"
                    description="系统已自动分析该招标文件，提取了关键信息用于投标文件生成。"
                    type="success"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                  
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <Title level={5}>关键信息提取</Title>
                      <ul>
                        <li>项目名称：汾西县购置档案整理服务及设备配置项目</li>
                        <li>项目编号：FXDAZL-2024-001</li>
                        <li>投标截止时间：2024年11月15日 14:30</li>
                        <li>开标时间：2024年11月15日 15:00</li>
                        <li>评标方法：综合评分法（技术60%+商务30%+资信10%）</li>
                      </ul>
                    </div>
                    
                    <Divider />
                    
                    <div>
                      <Title level={5}>投标要求分析</Title>
                      <ul>
                        <li>资格要求：独立法人、档案管理资质、3年经验、注册资金500万+</li>
                        <li>技术要求：档案数字化设备、管理软件、整理服务、培训支持</li>
                        <li>文件要求：商务文件、技术文件、资格证明、保证金证明</li>
                      </ul>
                    </div>
                  </Space>
                </div>
              ),
            },
            {
              key: 'edit',
              label: '文本编辑',
              disabled: !editMode,
              children: (
                <div style={{ padding: 24 }}>
                  <Alert
                    message="编辑模式"
                    description="在此模式下，您可以对文档内容进行编辑和标注。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                  <Text type="secondary">编辑功能开发中...</Text>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default FilePreviewPage;
