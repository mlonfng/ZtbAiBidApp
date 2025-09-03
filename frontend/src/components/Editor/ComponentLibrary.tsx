import React, { useState } from 'react';
import { Collapse, Input, Typography, Space } from 'antd';
import { useDrag } from 'react-dnd';
import {
  FontSizeOutlined,
  PictureOutlined,
  TableOutlined,
  BarChartOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BorderOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Text } = Typography;
const { Search } = Input;

// 组件类型定义
interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  defaultProps: any;
}

// 可拖拽组件项
const DraggableComponent: React.FC<{ component: ComponentItem }> = ({ component }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { 
      type: 'component',
      componentType: component.id,
      defaultProps: component.defaultProps
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="component-item"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <div className="component-item-icon">
        {component.icon}
      </div>
      <div>
        <div className="component-item-name">{component.name}</div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {component.description}
        </Text>
      </div>
    </div>
  );
};

const ComponentLibrary: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeKey, setActiveKey] = useState(['basic', 'layout', 'data']);

  // 组件库数据
  const componentCategories = [
    {
      key: 'basic',
      title: '基础组件',
      components: [
        {
          id: 'text',
          name: '文本',
          icon: <FontSizeOutlined />,
          description: '普通文本内容',
          category: 'basic',
          defaultProps: {
            content: '文本内容',
            fontSize: 14,
            color: '#000000',
            fontWeight: 'normal',
            textAlign: 'left',
          },
        },
        {
          id: 'title',
          name: '标题',
          icon: <FontSizeOutlined />,
          description: '标题文本',
          category: 'basic',
          defaultProps: {
            content: '标题内容',
            level: 1,
            fontSize: 24,
            color: '#000000',
            fontWeight: 'bold',
            textAlign: 'left',
          },
        },
        {
          id: 'image',
          name: '图片',
          icon: <PictureOutlined />,
          description: '图片组件',
          category: 'basic',
          defaultProps: {
            src: '',
            alt: '图片',
            width: 200,
            height: 150,
            objectFit: 'cover',
          },
        },
        {
          id: 'divider',
          name: '分割线',
          icon: <BorderOutlined />,
          description: '内容分割线',
          category: 'basic',
          defaultProps: {
            type: 'horizontal',
            style: 'solid',
            color: '#d9d9d9',
            thickness: 1,
          },
        },
      ],
    },
    {
      key: 'layout',
      title: '布局组件',
      components: [
        {
          id: 'container',
          name: '容器',
          icon: <AppstoreOutlined />,
          description: '布局容器',
          category: 'layout',
          defaultProps: {
            padding: 16,
            margin: 0,
            backgroundColor: 'transparent',
            borderRadius: 0,
            border: 'none',
          },
        },
        {
          id: 'row',
          name: '行',
          icon: <BorderOutlined />,
          description: '水平布局行',
          category: 'layout',
          defaultProps: {
            gutter: 16,
            justify: 'start',
            align: 'top',
          },
        },
        {
          id: 'column',
          name: '列',
          icon: <BorderOutlined />,
          description: '垂直布局列',
          category: 'layout',
          defaultProps: {
            span: 12,
            offset: 0,
            flex: 'none',
          },
        },
      ],
    },
    {
      key: 'data',
      title: '数据展示',
      components: [
        {
          id: 'table',
          name: '表格',
          icon: <TableOutlined />,
          description: '数据表格',
          category: 'data',
          defaultProps: {
            columns: [
              { title: '列1', dataIndex: 'col1', key: 'col1' },
              { title: '列2', dataIndex: 'col2', key: 'col2' },
            ],
            dataSource: [
              { key: '1', col1: '数据1', col2: '数据2' },
              { key: '2', col1: '数据3', col2: '数据4' },
            ],
            bordered: true,
            size: 'middle',
          },
        },
        {
          id: 'chart',
          name: '图表',
          icon: <BarChartOutlined />,
          description: '数据图表',
          category: 'data',
          defaultProps: {
            type: 'bar',
            data: [],
            width: 400,
            height: 300,
          },
        },
        {
          id: 'list',
          name: '列表',
          icon: <FileTextOutlined />,
          description: '数据列表',
          category: 'data',
          defaultProps: {
            items: ['列表项1', '列表项2', '列表项3'],
            type: 'unordered',
            size: 'default',
          },
        },
      ],
    },
    {
      key: 'business',
      title: '业务组件',
      components: [
        {
          id: 'company-info',
          name: '公司信息',
          icon: <TeamOutlined />,
          description: '公司基本信息',
          category: 'business',
          defaultProps: {
            companyName: '公司名称',
            address: '公司地址',
            phone: '联系电话',
            email: '邮箱地址',
            website: '网站地址',
          },
        },
        {
          id: 'project-timeline',
          name: '项目时间线',
          icon: <CalendarOutlined />,
          description: '项目进度时间线',
          category: 'business',
          defaultProps: {
            items: [
              { date: '2024-01-01', title: '项目启动', description: '项目正式启动' },
              { date: '2024-02-01', title: '需求分析', description: '完成需求分析' },
              { date: '2024-03-01', title: '项目交付', description: '项目正式交付' },
            ],
          },
        },
        {
          id: 'price-table',
          name: '报价表',
          icon: <DollarOutlined />,
          description: '项目报价表格',
          category: 'business',
          defaultProps: {
            items: [
              { name: '项目1', quantity: 1, price: 10000, total: 10000 },
              { name: '项目2', quantity: 2, price: 5000, total: 10000 },
            ],
            currency: '¥',
            showTotal: true,
          },
        },
      ],
    },
  ];

  // 过滤组件
  const filteredCategories = componentCategories.map(category => ({
    ...category,
    components: (category.components as ComponentItem[]).filter((component: ComponentItem) =>
      component.name.toLowerCase().includes(searchText.toLowerCase()) ||
      component.description.toLowerCase().includes(searchText.toLowerCase())
    ),
  })).filter(category => category.components.length > 0);

  return (
    <div className="component-library">
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <Search
          placeholder="搜索组件"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
          size="small"
        />
      </div>

      <Collapse
        activeKey={activeKey}
        onChange={setActiveKey}
        ghost
        size="small"
        style={{ padding: '0 8px' }}
      >
        {filteredCategories.map(category => (
          <Panel
            key={category.key}
            header={
              <Space>
                <Text strong style={{ fontSize: 14 }}>
                  {category.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({category.components.length})
                </Text>
              </Space>
            }
          >
            <div style={{ padding: '8px 0' }}>
              {(category.components as ComponentItem[]).map((component: ComponentItem) => (
                <DraggableComponent
                  key={component.id}
                  component={component}
                />
              ))}
            </div>
          </Panel>
        ))}
      </Collapse>

      {filteredCategories.length === 0 && searchText && (
        <div style={{ 
          padding: 40, 
          textAlign: 'center', 
          color: '#999' 
        }}>
          <SearchOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>未找到匹配的组件</div>
        </div>
      )}
    </div>
  );
};

export default ComponentLibrary;
