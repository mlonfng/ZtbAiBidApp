import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Upload, 
  Button, 
  Space, 
  Typography, 
  Steps,
  Card,
  Row,
  Col,
  message,
  Checkbox,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  SettingOutlined,
  CheckOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface TemplateEditorProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (template: any) => void;
  template?: any;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  visible,
  onCancel,
  onSave,
  template,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

  const steps = [
    {
      title: '基本信息',
      icon: <FileTextOutlined />,
    },
    {
      title: '文件上传',
      icon: <UploadOutlined />,
    },
    {
      title: '预览设置',
      icon: <PictureOutlined />,
    },
    {
      title: '发布设置',
      icon: <SettingOutlined />,
    },
  ];

  // 文件上传配置
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
      if (info.file.status === 'uploading') {
        setUploading(true);
      } else if (info.file.status === 'done') {
        setUploading(false);
        message.success(`${info.file.name} 上传成功`);
        form.setFieldsValue({ file: info.file });
      } else if (info.file.status === 'error') {
        setUploading(false);
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  // 缩略图上传配置
  const thumbnailUploadProps: UploadProps = {
    name: 'thumbnail',
    listType: 'picture-card',
    accept: 'image/*',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB！');
        return false;
      }
      
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        // 模拟获取图片URL
        const url = URL.createObjectURL(info.file.originFileObj as File);
        setThumbnailUrl(url);
        form.setFieldsValue({ thumbnail: url });
      }
    },
  };

  // 下一步
  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave({
        ...values,
        id: template?.id || `template_${Date.now()}`,
        createTime: template?.createTime || new Date(),
        updateTime: new Date(),
      });
      
      // 重置表单和步骤
      form.resetFields();
      setCurrentStep(0);
      setThumbnailUrl('');
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 取消
  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setThumbnailUrl('');
    onCancel();
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Form.Item
              name="title"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="请输入模板名称" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="模板描述"
              rules={[{ required: true, message: '请输入模板描述' }]}
            >
              <TextArea rows={4} placeholder="请输入模板描述" />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="模板分类"
              rules={[{ required: true, message: '请选择模板分类' }]}
            >
              <Select placeholder="请选择模板分类">
                <Option value="商务投标">商务投标</Option>
                <Option value="技术方案">技术方案</Option>
                <Option value="工程建设">工程建设</Option>
                <Option value="服务采购">服务采购</Option>
                <Option value="产品销售">产品销售</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="tags"
              label="模板标签"
            >
              <Select mode="tags" placeholder="请输入标签，按回车添加">
                <Option value="标准模板">标准模板</Option>
                <Option value="精品推荐">精品推荐</Option>
                <Option value="热门">热门</Option>
                <Option value="专业">专业</Option>
                <Option value="实用">实用</Option>
              </Select>
            </Form.Item>
          </div>
        );
        
      case 1:
        return (
          <div>
            <Form.Item
              name="file"
              label="模板文件"
              rules={[{ required: true, message: '请上传模板文件' }]}
            >
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
            </Form.Item>
          </div>
        );
        
      case 2:
        return (
          <div>
            <Form.Item
              name="thumbnail"
              label="模板缩略图"
              extra="建议尺寸：300x200像素，支持 JPG、PNG 格式"
            >
              <Upload {...thumbnailUploadProps}>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="thumbnail" style={{ width: '100%' }} />
                ) : (
                  <div>
                    <PictureOutlined style={{ fontSize: 24 }} />
                    <div style={{ marginTop: 8 }}>上传缩略图</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
            
            <Form.Item
              name="autoGenerateThumbnail"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox>自动生成缩略图（如果未上传）</Checkbox>
            </Form.Item>
          </div>
        );
        
      case 3:
        return (
          <div>
            <Form.Item
              name="status"
              label="发布状态"
              initialValue="draft"
              rules={[{ required: true, message: '请选择发布状态' }]}
            >
              <Select>
                <Option value="draft">草稿</Option>
                <Option value="private">私有</Option>
                <Option value="published">公开发布</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="allowDownload"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox>允许其他用户下载</Checkbox>
            </Form.Item>
            
            <Form.Item
              name="allowComment"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox>允许其他用户评论</Checkbox>
            </Form.Item>
            
            <Form.Item
              name="requireApproval"
              valuePropName="checked"
            >
              <Checkbox>需要管理员审核</Checkbox>
            </Form.Item>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal
      title={template ? '编辑模板' : '创建模板'}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </div>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={template}
      >
        <Card style={{ minHeight: 400 }}>
          {renderStepContent()}
        </Card>
      </Form>
      
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              上一步
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          ) : (
            <Button type="primary" onClick={handleSave} loading={uploading}>
              保存模板
            </Button>
          )}
          
          <Button onClick={handleCancel}>
            取消
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default TemplateEditor;
