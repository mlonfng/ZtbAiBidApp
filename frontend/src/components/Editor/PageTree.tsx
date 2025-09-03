import React, { useState } from 'react';
import { 
  Tree, 
  Button, 
  Input, 
  Dropdown, 
  Modal, 
  Form, 
  Select,
  Typography,
  Space,
  message,
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

import { useAppDispatch, useAppSelector } from '../../store';
import { addPage, deletePage, updatePage } from '../../store/slices/projectSlice';
import { Project } from '../../store/slices/projectSlice';

const { Text } = Typography;
const { Option } = Select;

interface PageTreeProps {
  project: Project;
  onPageSelect: (pageId: string) => void;
}

const PageTree: React.FC<PageTreeProps> = ({ project, onPageSelect }) => {
  const dispatch = useAppDispatch();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['pages']);
  const [addPageModalVisible, setAddPageModalVisible] = useState(false);
  const [editPageModalVisible, setEditPageModalVisible] = useState(false);
  const [currentEditPage, setCurrentEditPage] = useState<any>(null);
  const [form] = Form.useForm();

  const { currentPage } = useAppSelector(state => state.project);

  // 构建树形数据
  const buildTreeData = (): DataNode[] => {
    const pages = project.pages || [];
    
    const pageNodes: DataNode[] = pages.map(page => ({
      key: page.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <FileTextOutlined />
            <Text>{page.title}</Text>
            {currentPage?.id === page.id && (
              <Text type="secondary" style={{ fontSize: 12 }}>(当前)</Text>
            )}
          </Space>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑',
                  onClick: () => handleEditPage(page),
                },
                {
                  key: 'duplicate',
                  icon: <CopyOutlined />,
                  label: '复制',
                  onClick: () => handleDuplicatePage(page),
                },
                {
                  key: 'preview',
                  icon: <EyeOutlined />,
                  label: '预览',
                  onClick: () => handlePreviewPage(page),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  danger: true,
                  onClick: () => handleDeletePage(page),
                },
              ],
            }}
            trigger={['click']}

          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      ),
      icon: <FileTextOutlined />,
      isLeaf: true,
    }));

    return [
      {
        key: 'pages',
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong>页面列表</Text>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setAddPageModalVisible(true);
              }}
            />
          </div>
        ),
        children: pageNodes,
      },
    ];
  };

  const handleSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    if (key && key !== 'pages') {
      setSelectedKeys([key]);
      onPageSelect(key);
    }
  };

  const handleAddPage = async (values: any) => {
    try {
      await dispatch(addPage({
        projectId: project.id,
        pageData: {
          title: values.title,
          layoutType: values.layoutType,
          order: (project.pages?.length || 0) + 1,
        },
      })).unwrap();
      
      message.success('页面添加成功');
      setAddPageModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('添加页面失败');
    }
  };

  const handleEditPage = (page: any) => {
    setCurrentEditPage(page);
    form.setFieldsValue({
      title: page.title,
      layoutType: page.layoutType,
    });
    setEditPageModalVisible(true);
  };

  const handleUpdatePage = async (values: any) => {
    if (!currentEditPage) return;

    try {
      await dispatch(updatePage({
        projectId: project.id,
        pageId: currentEditPage.id,
        data: {
          title: values.title,
          layoutType: values.layoutType,
        },
      })).unwrap();
      
      message.success('页面更新成功');
      setEditPageModalVisible(false);
      setCurrentEditPage(null);
      form.resetFields();
    } catch (error) {
      message.error('更新页面失败');
    }
  };

  const handleDeletePage = (page: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除页面 "${page.title}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deletePage({
            projectId: project.id,
            pageId: page.id,
          })).unwrap();
          
          message.success('页面删除成功');
        } catch (error) {
          message.error('删除页面失败');
        }
      },
    });
  };

  const handleDuplicatePage = async (page: any) => {
    try {
      await dispatch(addPage({
        projectId: project.id,
        pageData: {
          title: `${page.title} - 副本`,
          layoutType: page.layoutType,
          order: (project.pages?.length || 0) + 1,
        },
      })).unwrap();
      
      message.success('页面复制成功');
    } catch (error) {
      message.error('复制页面失败');
    }
  };

  const handlePreviewPage = (page: any) => {
    // 预览页面功能
    message.info('预览功能开发中...');
  };

  const treeData = buildTreeData();

  return (
    <div style={{ padding: '16px 8px' }}>
      <Tree
        treeData={treeData}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onSelect={handleSelect}
        onExpand={(expandedKeys: React.Key[]) => setExpandedKeys(expandedKeys as string[])}
        showIcon
        blockNode
      />

      {/* 添加页面模态框 */}
      <Modal
        title="添加页面"
        open={addPageModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setAddPageModalVisible(false);
          form.resetFields();
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddPage}
        >
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题' }]}
          >
            <Input placeholder="请输入页面标题" />
          </Form.Item>
          
          <Form.Item
            name="layoutType"
            label="布局类型"
            rules={[{ required: true, message: '请选择布局类型' }]}
          >
            <Select placeholder="请选择布局类型">
              <Option value="blank">空白页面</Option>
              <Option value="single_column">单栏布局</Option>
              <Option value="two_column">双栏布局</Option>
              <Option value="three_column">三栏布局</Option>
              <Option value="grid">网格布局</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑页面模态框 */}
      <Modal
        title="编辑页面"
        open={editPageModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditPageModalVisible(false);
          setCurrentEditPage(null);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdatePage}
        >
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题' }]}
          >
            <Input placeholder="请输入页面标题" />
          </Form.Item>
          
          <Form.Item
            name="layoutType"
            label="布局类型"
            rules={[{ required: true, message: '请选择布局类型' }]}
          >
            <Select placeholder="请选择布局类型">
              <Option value="blank">空白页面</Option>
              <Option value="single_column">单栏布局</Option>
              <Option value="two_column">双栏布局</Option>
              <Option value="three_column">三栏布局</Option>
              <Option value="grid">网格布局</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PageTree;
