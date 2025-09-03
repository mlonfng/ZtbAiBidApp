import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, Form, Select, ColorPicker, Slider, Row, Col, Tabs, Spin, Result } from 'antd';
import {
  SettingOutlined,
  EyeOutlined,
  SaveOutlined,
  ReloadOutlined,

} from '@ant-design/icons';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import { formatConfigStepAPI } from '../../services/api';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';


const { Title, Text } = Typography;
const { Option } = Select;


interface FormatConfig {
  // 页面设置
  pageSize: string;
  pageOrientation: string;
  pageMargin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  // 字体设置
  fontFamily: string;
  fontSize: {
    title: number;
    heading1: number;
    heading2: number;
    heading3: number;
    body: number;
  };

  // 颜色设置
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };

  // 段落设置
  lineHeight: number;
  paragraphSpacing: number;
  textAlign: string;

  // 表格设置
  tableStyle: {
    borderColor: string;
    headerBackground: string;
    alternateRowColor: string;
  };
}

const FormatConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();
  const [form] = Form.useForm();
  const [previewMode, setPreviewMode] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // 默认格式配置
  const [formatConfig, setFormatConfig] = useState<FormatConfig>({
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargin: {
      top: 25,
      bottom: 25,
      left: 30,
      right: 30,
    },
    fontFamily: 'SimSun',
    fontSize: {
      title: 22,
      heading1: 18,
      heading2: 16,
      heading3: 14,
      body: 12,
    },
    colors: {
      primary: '#1890ff',
      secondary: '#52c41a',
      text: '#000000',
      background: '#ffffff',
    },
    lineHeight: 1.5,
    paragraphSpacing: 6,
    textAlign: 'left',
    tableStyle: {
      borderColor: '#d9d9d9',
      headerBackground: '#fafafa',
      alternateRowColor: '#f9f9f9',
    },
  });

  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();
      setFormatConfig({ ...formatConfig, ...values });
      setConfigSaved(true);
      // 调用 Step API 标记格式配置完成
      try {
        if (projectId) await formatConfigStepAPI.execute(projectId, values);
      } catch {}
      console.log('保存格式配置:', values);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleResetConfig = () => {
    form.resetFields();
    setFormatConfig({
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargin: { top: 25, bottom: 25, left: 30, right: 30 },
      fontFamily: 'SimSun',
      fontSize: { title: 22, heading1: 18, heading2: 16, heading3: 14, body: 12 },
      colors: { primary: '#1890ff', secondary: '#52c41a', text: '#000000', background: '#ffffff' },
      lineHeight: 1.5,
      paragraphSpacing: 6,
      textAlign: 'left',
      tableStyle: { borderColor: '#d9d9d9', headerBackground: '#fafafa', alternateRowColor: '#f9f9f9' },
    });
  };

  const renderPreview = () => (
    <div
      style={{
        background: formatConfig.colors.background,
        color: formatConfig.colors.text,
        fontFamily: formatConfig.fontFamily,
        lineHeight: formatConfig.lineHeight,
        padding: `${formatConfig.pageMargin.top}mm ${formatConfig.pageMargin.right}mm ${formatConfig.pageMargin.bottom}mm ${formatConfig.pageMargin.left}mm`,
        minHeight: '297mm', // A4 height
        width: formatConfig.pageOrientation === 'portrait' ? '210mm' : '297mm',
        margin: '0 auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: formatConfig.fontSize.title, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: formatConfig.colors.primary }}>
        投标文件标题示例
      </div>

      <div style={{ fontSize: formatConfig.fontSize.heading1, fontWeight: 'bold', marginBottom: 15, color: formatConfig.colors.primary }}>
        第一章 项目概述
      </div>

      <div style={{ fontSize: formatConfig.fontSize.body, marginBottom: formatConfig.paragraphSpacing, textAlign: formatConfig.textAlign as any }}>
        这是正文内容的示例。本段落展示了当前配置的字体、字号、行距和段落间距效果。通过调整左侧的格式配置选项，您可以实时预览文档的最终效果。
      </div>

      <div style={{ fontSize: formatConfig.fontSize.heading2, fontWeight: 'bold', marginBottom: 12, color: formatConfig.colors.secondary }}>
        1.1 项目背景
      </div>

      <div style={{ fontSize: formatConfig.fontSize.body, marginBottom: formatConfig.paragraphSpacing, textAlign: formatConfig.textAlign as any }}>
        这是二级标题下的内容示例。您可以看到不同级别标题的字体大小和颜色配置效果。
      </div>

      <div style={{ fontSize: formatConfig.fontSize.heading3, fontWeight: 'bold', marginBottom: 10 }}>
        1.1.1 具体要求
      </div>

      <div style={{ fontSize: formatConfig.fontSize.body, marginBottom: formatConfig.paragraphSpacing }}>
        这是三级标题下的内容示例。
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20, fontSize: formatConfig.fontSize.body }}>
        <thead>
          <tr style={{ backgroundColor: formatConfig.tableStyle.headerBackground }}>
            <th style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>项目</th>
            <th style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>规格</th>
            <th style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>数量</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>扫描设备</td>
            <td style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>A3高速扫描仪</td>
            <td style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>2台</td>
          </tr>
          <tr style={{ backgroundColor: formatConfig.tableStyle.alternateRowColor }}>
            <td style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>存储设备</td>
            <td style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>企业级存储</td>
            <td style={{ border: `1px solid ${formatConfig.tableStyle.borderColor}`, padding: 8 }}>1套</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

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
      {/* 页面顶部导航 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>流程导航</Text>
          <Space>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回流程</Button>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/content-generation`)}>上一步</Button>
            <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/step/document-export`)} disabled={!configSaved}>
              下一步
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={24}>
        <Col span={8}>
          <Card title="格式配置" extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleResetConfig}>
                重置
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveConfig}>
                保存
              </Button>
            </Space>
          }>
            <Form form={form} layout="vertical" initialValues={formatConfig}>
              <Tabs
                size="small"
                items={[
                  {
                    key: 'page',
                    label: '页面设置',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item label="页面大小" name="pageSize">
                          <Select>
                            <Option value="A4">A4 (210×297mm)</Option>
                            <Option value="A3">A3 (297×420mm)</Option>
                            <Option value="Letter">Letter (216×279mm)</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item label="页面方向" name="pageOrientation">
                          <Select>
                            <Option value="portrait">纵向</Option>
                            <Option value="landscape">横向</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item label="页边距 (mm)">
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item name={['pageMargin', 'top']} label="上">
                                <Slider min={10} max={50} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name={['pageMargin', 'bottom']} label="下">
                                <Slider min={10} max={50} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name={['pageMargin', 'left']} label="左">
                                <Slider min={10} max={50} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name={['pageMargin', 'right']} label="右">
                                <Slider min={10} max={50} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form.Item>
                      </Space>
                    ),
                  },
                  {
                    key: 'font',
                    label: '字体设置',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item label="字体" name="fontFamily">
                          <Select>
                            <Option value="SimSun">宋体</Option>
                            <Option value="SimHei">黑体</Option>
                            <Option value="KaiTi">楷体</Option>
                            <Option value="FangSong">仿宋</Option>
                            <Option value="Microsoft YaHei">微软雅黑</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item label="标题字号" name={['fontSize', 'title']}>
                          <Slider min={16} max={32} />
                        </Form.Item>

                        <Form.Item label="一级标题" name={['fontSize', 'heading1']}>
                          <Slider min={14} max={24} />
                        </Form.Item>

                        <Form.Item label="二级标题" name={['fontSize', 'heading2']}>
                          <Slider min={12} max={20} />
                        </Form.Item>

                        <Form.Item label="正文字号" name={['fontSize', 'body']}>
                          <Slider min={10} max={16} />
                        </Form.Item>
                      </Space>
                    ),
                  },
                  {
                    key: 'color',
                    label: '颜色设置',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item label="主色调" name={['colors', 'primary']}>
                          <ColorPicker showText />
                        </Form.Item>

                        <Form.Item label="辅助色" name={['colors', 'secondary']}>
                          <ColorPicker showText />
                        </Form.Item>

                        <Form.Item label="文字颜色" name={['colors', 'text']}>
                          <ColorPicker showText />
                        </Form.Item>

                        <Form.Item label="背景颜色" name={['colors', 'background']}>
                          <ColorPicker showText />
                        </Form.Item>
                      </Space>
                    ),
                  },
                  {
                    key: 'paragraph',
                    label: '段落设置',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item label="行距" name="lineHeight">
                          <Slider min={1} max={3} step={0.1} />
                        </Form.Item>

                        <Form.Item label="段落间距" name="paragraphSpacing">
                          <Slider min={0} max={20} />
                        </Form.Item>

                        <Form.Item label="文字对齐" name="textAlign">
                          <Select>
                            <Option value="left">左对齐</Option>
                            <Option value="center">居中</Option>
                            <Option value="right">右对齐</Option>
                            <Option value="justify">两端对齐</Option>
                          </Select>
                        </Form.Item>
                      </Space>
                    ),
                  },
                ]}
              />
            </Form>
          </Card>
        </Col>

        <Col span={16}>
          <Card
            title="实时预览"
            extra={
              <Button
                icon={<EyeOutlined />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? '退出预览' : '全屏预览'}
              </Button>
            }
          >
            <div style={{
              height: 600,
              overflow: 'auto',
              background: '#f0f0f0',
              padding: 20,
              transform: previewMode ? 'scale(1)' : 'scale(0.7)',
              transformOrigin: 'top left',
            }}>
              {renderPreview()}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="format-config"
        canProceed={configSaved}
      />
    </div>
  );
};

export default FormatConfigPage;
