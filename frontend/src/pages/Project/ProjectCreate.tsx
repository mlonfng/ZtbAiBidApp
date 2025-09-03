import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Space,
  Steps,
  Typography,
  Alert,
  Row,
  Col,
  Divider,
  Select,
  App,
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  FileTextOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

import { useAppDispatch } from '../../store';
import { createProjectWithFile } from '../../store/slices/projectSlice';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProjectFormData {
  name: string;
  description: string;
  userPhone: string;
  bidFile: UploadFile | null;
}

const ProjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    userPhone: '13800000000',
    bidFile: null,
  });

  const steps = [
    {
      title: '上传招标文件',
      icon: <UploadOutlined />,
      description: '选择招标文件并上传',
    },
    {
      title: '项目信息',
      icon: <ProjectOutlined />,
      description: '填写项目基本信息',
    },
    {
      title: '确认创建',
      icon: <CheckCircleOutlined />,
      description: '确认信息并创建项目',
    },
  ];

  const uploadProps: UploadProps = {
    name: 'bidFile',
    accept: '.pdf,.docx,.txt',
    maxCount: 1,
    beforeUpload: (file) => {
      const isValidType = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type);
      if (!isValidType) {
        message.error('只支持 PDF、DOCX 或 TXT 格式的文件！');
        return false;
      }
      
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('文件大小不能超过 50MB！');
        return false;
      }

      // 自动生成项目名称
      const fileName = file.name;
      const projectName = fileName.replace(/\.(pdf|docx|txt)$/i, '');
      
      setFormData(prev => ({
        ...prev,
        name: projectName,
        bidFile: file,
      }));
      
      form.setFieldsValue({ name: projectName });
      
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setFormData(prev => ({
        ...prev,
        bidFile: null,
      }));
    },
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // 验证文件上传
      if (!formData.bidFile) {
        message.error('请先上传招标文件');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // 验证表单
      try {
        const values = await form.validateFields();
        setFormData(prev => ({
          ...prev,
          ...values,
        }));
        setCurrentStep(2);
      } catch (error) {
        message.error('请完善项目信息');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.bidFile) {
      message.error('请上传招标文件');
      return;
    }

    setLoading(true);
    
    try {
      const result = await dispatch(createProjectWithFile({
        bidFile: formData.bidFile as any,
        projectName: formData.name,
        userPhone: formData.userPhone,
      })).unwrap();

      message.success('项目创建成功！正在跳转到服务模式选择...');
      // 跳转到第一步：服务模式选择
      if (result && result.id) {
        navigate(`/projects/${result.id}/step/service-mode`);
      } else {
        navigate('/projects');
      }
    } catch (error: any) {
      message.error(error.message || '项目创建失败');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
            <Title level={3}>上传招标文件</Title>
            <Paragraph type="secondary" style={{ marginBottom: 32 }}>
              支持 PDF、DOCX、TXT 格式，文件大小不超过 50MB
            </Paragraph>
            
            <Upload.Dragger {...uploadProps} style={{ maxWidth: 400, margin: '0 auto' }}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                系统将自动解析招标文件内容并生成项目结构
              </p>
            </Upload.Dragger>

            {formData.bidFile && (
              <Alert
                message="文件上传成功"
                description={`已选择文件：${formData.bidFile?.name || '未知文件'}`}
                type="success"
                showIcon
                style={{ marginTop: 24, maxWidth: 400, margin: '24px auto 0' }}
              />
            )}
          </div>
        );

      case 1:
        return (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
              项目信息
            </Title>
            
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: formData.name,
                description: formData.description,
                userPhone: formData.userPhone,
              }}
            >
              <Form.Item
                label="项目名称"
                name="name"
                rules={[
                  { required: true, message: '请输入项目名称' },
                  { min: 2, message: '项目名称至少2个字符' },
                  { max: 100, message: '项目名称不能超过100个字符' },
                ]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>

              <Form.Item
                label="项目描述"
                name="description"
                rules={[
                  { max: 500, message: '项目描述不能超过500个字符' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入项目描述（可选）"
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                label="联系手机"
                name="userPhone"
                rules={[
                  { required: true, message: '请输入联系手机' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                ]}
              >
                <Input placeholder="请输入联系手机" />
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
        return (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
              确认项目信息
            </Title>
            
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong>招标文件：</Text>
                  <Text>{formData.bidFile?.name}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>项目名称：</Text>
                  <Text>{formData.name}</Text>
                </Col>
                {formData.description && (
                  <Col span={24}>
                    <Text strong>项目描述：</Text>
                    <Text>{formData.description}</Text>
                  </Col>
                )}
                <Col span={24}>
                  <Text strong>联系手机：</Text>
                  <Text>{formData.userPhone}</Text>
                </Col>
              </Row>
            </Card>

            <Alert
              message="创建说明"
              description="系统将自动解析招标文件，生成项目结构和初始内容。创建过程可能需要几分钟时间，请耐心等待。"
              type="info"
              showIcon
              style={{ marginTop: 24 }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
            style={{ marginBottom: 16 }}
          >
            返回项目列表
          </Button>
        </div>

        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 40 }}
        />

        {renderStepContent()}

        <Divider />

        <div style={{ textAlign: 'center' }}>
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
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
              >
                创建项目
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectCreate;
