import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Upload,
  Button,
  Space,
  Typography,
  Steps,
  Alert,
  DatePicker,
  Select,
  message,
  Row,
  Col,
  Progress,
  Divider,
  Tag,
  Tooltip,
  App,
  Modal,
  Descriptions,
} from 'antd';
import {
  InboxOutlined,
  ProjectOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  SettingOutlined,
  RocketOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '../../store';
import { createProjectWithFile } from '../../store/slices/projectSlice';
import { projectAPI } from '../../services/projectAPI';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;
const { Option } = Select;

const BidProjectCreate: React.FC = () => {
  console.log('🎯 [DEBUG] BidProjectCreate 组件加载');

  // 使用 App.useApp() 获取 message 实例
  const { message: messageApi } = App.useApp();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [bidFile, setBidFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // 文件验证状态
  const [fileValidation, setFileValidation] = useState<{
    status: 'none' | 'validating' | 'success' | 'error';
    message?: string;
    data?: any;
  }>({ status: 'none' });

  // 项目名称预览
  const [projectNamePreview, setProjectNamePreview] = useState<string>('');

  // 是否跳过验证
  const [skipValidation, setSkipValidation] = useState<boolean>(false);

  // 悬浮窗口状态
  const [fileInfoModalVisible, setFileInfoModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalContent, setStatusModalContent] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    content: string;
  }>({ type: 'info', title: '', content: '' });

  // 动态计算步骤状态
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex === 0) {
      // 第一步：文件上传和验证
      if (currentStep > 0) return 'finish';
      if (currentStep === 0) {
        if (!bidFile) return 'process';
        if (fileValidation.status === 'validating') return 'process';
        if (fileValidation.status === 'success') return 'finish';
        if (fileValidation.status === 'error') return 'error';
        return 'process';
      }
      return 'wait';
    }
    return currentStep > stepIndex ? 'finish' : currentStep === stepIndex ? 'process' : 'wait';
  };

  const steps = [
    {
      title: '上传文件',
      icon: <UploadOutlined />,
      description: bidFile
        ? (fileValidation.status === 'validating' ? 'AI正在验证文件...'
           : fileValidation.status === 'success' ? '文件验证通过'
           : fileValidation.status === 'error' ? '验证失败，请重试'
           : '上传招标文件')
        : '上传招标文件',
      status: getStepStatus(0) as 'finish' | 'process' | 'wait' | 'error',
    },
    {
      title: '项目配置',
      icon: <SettingOutlined />,
      description: '配置项目信息',
      status: getStepStatus(1) as 'finish' | 'process' | 'wait',
    },
    {
      title: '开始制作',
      icon: <RocketOutlined />,
      description: '创建项目',
      status: getStepStatus(2) as 'finish' | 'process' | 'wait',
    },
  ];

  // 计算总体进度
  const overallProgress = Math.round((currentStep / (steps.length - 1)) * 100);

  // 生成项目名称预览（模拟后端逻辑）
  const generateProjectNamePreview = (filename: string): string => {
    // 移除文件扩展名
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    // 替换特殊字符为下划线，保留中文字符、英文字母、数字
    const sanitized = nameWithoutExt.replace(/[^\w\u4e00-\u9fff]/g, '_')
                                   .replace(/_+/g, '_')
                                   .replace(/^_|_$/g, '') || 'project';
    // 生成时间戳
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') + '_' +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0');
    return `${sanitized}_${timestamp}`;
  };

  // 处理文件上传和验证
  const handleFileUpload = async (file: File) => {
    console.log('🎯 [DEBUG] 文件上传:', file.name);
    setBidFile(file);

    // 弹窗显示文件上传成功
    messageApi.success({
      content: `📁 文件上传成功：${file.name}`,
      duration: 2
    });

    // 显示状态悬浮窗口
    setStatusModalContent({
      type: 'success',
      title: '文件上传成功',
      content: `已选择文件：${file.name}\n文件大小：${(file.size / 1024 / 1024).toFixed(2)} MB\n上传时间：${new Date().toLocaleString()}`
    });
    setStatusModalVisible(true);

    // 生成项目名称预览
    const predictedName = generateProjectNamePreview(file.name);
    setProjectNamePreview(predictedName);
    console.log('🎯 [DEBUG] 预计生成项目名称:', predictedName);

    // 立即验证文件
    setFileValidation({ status: 'validating' });
    console.log('🔍 [DEBUG] 开始验证文件...');

    // 弹窗显示开始验证
    messageApi.info({
      content: '🔍 正在使用AI验证文件，请稍候...',
      duration: 3
    });

    // 显示验证状态悬浮窗口
    setStatusModalContent({
      type: 'info',
      title: '正在验证文件...',
      content: 'AI正在分析文件内容，请稍候...\n这可能需要几秒钟时间'
    });
    setStatusModalVisible(true);

    try {
      const result = await projectAPI.validateBidFile(file);
      console.log('🔍 [DEBUG] 文件验证结果:', result);
      console.log('🔍 [DEBUG] result.success:', result.success);
      console.log('🔍 [DEBUG] result.data:', result.data);
      console.log('🔍 [DEBUG] result.message:', result.message);

      if (result.success && result.data) {
        const validationData = result.data;
        const isValid = validationData.is_valid_bid_file;
        const confidence = validationData.confidence_score || 0;

        // 从LLM分析中获取更详细的信息
        const llmAnalysis = validationData.llm_analysis || {};
        const fileType = llmAnalysis.file_type || validationData.file_type || '招标文件';
        const llmConfidence = llmAnalysis.confidence_score || confidence;

        // 只要success为true就通过验证
        if (result.success) {
          setFileValidation({
            status: 'success',
            message: `文件验证通过！确认为${fileType}（置信度：${llmConfidence}%）`,
            data: validationData
          });
          console.log('✅ [DEBUG] 文件验证成功');

          // 弹窗显示验证成功信息
          messageApi.success({
            content: `🎉 文件验证通过！确认为${fileType}（置信度：${llmConfidence}%）`,
            duration: 4
          });

          // 关闭验证中的悬浮窗口，显示验证详情悬浮窗口
          setStatusModalVisible(false);
          setTimeout(() => {
            setValidationModalVisible(true);
          }, 500);
        } else {
          const summary = llmAnalysis.analysis_summary || validationData.analysis_summary || '可能不是标准招标文件';
          setFileValidation({
            status: 'error',
            message: `文件验证失败：${summary}（置信度：${llmConfidence}%）`,
            data: validationData
          });
          console.log('❌ [DEBUG] 文件验证失败，置信度过低');

          // 关闭验证中的悬浮窗口，显示错误状态悬浮窗口
          setStatusModalVisible(false);
          setTimeout(() => {
            setStatusModalContent({
              type: 'error',
              title: '文件验证失败',
              content: `${summary}\n置信度：${llmConfidence}%\n建议：请确认文件是标准的招标文件`
            });
            setStatusModalVisible(true);
          }, 500);
        }
      } else {
        setFileValidation({
          status: 'error',
          message: result.message || '文件验证失败，请检查文件格式'
        });
        console.log('❌ [DEBUG] 文件验证API调用失败');

        // 关闭验证中的悬浮窗口，显示错误状态悬浮窗口
        setStatusModalVisible(false);
        setTimeout(() => {
          setStatusModalContent({
            type: 'error',
            title: '文件验证失败',
            content: `${result.message || '文件验证失败，请检查文件格式'}\n建议：请确认文件格式正确且网络连接正常`
          });
          setStatusModalVisible(true);
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] 文件验证异常:', error);

      // 根据错误类型提供更友好的提示
      let errorMessage = '文件验证失败';
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = '网络连接失败，请检查网络连接后重试';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '验证超时，文件可能过大，请稍后重试';
      } else if (error.response?.status === 413) {
        errorMessage = '文件过大，请选择小于50MB的文件';
      } else if (error.response?.status === 415) {
        errorMessage = '文件格式不支持，请上传PDF或DOCX格式的文件';
      } else {
        errorMessage = '文件验证失败，可能是文件格式问题或服务暂时不可用';
      }

      setFileValidation({
        status: 'error',
        message: errorMessage
      });

      // 关闭验证中的悬浮窗口，显示错误状态悬浮窗口
      setStatusModalVisible(false);
      setTimeout(() => {
        setStatusModalContent({
          type: 'error',
          title: '文件验证异常',
          content: `${errorMessage}\n请检查文件格式和网络连接后重试`
        });
        setStatusModalVisible(true);
      }, 500);
    }
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        if (!bidFile) {
          messageApi.error('请先上传招标文件');
          return;
        }
        if (fileValidation.status !== 'success' && !skipValidation) {
          messageApi.error('请等待文件验证完成或重新上传有效的招标文件');
          return;
        }
        // 文件验证通过，进入项目配置
        setCurrentStep(1);

        // 自动填写表单数据
        setTimeout(() => {
          const formData: any = {};

          // 自动填写项目名称（如果用户没有手动输入）
          if (projectNamePreview && !form.getFieldValue('projectName')) {
            formData.projectName = projectNamePreview;
          }

          // 自动填写投标截止时间 - 支持多种数据结构
          const timeInfo = fileValidation.data?.llm_analysis?.time_info || fileValidation.data?.time_info;
          if (timeInfo?.bid_deadline) {
            try {
              const deadline = dayjs(timeInfo.bid_deadline);
              if (deadline.isValid()) {
                formData.bidDeadline = deadline;
              }
            } catch (error) {
              console.log('解析截止时间失败:', error);
            }
          }

          // 自动填写项目描述 - 支持多种数据结构
          const description = fileValidation.data?.llm_analysis?.analysis_summary ||
                             fileValidation.data?.analysis_summary ||
                             fileValidation.data?.llm_analysis?.project_description;
          if (description) {
            formData.projectDescription = description;
          }

          // 批量设置表单值
          if (Object.keys(formData).length > 0) {
            form.setFieldsValue(formData);
            console.log('🎯 [DEBUG] 自动填写表单数据:', formData);
            console.log('🎯 [DEBUG] fileValidation.data:', fileValidation.data);
          }
        }, 100); // 延迟一点确保表单已渲染
      } else if (currentStep === 1) {
        // 只验证手机号，项目名称为可选
        await form.validateFields(['userPhone']);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    console.log('🚀 [DEBUG] handleCreate 被调用');
    console.log('🚀 [DEBUG] bidFile:', bidFile);

    if (!bidFile) {
      console.log('❌ [DEBUG] 没有选择文件');
      messageApi.error('请上传招标文件');
      return;
    }

    setCreating(true);
    try {
      const values = await form.validateFields();
      console.log('🚀 [DEBUG] 表单验证通过，values:', values);

      // 调用真实的项目创建API
      console.log('🚀 [DEBUG] 开始调用 createProjectWithFile API');
      const apiData = {
        bidFile: bidFile,
        projectName: values.projectName?.trim() || '', // 空字符串让后端自动生成
        userPhone: values.userPhone || '13800000000',
      };
      console.log('🚀 [DEBUG] API 参数:', apiData);
      console.log('🚀 [DEBUG] 项目名称处理:', {
        用户输入: values.projectName,
        处理后: apiData.projectName,
        是否为空: apiData.projectName === '',
        预期生成: projectNamePreview
      });

      const result = await dispatch(createProjectWithFile(apiData)).unwrap();
      console.log('✅ [DEBUG] API 调用成功，结果:', result);

      messageApi.success('投标项目创建成功！正在跳转到服务模式选择...');

      // 跳转到第一步：服务模式选择
      if (result && result.id) {
        navigate(`/projects/${result.id}/step/service-mode`);
      } else {
        // 如果没有返回项目ID，则跳转到项目列表
        navigate('/projects');
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] 项目创建失败:', error);
      console.error('❌ [DEBUG] 错误详情:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      messageApi.error(error.message || '项目创建失败，请检查网络连接或联系管理员');
    } finally {
      setCreating(false);
      console.log('🚀 [DEBUG] handleCreate 完成');
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx,.doc',
    beforeUpload: (file: File) => {
      const isValidType = file.type === 'application/pdf' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.type === 'application/msword';

      if (!isValidType) {
        messageApi.error('只支持PDF和DOCX格式的文件！');
        return false;
      }

      const isValidSize = file.size / 1024 / 1024 < 50;
      if (!isValidSize) {
        messageApi.error('文件大小不能超过50MB！');
        return false;
      }

      // 调用文件上传和验证处理
      handleFileUpload(file);
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setBidFile(null);
      setFileValidation({ status: 'none' });
      setProjectNamePreview('');
    },
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </div>
              <Title level={3} style={{ marginBottom: 16 }}>
                上传招标文件
              </Title>
              <Text type="secondary" style={{ fontSize: 16, marginBottom: 32, display: 'block' }}>
                请上传招标文件，支持PDF、DOCX格式，文件大小不超过50MB
              </Text>

              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <Dragger {...uploadProps} style={{ padding: '40px 20px' }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: 18, marginBottom: 8 }}>
                    拖拽文件到此处或点击上传
                  </p>
                  <p className="ant-upload-hint" style={{ fontSize: 14, color: '#999' }}>
                    支持格式：PDF、DOCX | 最大大小：50MB
                  </p>
                </Dragger>

                {bidFile && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f6f8fa',
                      borderRadius: '8px',
                      border: '1px dashed #d0d7de'
                    }}>
                      <div style={{ fontSize: '16px', marginBottom: '12px', color: '#24292f' }}>
                        📁 已选择文件：{bidFile.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#656d76', marginBottom: '16px' }}>
                        文件大小：{(bidFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => setFileInfoModalVisible(true)}
                        >
                          查看文件详情
                        </Button>
                        {fileValidation.status === 'success' && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => setValidationModalVisible(true)}
                          >
                            查看验证详情
                          </Button>
                        )}
                        {fileValidation.status === 'validating' && (
                          <Button
                            size="small"
                            loading
                            disabled
                          >
                            AI验证中...
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <div style={{ padding: '20px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <SettingOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={3} style={{ marginBottom: 8 }}>
                  配置项目信息
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  根据分析结果，完善项目配置信息
                </Text>
              </div>

              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* AI分析结果显示 */}
                {fileValidation.status === 'success' && fileValidation.data && (
                  <Card
                    title={
                      <span>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        AI分析结果
                      </span>
                    }
                    style={{ marginBottom: 24 }}
                    size="small"
                  >
                    <Row gutter={[16, 8]}>
                      <Col span={8}>
                        <Text strong>文件类型：</Text>
                        <Tag color="blue">{fileValidation.data.file_type || '招标文件'}</Tag>
                      </Col>
                      <Col span={8}>
                        <Text strong>置信度：</Text>
                        <Tag color="green">{fileValidation.data.confidence_score || 0}%</Tag>
                      </Col>
                      <Col span={8}>
                        <Text strong>预计项目名：</Text>
                        <Text code>{projectNamePreview}</Text>
                      </Col>
                    </Row>
                    {fileValidation.data.time_info && fileValidation.data.time_info.bid_deadline && (
                      <div style={{ marginTop: 8 }}>
                        <Text strong>检测到截止时间：</Text>
                        <Text mark>{fileValidation.data.time_info.bid_deadline}</Text>
                      </div>
                    )}
                  </Card>
                )}

                <Form form={form} layout="vertical" initialValues={{ userPhone: '13800000000' }}>
                  <Row gutter={[24, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="projectName"
                        label={
                          <span>
                            项目名称
                            <Tooltip title="留空则自动从文件名生成项目名称">
                              <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                            </Tooltip>
                          </span>
                        }
                        rules={[]} // 移除必填验证
                      >
                        <Input
                          placeholder={projectNamePreview ? `留空将生成：${projectNamePreview}` : "留空则自动从文件名生成"}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="userPhone"
                        label="联系电话"
                        rules={[
                          { required: true, message: '请输入联系电话' },
                          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                        ]}
                      >
                        <Input placeholder="请输入联系电话" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="bidDeadline"
                        label={
                          <span>
                            投标截止时间
                            <Tooltip title="AI分析可能已自动提取，如未提取请手动选择">
                              <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                            </Tooltip>
                          </span>
                        }
                        rules={[]} // 改为可选
                      >
                        <DatePicker
                          showTime
                          style={{ width: '100%' }}
                          size="large"
                          placeholder="AI分析中或手动选择截止时间"
                          disabledDate={(current) => current && current < dayjs().endOf('day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="serviceMode"
                        label="服务模式"
                        initialValue="ai_intelligent"
                      >
                        <Select placeholder="请选择服务模式" size="large">
                          <Option value="ai_intelligent">
                            <Space>
                              <RocketOutlined style={{ color: '#1890ff' }} />
                              AI智能模式（推荐）
                            </Space>
                          </Option>
                          <Option value="manual">
                            <Space>
                              <UserOutlined />
                              人工模式
                            </Space>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="projectDescription"
                    label="项目描述"
                  >
                    <TextArea
                      rows={4}
                      placeholder="请简要描述项目内容和要求（可选）"
                      size="large"
                    />
                  </Form.Item>
                </Form>
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <RocketOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </div>
              <Title level={3} style={{ marginBottom: 16, color: '#52c41a' }}>
                准备就绪，开始制作！
              </Title>
              <Text type="secondary" style={{ fontSize: 16, marginBottom: 32, display: 'block' }}>
                所有信息已配置完成，点击下方按钮创建项目并开始智能制作
              </Text>

              <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'left' }}>
                <Card size="small" title="项目信息确认">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row>
                      <Col span={6}><Text strong>项目名称：</Text></Col>
                      <Col span={18}><Text>{form.getFieldValue('projectName') || '未设置'}</Text></Col>
                    </Row>
                    <Row>
                      <Col span={6}><Text strong>招标文件：</Text></Col>
                      <Col span={18}><Text>{bidFile?.name || '未上传'}</Text></Col>
                    </Row>
                    <Row>
                      <Col span={6}><Text strong>联系电话：</Text></Col>
                      <Col span={18}><Text>{form.getFieldValue('userPhone') || '未设置'}</Text></Col>
                    </Row>
                    <Row>
                      <Col span={6}><Text strong>截止时间：</Text></Col>
                      <Col span={18}>
                        <Text>
                          {form.getFieldValue('bidDeadline')?.format('YYYY-MM-DD HH:mm') || '未设置'}
                        </Text>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={6}><Text strong>服务模式：</Text></Col>
                      <Col span={18}>
                        <Tag color="blue">
                          {form.getFieldValue('serviceMode') === 'ai_intelligent' ? 'AI智能模式' : '人工模式'}
                        </Tag>
                      </Col>
                    </Row>
                  </Space>
                </Card>

                <Alert
                  message="温馨提示"
                  description="创建项目后，系统将自动进入制作工作台，您可以实时查看制作进度和结果。"
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* 总体进度 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>总体进度</Text>
            <Text>{overallProgress}%</Text>
          </div>
          <Progress
            percent={overallProgress}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
        <Steps current={currentStep} items={steps} />
      </Card>

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 操作按钮 */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {currentStep > 0 && (
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={handlePrev}
              >
                上一步
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              size="large"
              onClick={() => navigate('/projects')}
            >
              取消
            </Button>

            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
              >
                下一步
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                loading={creating}
                onClick={handleCreate}
              >
                创建项目并开始制作
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 状态悬浮窗口 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {statusModalContent.type === 'success' && <span style={{ color: '#52c41a' }}>✅</span>}
            {statusModalContent.type === 'info' && <span style={{ color: '#1890ff' }}>ℹ️</span>}
            {statusModalContent.type === 'error' && <span style={{ color: '#ff4d4f' }}>❌</span>}
            {statusModalContent.title}
          </div>
        }
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={[
          // 验证成功时显示"下一步"按钮，否则显示"关闭"按钮
          fileValidation.status === 'success' ? (
            <Button
              key="next"
              type="primary"
              onClick={() => {
                setStatusModalVisible(false);
                handleNext(); // 直接进入下一步
              }}
            >
              下一步
            </Button>
          ) : (
            <Button key="close" onClick={() => setStatusModalVisible(false)}>
              关闭
            </Button>
          ),
          // 验证成功时显示"查看详情"按钮
          fileValidation.status === 'success' && (
            <Button
              key="details"
              onClick={() => {
                setStatusModalVisible(false);
                setValidationModalVisible(true);
              }}
            >
              查看详情
            </Button>
          )
        ].filter(Boolean)}
        width={500}
      >
        <div style={{
          padding: '16px 0',
          fontSize: '14px',
          lineHeight: '1.6',
          whiteSpace: 'pre-line'
        }}>
          {statusModalContent.content}
        </div>
      </Modal>

      {/* 文件信息悬浮窗口 */}
      <Modal
        title="📁 文件信息"
        open={fileInfoModalVisible}
        onCancel={() => setFileInfoModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFileInfoModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {bidFile && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="文件名">{bidFile.name}</Descriptions.Item>
            <Descriptions.Item label="文件大小">
              {(bidFile.size / 1024 / 1024).toFixed(2)} MB
            </Descriptions.Item>
            <Descriptions.Item label="文件类型">{bidFile.type}</Descriptions.Item>
            <Descriptions.Item label="上传时间">
              {new Date().toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="预计项目名称">
              {projectNamePreview || '未生成'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 验证详情悬浮窗口 */}
      <Modal
        title={fileValidation.status === 'success' ? "🔍 AI验证详情" : "❌ 验证失败详情"}
        open={validationModalVisible}
        onCancel={() => setValidationModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setValidationModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {(fileValidation.data || fileValidation.status !== 'none') && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="文件类型">
                {fileValidation.data?.llm_analysis?.file_type || bidFile?.name.split('.').pop()?.toUpperCase() || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                {fileValidation.data?.confidence_score || fileValidation.data?.llm_analysis?.confidence_score || '0'}%
              </Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {fileValidation.data?.file_size ?
                  (fileValidation.data.file_size / 1024 / 1024).toFixed(2) :
                  bidFile ? (bidFile.size / 1024 / 1024).toFixed(2) : '未知'
                } MB
              </Descriptions.Item>
              <Descriptions.Item label="验证状态">
                <Tag color={fileValidation.status === 'success' ? 'green' : 'red'}>
                  {fileValidation.status === 'success' ? '验证通过' : '验证失败'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* 验证消息 */}
            {fileValidation.message && (
              <div style={{ marginBottom: 16 }}>
                <h4>{fileValidation.status === 'success' ? '✅ 验证结果' : '❌ 验证失败原因'}</h4>
                <div style={{
                  padding: 12,
                  backgroundColor: fileValidation.status === 'success' ? '#f6ffed' : '#fff2f0',
                  borderRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.6,
                  border: `1px solid ${fileValidation.status === 'success' ? '#b7eb8f' : '#ffccc7'}`
                }}>
                  {fileValidation.message}
                </div>
              </div>
            )}

            {fileValidation.data?.llm_analysis?.analysis_summary && (
              <div style={{ marginBottom: 16 }}>
                <h4>🔍 AI分析摘要</h4>
                <div style={{
                  padding: 12,
                  backgroundColor: '#f6f8fa',
                  borderRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.6
                }}>
                  {fileValidation.data.llm_analysis.analysis_summary}
                </div>
              </div>
            )}

            {fileValidation.data?.llm_analysis?.key_findings && fileValidation.data.llm_analysis.key_findings.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4>✨ 关键发现</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {fileValidation.data.llm_analysis.key_findings.map((finding: string, index: number) => (
                    <li key={index} style={{ marginBottom: 4 }}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {fileValidation.data?.llm_analysis?.time_info && (
              <div style={{ marginBottom: 16 }}>
                <h4>⏰ 时间信息</h4>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="投标截止时间">
                    {fileValidation.data.llm_analysis.time_info.bid_deadline || '未明确'}
                  </Descriptions.Item>
                  <Descriptions.Item label="开标时间">
                    {fileValidation.data.llm_analysis.time_info.opening_time || '未明确'}
                  </Descriptions.Item>
                  <Descriptions.Item label="文件领取时间">
                    {fileValidation.data.llm_analysis.time_info.collection_time || '未明确'}
                  </Descriptions.Item>
                  <Descriptions.Item label="时间状态">
                    <Tag color={fileValidation.data.llm_analysis.time_info.is_within_deadline ? 'green' : 'red'}>
                      {fileValidation.data.llm_analysis.time_info.time_status || '未知'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {fileValidation.data?.llm_analysis?.document_structure && (
              <div>
                <h4>📋 文档结构</h4>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="招标公告">
                    <Tag color={fileValidation.data.llm_analysis.document_structure.has_bid_notice ? 'green' : 'red'}>
                      {fileValidation.data.llm_analysis.document_structure.has_bid_notice ? '包含' : '不包含'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="技术要求">
                    <Tag color={fileValidation.data.llm_analysis.document_structure.has_technical_requirements ? 'green' : 'red'}>
                      {fileValidation.data.llm_analysis.document_structure.has_technical_requirements ? '包含' : '不包含'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="商务要求">
                    <Tag color={fileValidation.data.llm_analysis.document_structure.has_commercial_requirements ? 'green' : 'red'}>
                      {fileValidation.data.llm_analysis.document_structure.has_commercial_requirements ? '包含' : '不包含'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="评审标准">
                    <Tag color={fileValidation.data.llm_analysis.document_structure.has_evaluation_criteria ? 'green' : 'red'}>
                      {fileValidation.data.llm_analysis.document_structure.has_evaluation_criteria ? '包含' : '不包含'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="章节总数">
                    {fileValidation.data.llm_analysis.document_structure.total_chapters || '未识别'}
                  </Descriptions.Item>
                </Descriptions>

                {fileValidation.data.llm_analysis.document_structure.key_chapters && (
                  <div style={{ marginTop: 12 }}>
                    <strong>主要章节：</strong>
                    <div style={{ marginTop: 8 }}>
                      {fileValidation.data.llm_analysis.document_structure.key_chapters.map((chapter: string, index: number) => (
                        <Tag key={index} style={{ marginBottom: 4 }}>{chapter}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BidProjectCreate;
