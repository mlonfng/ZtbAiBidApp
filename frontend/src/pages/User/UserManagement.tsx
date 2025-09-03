import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const UserManagement: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>用户管理</Title>
        <p>用户管理界面将在后续子任务中实现...</p>
      </Card>
    </div>
  );
};

export default UserManagement;
