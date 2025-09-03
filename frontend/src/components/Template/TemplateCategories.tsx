import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tree, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  Form, 
  Input, 
  Select,
  Table,
  Tag,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileTextOutlined,
  DragOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  icon: string;
  color: string;
  sort: number;
  templateCount: number;
  isSystem: boolean;
  createTime: Date;
}

const TemplateCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 生成模拟分类数据
  const generateMockCategories = (): Category[] => {
    return [
      {
        id: 'cat_1',
        name: '商务投标',
        description: '商务类投标文件模板',
        icon: 'FileTextOutlined',
        color: 'blue',
        sort: 1,
        templateCount: 15,
        isSystem: true,
        createTime: new Date('2024-01-01'),
      },
      {
        id: 'cat_1_1',
        name: '服务采购',
        description: '服务类采购投标模板',
        parentId: 'cat_1',
        icon: 'FileTextOutlined',
        color: 'cyan',
        sort: 1,
        templateCount: 8,
        isSystem: false,
        createTime: new Date('2024-01-15'),
      },
      {
        id: 'cat_1_2',
        name: '产品销售',
        description: '产品销售投标模板',
        parentId: 'cat_1',
        icon: 'FileTextOutlined',
        color: 'geekblue',
        sort: 2,
        templateCount: 7,
        isSystem: false,
        createTime: new Date('2024-01-20'),
      },
      {
        id: 'cat_2',
        name: '技术方案',
        description: '技术方案类投标文件模板',
        icon: 'FileTextOutlined',
        color: 'green',
        sort: 2,
        templateCount: 12,
        isSystem: true,
        createTime: new Date('2024-01-05'),
      },
      {
        id: 'cat_2_1',
        name: 'IT系统',
        description: 'IT系统建设方案模板',
        parentId: 'cat_2',
        icon: 'FileTextOutlined',
        color: 'lime',
        sort: 1,
        templateCount: 6,
        isSystem: false,
        createTime: new Date('2024-02-01'),
      },
      {
        id: 'cat_2_2',
        name: '软件开发',
        description: '软件开发项目方案模板',
        parentId: 'cat_2',
        icon: 'FileTextOutlined',
        color: 'green',
        sort: 2,
        templateCount: 6,
        isSystem: false,
        createTime: new Date('2024-02-10'),
      },
      {
        id: 'cat_3',
        name: '工程建设',
        description: '工程建设类投标文件模板',
        icon: 'FileTextOutlined',
        color: 'orange',
        sort: 3,
        templateCount: 9,
        isSystem: true,
        createTime: new Date('2024-01-10'),
      },
    ];
  };

  useEffect(() => {
    const mockCategories = generateMockCategories();
    setCategories(mockCategories);
    setTreeData(buildTreeData(mockCategories));
  }, []);

  // 构建树形数据
  const buildTreeData = (categories: Category[]): DataNode[] => {
    const categoryMap = new Map<string, Category>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    const buildNode = (category: Category): DataNode => ({
      key: category.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <FolderOutlined style={{ color: category.color }} />
            <span>{category.name}</span>
            <Tag color={category.color}>
              {category.templateCount}
            </Tag>
            {category.isSystem && <Tag>系统</Tag>}
          </Space>
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(category);
                }}
              />
            </Tooltip>
            {!category.isSystem && (
              <Tooltip title="删除">
                <Popconfirm
                  title="确定要删除这个分类吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteCategory(category);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        </div>
      ),
      children: categories
        .filter(cat => cat.parentId === category.id)
        .sort((a, b) => a.sort - b.sort)
        .map(buildNode),
    });

    return categories
      .filter(cat => !cat.parentId)
      .sort((a, b) => a.sort - b.sort)
      .map(buildNode);
  };

  // 创建分类
  const handleCreateCategory = async (values: any) => {
    try {
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name: values.name,
        description: values.description,
        parentId: values.parentId,
        icon: 'FileTextOutlined',
        color: values.color || 'blue',
        sort: categories.filter(cat => cat.parentId === values.parentId).length + 1,
        templateCount: 0,
        isSystem: false,
        createTime: new Date(),
      };
      
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      setTreeData(buildTreeData(updatedCategories));
      
      message.success('分类创建成功');
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('分类创建失败');
    }
  };

  // 编辑分类
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      color: category.color,
    });
    setEditModalVisible(true);
  };

  // 更新分类
  const handleUpdateCategory = async (values: any) => {
    if (!selectedCategory) return;

    try {
      const updatedCategories = categories.map(cat =>
        cat.id === selectedCategory.id
          ? { ...cat, name: values.name, description: values.description, color: values.color }
          : cat
      );
      
      setCategories(updatedCategories);
      setTreeData(buildTreeData(updatedCategories));
      
      message.success('分类更新成功');
      setEditModalVisible(false);
      setSelectedCategory(null);
      form.resetFields();
    } catch (error) {
      message.error('分类更新失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = (category: Category) => {
    const hasChildren = categories.some(cat => cat.parentId === category.id);
    if (hasChildren) {
      message.error('该分类下还有子分类，无法删除');
      return;
    }

    if (category.templateCount > 0) {
      message.error('该分类下还有模板，无法删除');
      return;
    }

    const updatedCategories = categories.filter(cat => cat.id !== category.id);
    setCategories(updatedCategories);
    setTreeData(buildTreeData(updatedCategories));
    message.success('分类删除成功');
  };

  // 获取父分类选项
  const getParentOptions = () => {
    return categories
      .filter(cat => !cat.parentId)
      .map(cat => ({ value: cat.id, label: cat.name }));
  };

  // 分类表格列
  const columns: ColumnsType<Category> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <FolderOutlined style={{ color: record.color }} />
          <span>{name}</span>
          {record.isSystem && <Tag>系统</Tag>}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '模板数量',
      dataIndex: 'templateCount',
      key: 'templateCount',
      width: 100,
      render: (count) => (
        <Tag color="blue">{count}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      render: (time) => time.toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCategory(record)}
            />
          </Tooltip>
          {!record.isSystem && (
            <Popconfirm
              title="确定要删除这个分类吗？"
              onConfirm={() => handleDeleteCategory(record)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="分类管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建分类
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          {/* 左侧树形结构 */}
          <div style={{ flex: 1 }}>
            <Title level={5}>分类树</Title>
            <Tree
              treeData={treeData}
              defaultExpandAll
              showLine
              showIcon={false}
            />
          </div>
          
          {/* 右侧表格 */}
          <div style={{ flex: 2 }}>
            <Title level={5}>分类列表</Title>
            <Table
              columns={columns}
              dataSource={categories}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </div>
        </div>
      </Card>

      {/* 创建分类模态框 */}
      <Modal
        title="创建分类"
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCategory}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="分类描述"
            rules={[{ required: true, message: '请输入分类描述' }]}
          >
            <TextArea rows={3} placeholder="请输入分类描述" />
          </Form.Item>
          
          <Form.Item
            name="parentId"
            label="父分类"
          >
            <Select placeholder="选择父分类（可选）" allowClear>
              {getParentOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="color"
            label="分类颜色"
            initialValue="blue"
          >
            <Select>
              <Option value="blue">蓝色</Option>
              <Option value="green">绿色</Option>
              <Option value="orange">橙色</Option>
              <Option value="red">红色</Option>
              <Option value="purple">紫色</Option>
              <Option value="cyan">青色</Option>
              <Option value="geekblue">极客蓝</Option>
              <Option value="magenta">洋红</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑分类模态框 */}
      <Modal
        title={`编辑分类 - ${selectedCategory?.name}`}
        open={editModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedCategory(null);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateCategory}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="分类描述"
            rules={[{ required: true, message: '请输入分类描述' }]}
          >
            <TextArea rows={3} placeholder="请输入分类描述" />
          </Form.Item>
          
          <Form.Item
            name="color"
            label="分类颜色"
          >
            <Select>
              <Option value="blue">蓝色</Option>
              <Option value="green">绿色</Option>
              <Option value="orange">橙色</Option>
              <Option value="red">红色</Option>
              <Option value="purple">紫色</Option>
              <Option value="cyan">青色</Option>
              <Option value="geekblue">极客蓝</Option>
              <Option value="magenta">洋红</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateCategories;
