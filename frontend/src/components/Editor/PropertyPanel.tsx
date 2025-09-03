import React from 'react';
import { 
  Tabs, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  ColorPicker, 
  Slider,
  Space,
} from 'antd';
import { SettingOutlined, BgColorsOutlined, ThunderboltOutlined } from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
import { updateCurrentPage } from '../../store/slices/projectSlice';
import { Project } from '../../store/slices/projectSlice';

// const { TabPane } = Tabs;
// const { Text } = Typography;
const { Option } = Select;

interface PropertyPanelProps {
  selectedComponent: string | null;
  project: Project;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedComponent, project }) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  
  const { currentPage } = useAppSelector(state => state.project);
  
  // 获取选中的组件
  const component = selectedComponent 
    ? currentPage?.components?.find(comp => comp.id === selectedComponent)
    : null;

  const handlePropertyChange = (field: string, value: any) => {
    if (!component || !currentPage) return;

    const updatedComponents = currentPage.components?.map(comp =>
      comp.id === selectedComponent
        ? {
            ...comp,
            content: { ...comp.content, [field]: value },
          }
        : comp
    ) || [];

    dispatch(updateCurrentPage({
      ...currentPage,
      components: updatedComponents,
    }));
  };

  const handleStyleChange = (field: string, value: any) => {
    if (!component || !currentPage) return;

    const updatedComponents = currentPage.components?.map(comp =>
      comp.id === selectedComponent
        ? {
            ...comp,
            style: { ...comp.style, [field]: value },
          }
        : comp
    ) || [];

    dispatch(updateCurrentPage({
      ...currentPage,
      components: updatedComponents,
    }));
  };

  const handlePositionChange = (field: string, value: any) => {
    if (!component || !currentPage) return;

    const updatedComponents = currentPage.components?.map(comp =>
      comp.id === selectedComponent
        ? {
            ...comp,
            position: { ...comp.position, [field]: value },
          }
        : comp
    ) || [];

    dispatch(updateCurrentPage({
      ...currentPage,
      components: updatedComponents,
    }));
  };

  // 渲染属性表单
  const renderPropertiesTab = () => {
    if (!component) {
      return (
        <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
          <SettingOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>请选择一个组件</div>
        </div>
      );
    }

    const { type, content, position } = component;

    return (
      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" size="small">
          {/* 基础属性 */}
          <div className="property-group">
            <div className="property-group-title">基础属性</div>
            
            <Form.Item label="组件ID">
              <Input value={component.id} disabled />
            </Form.Item>
            
            <Form.Item label="组件类型">
              <Input value={type} disabled />
            </Form.Item>
          </div>

          {/* 位置和尺寸 */}
          <div className="property-group">
            <div className="property-group-title">位置和尺寸</div>
            
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Form.Item label="X" style={{ flex: 1, marginBottom: 0 }}>
                <InputNumber
                  value={position.x}
                  onChange={(value) => handlePositionChange('x', value || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Y" style={{ flex: 1, marginBottom: 0, marginLeft: 8 }}>
                <InputNumber
                  value={position.y}
                  onChange={(value) => handlePositionChange('y', value || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Space.Compact>
            
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item label="宽度" style={{ flex: 1, marginBottom: 0 }}>
                <InputNumber
                  value={position.width}
                  onChange={(value) => handlePositionChange('width', value || 100)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="高度" style={{ flex: 1, marginBottom: 0, marginLeft: 8 }}>
                <InputNumber
                  value={position.height}
                  onChange={(value) => handlePositionChange('height', value || 100)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Space.Compact>
          </div>

          {/* 组件特定属性 */}
          <div className="property-group">
            <div className="property-group-title">内容属性</div>
            
            {(type === 'text' || type === 'title') && (
              <>
                <Form.Item label="文本内容">
                  <Input.TextArea
                    value={content.content}
                    onChange={(e) => handlePropertyChange('content', e.target.value)}
                    rows={3}
                  />
                </Form.Item>
                
                <Form.Item label="字体大小">
                  <InputNumber
                    value={content.fontSize}
                    onChange={(value) => handlePropertyChange('fontSize', value)}
                    min={8}
                    max={72}
                    addonAfter="px"
                  />
                </Form.Item>
                
                <Form.Item label="字体颜色">
                  <ColorPicker
                    value={content.color}
                    onChange={(color) => handlePropertyChange('color', color.toHexString())}
                  />
                </Form.Item>
                
                <Form.Item label="字体粗细">
                  <Select
                    value={content.fontWeight}
                    onChange={(value) => handlePropertyChange('fontWeight', value)}
                  >
                    <Option value="normal">正常</Option>
                    <Option value="bold">粗体</Option>
                    <Option value="lighter">细体</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="文本对齐">
                  <Select
                    value={content.textAlign}
                    onChange={(value) => handlePropertyChange('textAlign', value)}
                  >
                    <Option value="left">左对齐</Option>
                    <Option value="center">居中</Option>
                    <Option value="right">右对齐</Option>
                    <Option value="justify">两端对齐</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            {type === 'image' && (
              <>
                <Form.Item label="图片地址">
                  <Input
                    value={content.src}
                    onChange={(e) => handlePropertyChange('src', e.target.value)}
                    placeholder="请输入图片URL"
                  />
                </Form.Item>
                
                <Form.Item label="替代文本">
                  <Input
                    value={content.alt}
                    onChange={(e) => handlePropertyChange('alt', e.target.value)}
                  />
                </Form.Item>
                
                <Form.Item label="适应方式">
                  <Select
                    value={content.objectFit}
                    onChange={(value) => handlePropertyChange('objectFit', value)}
                  >
                    <Option value="cover">覆盖</Option>
                    <Option value="contain">包含</Option>
                    <Option value="fill">填充</Option>
                    <Option value="scale-down">缩小</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            {type === 'divider' && (
              <>
                <Form.Item label="分割线类型">
                  <Select
                    value={content.type}
                    onChange={(value) => handlePropertyChange('type', value)}
                  >
                    <Option value="horizontal">水平</Option>
                    <Option value="vertical">垂直</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="线条样式">
                  <Select
                    value={content.style}
                    onChange={(value) => handlePropertyChange('style', value)}
                  >
                    <Option value="solid">实线</Option>
                    <Option value="dashed">虚线</Option>
                    <Option value="dotted">点线</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="线条颜色">
                  <ColorPicker
                    value={content.color}
                    onChange={(color) => handlePropertyChange('color', color.toHexString())}
                  />
                </Form.Item>
                
                <Form.Item label="线条粗细">
                  <InputNumber
                    value={content.thickness}
                    onChange={(value) => handlePropertyChange('thickness', value)}
                    min={1}
                    max={10}
                    addonAfter="px"
                  />
                </Form.Item>
              </>
            )}
          </div>
        </Form>
      </div>
    );
  };

  // 渲染样式表单
  const renderStyleTab = () => {
    if (!component) {
      return (
        <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
          <BgColorsOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>请选择一个组件</div>
        </div>
      );
    }

    return (
      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" size="small">
          <div className="property-group">
            <div className="property-group-title">背景</div>
            
            <Form.Item label="背景颜色">
              <ColorPicker
                value={component.style?.backgroundColor || 'transparent'}
                onChange={(color) => handleStyleChange('backgroundColor', color.toHexString())}
              />
            </Form.Item>
          </div>

          <div className="property-group">
            <div className="property-group-title">边框</div>
            
            <Form.Item label="边框样式">
              <Select
                value={component.style?.borderStyle || 'none'}
                onChange={(value) => handleStyleChange('borderStyle', value)}
              >
                <Option value="none">无</Option>
                <Option value="solid">实线</Option>
                <Option value="dashed">虚线</Option>
                <Option value="dotted">点线</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="边框宽度">
              <InputNumber
                value={component.style?.borderWidth || 0}
                onChange={(value) => handleStyleChange('borderWidth', value)}
                min={0}
                max={20}
                addonAfter="px"
              />
            </Form.Item>
            
            <Form.Item label="边框颜色">
              <ColorPicker
                value={component.style?.borderColor || '#d9d9d9'}
                onChange={(color) => handleStyleChange('borderColor', color.toHexString())}
              />
            </Form.Item>
            
            <Form.Item label="圆角">
              <InputNumber
                value={component.style?.borderRadius || 0}
                onChange={(value) => handleStyleChange('borderRadius', value)}
                min={0}
                max={50}
                addonAfter="px"
              />
            </Form.Item>
          </div>

          <div className="property-group">
            <div className="property-group-title">阴影</div>
            
            <Form.Item label="阴影">
              <Input
                value={component.style?.boxShadow || ''}
                onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                placeholder="0 2px 8px rgba(0,0,0,0.1)"
              />
            </Form.Item>
          </div>

          <div className="property-group">
            <div className="property-group-title">透明度</div>
            
            <Form.Item label="透明度">
              <Slider
                value={component.style?.opacity || 1}
                onChange={(value) => handleStyleChange('opacity', value)}
                min={0}
                max={1}
                step={0.1}
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    );
  };

  // 渲染事件表单
  const renderEventsTab = () => {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        <ThunderboltOutlined style={{ fontSize: 24, marginBottom: 8 }} />
        <div>事件功能开发中...</div>
      </div>
    );
  };

  return (
    <div className="property-panel">
      <Tabs
        defaultActiveKey="properties"
        size="small"
        style={{ height: '100%' }}
        items={[
          {
            key: 'properties',
            label: '属性',
            children: renderPropertiesTab(),
          },
          {
            key: 'style',
            label: '样式',
            children: renderStyleTab(),
          },
          {
            key: 'events',
            label: '事件',
            children: renderEventsTab(),
          },
        ]}
      />
    </div>
  );
};

export default PropertyPanel;
