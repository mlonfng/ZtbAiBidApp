import React, { useEffect, useState } from 'react';
import { Card, Button, List, Typography, Space, Tag, Spin, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useProjects } from '../../hooks/useProjectData';

const { Title, Text } = Typography;
// eslint-disable-next-line @typescript-eslint/no-unused-vars

const ProjectDataTest: React.FC = () => {
  const { projects, loading, error, refetch } = useProjects({ pageSize: 50 });
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    setDebugInfo({
      projectsCount: projects?.length || 0,
      loading,
      error,
      timestamp: new Date().toLocaleTimeString(),
      projectsData: projects
    });
  }, [projects, loading, error]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="Project Data Test" extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      }>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Status: </Text>
            {loading ? (
              <Tag color="blue">Loading...</Tag>
            ) : error ? (
              <Tag color="red">Error</Tag>
            ) : (
              <Tag color="green">Success</Tag>
            )}
          </div>

          <div>
            <Text strong>Projects Count: </Text>
            <Text>{projects?.length || 0}</Text>
          </div>

          <div>
            <Text strong>Last Update: </Text>
            <Text>{debugInfo.timestamp}</Text>
          </div>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
            />
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin size="large" />
              <div style={{ marginTop: 10 }}>Loading project data...</div>
            </div>
          )}

          {!loading && projects && projects.length > 0 && (
            <List
              dataSource={projects}
              renderItem={(project: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={project.name}
                    description={
                      <Space>
                        <Text type="secondary">ID: {project.id}</Text>
                        <Tag color={
                          project.status === 'active' ? 'green' :
                          project.status === 'in_progress' ? 'blue' :
                          project.status === 'completed' ? 'purple' :
                          'default'
                        }>
                          {project.status || 'draft'}
                        </Tag>
                        <Text type="secondary">{project.created_at}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}

          {!loading && (!projects || projects.length === 0) && (
            <Alert
              message="No Data"
              description="No projects found. This might indicate an API issue."
              type="warning"
              showIcon
            />
          )}

          <details>
            <summary>Debug Info</summary>
            <pre style={{ background: '#f5f5f5', padding: 10, fontSize: 12 }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </Space>
      </Card>
    </div>
  );
};

export default ProjectDataTest;
