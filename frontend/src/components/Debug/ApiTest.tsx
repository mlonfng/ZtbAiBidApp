import React, { useState } from 'react';
import { Button, Card, Typography, Space, Alert, Spin } from 'antd';
import { projectAPI } from '../../services/projectAPI';

const { Title, Text, Paragraph } = Typography;

const ApiTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testProjectsAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 [DEBUG] Testing projects API...');
      const response = await projectAPI.getProjects();
      console.log('🔍 [DEBUG] API response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('🔍 [DEBUG] API test error:', err);
      setError(err.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 [DEBUG] Testing direct fetch...');
      const response = await fetch('http://127.0.0.1:9958/api/projects/');
      const data = await response.json();
      console.log('🔍 [DEBUG] Direct fetch response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('🔍 [DEBUG] Direct fetch error:', err);
      setError(err.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>API 连接测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="测试操作">
          <Space>
            <Button 
              type="primary" 
              onClick={testProjectsAPI}
              loading={loading}
            >
              测试项目API (通过axios)
            </Button>
            <Button 
              onClick={testDirectFetch}
              loading={loading}
            >
              测试直接请求 (fetch)
            </Button>
          </Space>
        </Card>

        {error && (
          <Alert
            message="请求失败"
            description={error}
            type="error"
            showIcon
          />
        )}

        {loading && (
          <Card>
            <Spin size="large" />
            <Text style={{ marginLeft: 16 }}>正在测试API连接...</Text>
          </Card>
        )}

        {result && (
          <Card title="API 响应结果">
            <Paragraph>
              <Text strong>响应类型:</Text> {typeof result}
            </Paragraph>
            <Paragraph>
              <Text strong>是否为数组:</Text> {Array.isArray(result) ? '是' : '否'}
            </Paragraph>
            <Paragraph>
              <Text strong>响应内容:</Text>
            </Paragraph>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              overflow: 'auto',
              maxHeight: 400
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ApiTest;
