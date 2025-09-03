import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Typography, Table, Image, Divider } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ComponentData {
  id: string;
  type: string;
  title: string;
  content: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: any;
  properties?: any;
}

interface CanvasComponentProps {
  component: ComponentData;
  selected: boolean;
  editMode: 'design' | 'preview' | 'code';
  showGuides: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ComponentData>) => void;
  onDelete: () => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component,
  selected,
  editMode,
  showGuides,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (editMode !== 'design') return;
    
    e.stopPropagation();
    onSelect();

    if (e.target === componentRef.current || componentRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y,
      });
    }
  }, [editMode, onSelect, component.position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || editMode !== 'design') return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    onUpdate({
      position: {
        ...component.position,
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      },
    });
  }, [isDragging, editMode, dragStart, component.position, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (editMode !== 'design') return;
    e.stopPropagation();
    setIsEditing(true);
  }, [editMode]);

  const handleContentChange = useCallback((newContent: any) => {
    onUpdate({
      content: { ...component.content, ...newContent },
    });
  }, [component.content, onUpdate]);

  const handleEditComplete = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 渲染不同类型的组件
  const renderComponent = () => {
    const { type, content } = component;

    switch (type) {
      case 'text':
        return isEditing ? (
          <TextArea
            value={content.content}
            onChange={(e) => handleContentChange({ content: e.target.value })}
            onBlur={handleEditComplete}
            onPressEnter={handleEditComplete}
            autoFocus
            style={{
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              fontSize: content.fontSize,
              color: content.color,
              fontWeight: content.fontWeight,
              textAlign: content.textAlign,
            }}
          />
        ) : (
          <Text
            style={{
              fontSize: content.fontSize,
              color: content.color,
              fontWeight: content.fontWeight,
              textAlign: content.textAlign,
              display: 'block',
              width: '100%',
              height: '100%',
            }}
          >
            {content.content}
          </Text>
        );

      case 'title':
        return isEditing ? (
          <Input
            value={content.content}
            onChange={(e) => handleContentChange({ content: e.target.value })}
            onBlur={handleEditComplete}
            onPressEnter={handleEditComplete}
            autoFocus
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: content.fontSize,
              color: content.color,
              fontWeight: content.fontWeight,
              textAlign: content.textAlign,
            }}
          />
        ) : (
          <Title
            level={content.level}
            style={{
              fontSize: content.fontSize,
              color: content.color,
              fontWeight: content.fontWeight,
              textAlign: content.textAlign,
              margin: 0,
            }}
          >
            {content.content}
          </Title>
        );

      case 'image':
        return (
          <Image
            src={content.src || 'https://via.placeholder.com/200x150?text=图片'}
            alt={content.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: content.objectFit,
            }}
            preview={editMode === 'preview'}
          />
        );

      case 'table':
        return (
          <Table
            columns={content.columns}
            dataSource={content.dataSource}
            pagination={false}
            bordered={content.bordered}
            size={content.size}
            style={{ width: '100%' }}
          />
        );

      case 'divider':
        return (
          <Divider
            type={content.type}
            style={{
              borderColor: content.color,
              borderWidth: content.thickness,
              borderStyle: content.style,
              margin: 0,
            }}
          />
        );

      default:
        return (
          <div style={{ 
            padding: 16, 
            background: '#f5f5f5', 
            border: '1px dashed #d9d9d9',
            textAlign: 'center',
            color: '#999'
          }}>
            未知组件类型: {type}
          </div>
        );
    }
  };

  const componentStyle: React.CSSProperties = {
    position: 'absolute',
    left: component.position.x,
    top: component.position.y,
    width: component.position.width,
    height: component.position.height,
    border: selected && editMode === 'design' ? '2px solid #1890ff' : '1px solid transparent',
    borderRadius: 4,
    cursor: editMode === 'design' ? (isDragging ? 'grabbing' : 'grab') : 'default',
    background: selected && editMode === 'design' ? 'rgba(24, 144, 255, 0.05)' : 'transparent',
    overflow: 'hidden',
    ...component.style,
  };

  return (
    <div
      ref={componentRef}
      className={`canvas-component ${selected ? 'selected' : ''}`}
      style={componentStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* 组件内容 */}
      <div style={{ width: '100%', height: '100%', padding: 4 }}>
        {renderComponent()}
      </div>

      {/* 选中状态的控制点 */}
      {selected && editMode === 'design' && (
        <>
          {/* 删除按钮 */}
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              zIndex: 1001,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />

          {/* 编辑按钮 */}
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            style={{
              position: 'absolute',
              top: -8,
              right: 24,
              zIndex: 1001,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          />

          {/* 调整大小的控制点 */}
          <div
            className="canvas-component-handle se"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              background: '#1890ff',
              border: '1px solid #fff',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 1001,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
            }}
          />
        </>
      )}

      {/* 辅助线 */}
      {showGuides && selected && editMode === 'design' && (
        <>
          <div
            style={{
              position: 'absolute',
              top: -1000,
              left: '50%',
              width: 1,
              height: 2000,
              background: '#ff4d4f',
              opacity: 0.5,
              pointerEvents: 'none',
              zIndex: 999,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: -1000,
              width: 2000,
              height: 1,
              background: '#ff4d4f',
              opacity: 0.5,
              pointerEvents: 'none',
              zIndex: 999,
            }}
          />
        </>
      )}
    </div>
  );
};

export default CanvasComponent;
