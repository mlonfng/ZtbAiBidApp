import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Upload,
  Avatar,
  Row,
  Col,
  App,
  Spin,
  Alert,
  Tag,
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  UploadOutlined,
  SaveOutlined,
  RobotOutlined,
  ApiOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { configAPI, useConfigAPI, configCache, SystemConfig, AIConfig } from '../services/configAPI';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [systemForm] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [configLoading, setConfigLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [aiConfigs, setAiConfigs] = useState<Record<string, AIConfig>>({});
  const [currentProvider, setCurrentProvider] = useState<string>('deepseek');
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'testing' | 'success' | 'error' | 'idle'>>({});

  const { message } = App.useApp();
  const { loading, error, handleRequest, clearError } = useConfigAPI();

  // 加载配置数据（仅一次）
  useEffect(() => {
    console.log('🚀 Settings组件已挂载，开始加载配置...');
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 加载配置数据
  useEffect(() => {
    console.log('🚀 Settings组件已挂载，开始加载配置...');
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      console.log('🔄 开始加载配置...');
      const config = await configCache.getConfig(true);
      console.log('📋 获取到的完整配置:', config);

      // 设置系统配置
      console.log('🔧 系统配置数据:', config.system);
      setSystemConfig(config.system);
      systemForm.setFieldsValue(config.system);
      console.log('✅ 系统表单字段已设置');

      // 设置AI配置
      setAiConfigs(config.ai_models || {});
      setCurrentProvider(config.system?.current_ai_provider || 'deepseek');
      console.log('🤖 AI配置数据:', config.ai_models);
      console.log('🎯 当前AI提供商:', config.system?.current_ai_provider);

      // 设置AI表单值
      const currentAIConfig = config.ai_models?.[config.system?.current_ai_provider || 'deepseek'];
      console.log('🔍 当前AI配置:', currentAIConfig);
      if (currentAIConfig) {
        const aiFormValues = {
          aiProvider: config.system?.current_ai_provider || 'deepseek',
          [`${config.system?.current_ai_provider || 'deepseek'}ApiKey`]: currentAIConfig?.api_key,
          [`${config.system?.current_ai_provider || 'deepseek'}BaseUrl`]: currentAIConfig?.base_url,
          [`${config.system?.current_ai_provider || 'deepseek'}Model`]: currentAIConfig?.model,
          [`${config.system?.current_ai_provider || 'deepseek'}MaxTokens`]: currentAIConfig?.max_tokens,
          [`${config.system?.current_ai_provider || 'deepseek'}Temperature`]: currentAIConfig?.temperature,
        };
        console.log('📝 AI表单字段值:', aiFormValues);
        aiForm.setFieldsValue(aiFormValues);
        console.log('✅ AI表单字段已设置');
      }

    } catch (error) {
      console.error('❌ 加载配置失败:', error);
      message.error('加载配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  // 保存系统配置
  const handleSaveSystemConfig = async (values: any) => {
    await handleRequest(
      () => configAPI.updateSystemConfig(values),
      (response) => {
        setSystemConfig(response.data);
        configCache.clearCache();
        message.success('系统配置保存成功');
      },
      (error) => message.error(`保存失败: ${error}`)
    );
  };

  // 保存AI配置
  const handleSaveAIConfig = async (values: any) => {
    const provider = values.aiProvider || currentProvider;
    const configData: Partial<AIConfig> = {
      api_key: values[`${provider}ApiKey`],
      base_url: values[`${provider}BaseUrl`],
      model: values[`${provider}Model`],
      max_tokens: values[`${provider}MaxTokens`],
      temperature: values[`${provider}Temperature`],
      enabled: true
    };

    await handleRequest(
      () => configAPI.updateAIConfig(provider, configData),
      (response) => {
        setAiConfigs(prev => ({ ...prev, [provider]: response.data }));
        // 清除缓存，强制重新加载
        configCache.clearCache();
        message.success(`${provider} 配置保存成功`);
      },
      (error) => message.error(`保存失败: ${error}`)
    );

    // 如果切换了提供商，同时更新系统配置
    if (provider !== currentProvider) {
      await handleRequest(
        () => configAPI.switchAIProvider(provider),
        () => {
          setCurrentProvider(provider);
          message.success(`已切换到 ${provider}`);
        },
        (error) => message.error(`切换提供商失败: ${error}`)
      );
    }
  };

  // 测试AI连接
  const handleTestConnection = async (provider: string) => {
    setConnectionStatus(prev => ({ ...prev, [provider]: 'testing' }));

    await handleRequest(
      () => configAPI.testAIConnection(provider),
      (response) => {
        console.log('🔍 测试连接响应:', response);
        setConnectionStatus(prev => ({ ...prev, [provider]: 'success' }));

        // 正确访问API响应数据
        const responseTime = response?.data?.response_time || 0;
        const model = response?.data?.model || 'unknown';

        message.success(`${provider} 连接测试成功 (${Math.round(responseTime * 1000)}ms, 模型: ${model})`);
      },
      (error) => {
        console.error('❌ 测试连接失败:', error);
        setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
        message.error(`${provider} 连接测试失败: ${error}`);
      }
    );
  };

  // 重置配置
  const handleResetConfig = async () => {
    await handleRequest(
      () => configAPI.resetConfig(),
      (response) => {
        const config = response.data;
        setSystemConfig(config.system || {});
        setAiConfigs(config.ai_models || {});
        systemForm.setFieldsValue(config.system);
        configCache.clearCache();
        message.success('配置已重置为默认值');
        loadConfig(); // 重新加载配置
      },
      (error) => message.error(`重置失败: ${error}`)
    );
  };

  // 保存个人资料（模拟功能）
  const handleSave = async (values: any) => {
    await handleRequest(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000)),
      () => message.success('个人资料保存成功'),
      (error) => message.error(`保存失败: ${error}`)
    );
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          <span>个人资料</span>
        </Space>
      ),
      children: (
        <Card title="个人资料设置">
          <Form layout="vertical" onFinish={handleSave}>
            <Row gutter={24}>
              <Col span={8}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar size={120} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                  <br />
                  <Upload>
                    <Button icon={<UploadOutlined />}>更换头像</Button>
                  </Upload>
                </div>
              </Col>
              <Col span={16}>
                <Form.Item label="用户名" name="username" initialValue="admin">
                  <Input />
                </Form.Item>
                
                <Form.Item label="邮箱" name="email" initialValue="admin@example.com">
                  <Input />
                </Form.Item>
                
                <Form.Item label="手机号" name="phone" initialValue="13800138000">
                  <Input />
                </Form.Item>
                
                <Form.Item label="部门" name="department" initialValue="技术部">
                  <Input />
                </Form.Item>
                
                <Form.Item label="职位" name="position" initialValue="系统管理员">
                  <Input />
                </Form.Item>
                
                <Form.Item label="个人简介" name="bio">
                  <TextArea rows={4} placeholder="请输入个人简介" />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'system',
      label: (
        <Space>
          <SettingOutlined />
          <span>系统设置</span>
        </Space>
      ),
      children: (
        <Card title="系统设置"
              extra={
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadConfig}
                    loading={configLoading}
                  >
                    刷新
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        console.log('🔍 测试API连接...');
                        const response = await fetch('http://127.0.0.1:9958/api/unified-config/');
                        const data = await response.json();
                        console.log('📡 API响应:', data);
                        message.success('API连接正常');
                      } catch (error) {
                        console.error('❌ API连接失败:', error);
                        message.error('API连接失败');
                      }
                    }}
                  >
                    测试API
                  </Button>
                  <Button
                    danger
                    onClick={handleResetConfig}
                    loading={loading}
                  >
                    重置为默认
                  </Button>
                </Space>
              }>
          {configLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>加载配置中...</div>
            </div>
          ) : (
            <Form
              form={systemForm}
              layout="vertical"
              onFinish={handleSaveSystemConfig}
            >
              {error && (
                <Alert
                  message="配置加载失败"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  onClose={clearError}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Title level={5}>界面设置</Title>
              <div style={{ marginBottom: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                <strong>调试信息:</strong>
                <div>系统配置: {JSON.stringify(systemConfig)}</div>
                <div>配置加载状态: {configLoading ? '加载中' : '已完成'}</div>
                <div>错误信息: {error || '无'}</div>
              </div>

              <Form.Item label="主题" name="theme">
                <Select>
                  <Option value="浅色">浅色主题</Option>
                  <Option value="深色">深色主题</Option>
                  <Option value="自动">跟随系统</Option>
                </Select>
              </Form.Item>

              <Form.Item label="语言" name="language">
                <Select>
                  <Option value="中文">简体中文</Option>
                  <Option value="English">English</Option>
                </Select>
              </Form.Item>

              <Form.Item label="默认路径" name="default_path">
                <Input placeholder="请输入默认项目路径" />
              </Form.Item>

              <Divider />

              <Title level={5}>功能设置</Title>
              <Form.Item label="自动保存" name="auto_save" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存系统设置
                  </Button>
                  {systemConfig && (
                    <Tag color="green">
                      <CheckCircleOutlined /> 配置已加载
                    </Tag>
                  )}
                </Space>
              </Form.Item>
            </Form>
          )}
        </Card>
      ),
    },
    {
      key: 'ai-config',
      label: (
        <Space>
          <RobotOutlined />
          <span>AI配置</span>
        </Space>
      ),
      children: (
        <Card title="AI模型配置"
              extra={
                <Space>
                  <Tag color={currentProvider === 'deepseek' ? 'green' : 'default'}>
                    当前: {currentProvider}
                  </Tag>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadConfig}
                    loading={configLoading}
                  >
                    刷新
                  </Button>
                </Space>
              }>
          {configLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>加载AI配置中...</div>
            </div>
          ) : (
            <Form
              form={aiForm}
              layout="vertical"
              onFinish={handleSaveAIConfig}
            >
              {error && (
                <Alert
                  message="AI配置加载失败"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  onClose={clearError}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Title level={5}>AI提供商设置</Title>
              <Form.Item label="当前AI提供商" name="aiProvider">
                <Select onChange={(value) => setCurrentProvider(value)}>
                  <Option value="deepseek">DeepSeek</Option>
                  <Option value="openai">OpenAI</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Title level={5}>DeepSeek配置</Title>
              <Form.Item
                label="API密钥"
                name="deepseekApiKey"
                rules={[{ required: currentProvider === 'deepseek', message: '请输入DeepSeek API密钥' }]}
              >
                <Input.Password placeholder="请输入DeepSeek API密钥" />
              </Form.Item>

              <Form.Item label="API地址" name="deepseekBaseUrl">
                <Input placeholder="DeepSeek API地址" />
              </Form.Item>

              <Form.Item label="模型" name="deepseekModel">
                <Select>
                  <Option value="deepseek-chat">deepseek-chat</Option>
                  <Option value="deepseek-coder">deepseek-coder</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="最大Token数" name="deepseekMaxTokens">
                    <Input type="number" placeholder="4000" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="温度参数" name="deepseekTemperature">
                    <Input type="number" step="0.1" placeholder="0.7" />
                  </Form.Item>
                </Col>
              </Row>

              <Space style={{ marginBottom: 16 }}>
                <Button
                  icon={<ApiOutlined />}
                  loading={connectionStatus.deepseek === 'testing'}
                  onClick={() => handleTestConnection('deepseek')}
                >
                  测试DeepSeek连接
                </Button>
                {connectionStatus.deepseek === 'success' && (
                  <Tag color="green"><CheckCircleOutlined /> 连接正常</Tag>
                )}
                {connectionStatus.deepseek === 'error' && (
                  <Tag color="red"><ExclamationCircleOutlined /> 连接失败</Tag>
                )}
              </Space>

              <Divider />

              <Title level={5}>OpenAI配置</Title>
              <Form.Item
                label="API密钥"
                name="openaiApiKey"
                rules={[{ required: currentProvider === 'openai', message: '请输入OpenAI API密钥' }]}
              >
                <Input.Password placeholder="请输入OpenAI API密钥" />
              </Form.Item>

              <Form.Item label="API地址" name="openaiBaseUrl">
                <Input placeholder="OpenAI API地址" />
              </Form.Item>

              <Form.Item label="模型" name="openaiModel">
                <Select>
                  <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
                  <Option value="gpt-4">GPT-4</Option>
                  <Option value="gpt-4-turbo">GPT-4 Turbo</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="最大Token数" name="openaiMaxTokens">
                    <Input type="number" placeholder="4000" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="温度参数" name="openaiTemperature">
                    <Input type="number" step="0.1" placeholder="0.7" />
                  </Form.Item>
                </Col>
              </Row>

              <Space style={{ marginBottom: 16 }}>
                <Button
                  icon={<ApiOutlined />}
                  loading={connectionStatus.openai === 'testing'}
                  onClick={() => handleTestConnection('openai')}
                >
                  测试OpenAI连接
                </Button>
                {connectionStatus.openai === 'success' && (
                  <Tag color="green"><CheckCircleOutlined /> 连接正常</Tag>
                )}
                {connectionStatus.openai === 'error' && (
                  <Tag color="red"><ExclamationCircleOutlined /> 连接失败</Tag>
                )}
              </Space>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存AI配置
                  </Button>
                  <Button onClick={handleResetConfig} loading={loading}>
                    重置为默认
                  </Button>
                  {aiConfigs && Object.keys(aiConfigs).length > 0 && (
                    <Tag color="blue">
                      <CheckCircleOutlined /> 已配置 {Object.keys(aiConfigs).length} 个提供商
                    </Tag>
                  )}
                </Space>
              </Form.Item>
            </Form>
          )}
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <Space>
          <BellOutlined />
          <span>通知设置</span>
        </Space>
      ),
      children: (
        <Card title="通知设置">
          <Form layout="vertical" onFinish={handleSave}>
            <Title level={5}>邮件通知</Title>
            <Form.Item label="项目更新通知" name="projectNotification" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="工作流完成通知" name="workflowNotification" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="系统维护通知" name="systemNotification" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="安全警告通知" name="securityNotification" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Divider />
            
            <Title level={5}>浏览器通知</Title>
            <Form.Item label="桌面通知" name="desktopNotification" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="声音提醒" name="soundNotification" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            
            <Divider />
            
            <Title level={5}>通知频率</Title>
            <Form.Item label="摘要频率" name="summaryFrequency" initialValue="daily">
              <Select>
                <Option value="realtime">实时</Option>
                <Option value="hourly">每小时</Option>
                <Option value="daily">每日</Option>
                <Option value="weekly">每周</Option>
              </Select>
            </Form.Item>
            
            <Divider />
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <Space>
          <SafetyCertificateOutlined />
          <span>安全设置</span>
        </Space>
      ),
      children: (
        <Card title="安全设置">
          <Form layout="vertical" onFinish={handleSave}>
            <Title level={5}>密码设置</Title>
            <Form.Item label="当前密码" name="currentPassword">
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            
            <Form.Item label="新密码" name="newPassword">
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            
            <Form.Item label="确认新密码" name="confirmPassword">
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            
            <Divider />
            
            <Title level={5}>登录安全</Title>
            <Form.Item label="双因素认证" name="twoFactor" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="登录IP限制" name="ipRestriction" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="会话超时时间" name="sessionTimeout" initialValue="30">
              <Select>
                <Option value="15">15分钟</Option>
                <Option value="30">30分钟</Option>
                <Option value="60">1小时</Option>
                <Option value="240">4小时</Option>
                <Option value="480">8小时</Option>
              </Select>
            </Form.Item>
            
            <Divider />
            
            <Title level={5}>数据安全</Title>
            <Form.Item label="数据加密" name="dataEncryption" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Form.Item label="操作日志" name="operationLog" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Divider />
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
                <Button>查看登录历史</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'about',
      label: (
        <Space>
          <GlobalOutlined />
          <span>关于系统</span>
        </Space>
      ),
      children: (
        <Card title="关于系统">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={2}>ZtbAiBidApp</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              智能投标文件生成系统
            </Text>
            
            <Divider />
            
            <Row gutter={[32, 16]} style={{ marginTop: 32 }}>
              <Col span={8}>
                <div>
                  <Text strong>版本号</Text>
                  <br />
                  <Text>v1.0.0</Text>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>发布日期</Text>
                  <br />
                  <Text>2024-08-04</Text>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>技术栈</Text>
                  <br />
                  <Text>React + TypeScript</Text>
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ marginTop: 32 }}>
              <Text>
                本系统采用AI技术，为用户提供智能化的投标文件生成服务，
                支持多种文档类型和自定义模板，提高投标效率和成功率。
              </Text>
            </div>
            
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button>用户手册</Button>
                <Button>技术支持</Button>
                <Button>意见反馈</Button>
              </Space>
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default Settings;
