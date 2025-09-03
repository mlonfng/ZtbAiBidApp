import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Button, Space, Typography, message } from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  StarOutlined,
  HistoryOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';

import TemplateGallery from '../../components/Template/TemplateGallery';
import TemplateCategories from '../../components/Template/TemplateCategories';
import MyTemplates from '../../components/Template/MyTemplates';
import TemplateEditor from '../../components/Template/TemplateEditor';
import FavoriteTemplates from '../../components/Template/FavoriteTemplates';

const { Content } = Layout;
const { Title } = Typography;

const TemplateLibrary: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('gallery');
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const { templates, loading } = useAppSelector(state => state.template || { templates: [], loading: false });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 模拟刷新数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('模板数据刷新成功');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateTemplate = () => {
    setCreateModalVisible(true);
  };

  const tabItems = [
    {
      key: 'gallery',
      label: (
        <Space>
          <AppstoreOutlined />
          <span>模板库</span>
        </Space>
      ),
      children: <TemplateGallery />,
    },
    {
      key: 'categories',
      label: (
        <Space>
          <SettingOutlined />
          <span>分类管理</span>
        </Space>
      ),
      children: <TemplateCategories />,
    },
    {
      key: 'my-templates',
      label: (
        <Space>
          <HistoryOutlined />
          <span>我的模板</span>
        </Space>
      ),
      children: <MyTemplates />,
    },
    {
      key: 'favorites',
      label: (
        <Space>
          <StarOutlined />
          <span>收藏夹</span>
        </Space>
      ),
      children: <FavoriteTemplates />,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              模板库管理
            </Title>
            <Typography.Text type="secondary">
              管理和使用投标文件模板
            </Typography.Text>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              刷新数据
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTemplate}
            >
              创建模板
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* 模板编辑器模态框 */}
      <TemplateEditor
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSave={() => {
          setCreateModalVisible(false);
          message.success('模板创建成功');
        }}
      />
    </div>
  );
};

export default TemplateLibrary;
