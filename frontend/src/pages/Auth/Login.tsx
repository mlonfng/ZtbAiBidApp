import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { login } from '../../store/slices/authSlice';
import { authAPI } from '../../services/authAPI';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      // 使用真实API登录
      const response = await authAPI.login({
        username: values.username,
        password: values.password
      });

      // 更新Redux状态 - 使用API返回的用户信息和token
      await dispatch(login({
        username: values.username,
        password: values.password
      })).unwrap();

      // 保存到localStorage
      if (values.remember) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
      } else {
        // 如果不记住，只设置session token
        sessionStorage.setItem('token', response.token);
      }

      message.success('登录成功！');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
    message.error('请填写完整的登录信息');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: '#1890ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
            color: 'white',
            fontWeight: 'bold',
          }}>
            Z
          </div>
          <Title level={2} style={{ margin: 0, color: '#0056b3' }}>
            ZtbAiBidApp
          </Title>
          <Text style={{ color: '#666666' }}>智能投标文件生成系统</Text>
        </div>

        <Form
          name="login"
          initialValues={{
            remember: true,
            username: 'admin',
            password: 'admin123',
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少3个字符!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6个字符!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <a style={{ float: 'right' }} href="#forgot">
              忘记密码?
            </a>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: 48,
                fontSize: 16,
                borderRadius: 8,
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary">
            还没有账号? <a href="#register">立即注册</a>
          </Text>
        </div>

        <div style={{ 
          marginTop: 32, 
          padding: 16, 
          background: '#f0f2f5', 
          borderRadius: 8,
          fontSize: 12,
          color: '#333333',
        }}>
          <div><strong>演示账号:</strong></div>
          <div>管理员: admin / admin123</div>
          <div>普通用户: user / user123</div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
