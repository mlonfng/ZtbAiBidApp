import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Settings: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>系统设置</Title>
        <p>系统设置界面将在后续子任务中实现...</p>
      </Card>
    </div>
  );
};

export default Settings;
