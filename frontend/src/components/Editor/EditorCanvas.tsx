import React, { useRef, useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { Card, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
// import { setSelectedComponent } from '../../store/slices/uiSlice';
import { updateCurrentPage } from '../../store/slices/projectSlice';
import { Project } from '../../store/slices/projectSlice';

import CanvasComponent from './CanvasComponent';
import CanvasRuler from './CanvasRuler';

interface EditorCanvasProps {
  project: Project;
  selectedComponent: string | null;
  editMode: 'design' | 'preview' | 'code';
  zoomLevel: number;
  showGrid: boolean;
  showRuler: boolean;
  showGuides: boolean;
  onComponentSelect: (componentId: string | null) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  project,
  selectedComponent,
  editMode,
  zoomLevel,
  showGrid,
  showRuler,
  showGuides,
  onComponentSelect,
}) => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const { currentPage } = useAppSelector(state => state.project);

  // 拖拽放置处理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'component',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = (offset.x - canvasRect.left) / (zoomLevel / 100);
        const y = (offset.y - canvasRect.top) / (zoomLevel / 100);
        
        handleAddComponent(item.componentType, { x, y }, item.defaultProps);
      }
      
      setDragPosition(null);
    },
    hover: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = (offset.x - canvasRect.left) / (zoomLevel / 100);
        const y = (offset.y - canvasRect.top) / (zoomLevel / 100);
        setDragPosition({ x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleAddComponent = useCallback((componentType: string, position: { x: number; y: number }, defaultProps: any) => {
    if (!currentPage) return;

    const newComponent = {
      id: `component_${Date.now()}`,
      type: componentType,
      title: defaultProps.content || defaultProps.name || '新组件',
      content: defaultProps,
      position: {
        x: Math.max(0, position.x),
        y: Math.max(0, position.y),
        width: defaultProps.width || 200,
        height: defaultProps.height || 100,
      },
      style: {},
      properties: defaultProps,
    };

    const updatedComponents = [...(currentPage.components || []), newComponent];
    
    dispatch(updateCurrentPage({
      ...currentPage,
      components: updatedComponents,
    }));

    // 选中新添加的组件
    onComponentSelect(newComponent.id);
  }, [currentPage, dispatch, onComponentSelect]);

  const handleComponentUpdate = useCallback((componentId: string, updates: any) => {
    if (!currentPage) return;

    const updatedComponents = currentPage.components?.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    ) || [];

    dispatch(updateCurrentPage({
      ...currentPage,
      components: updatedComponents,
    }));
  }, [currentPage, dispatch]);

  const handleComponentDelete = useCallback((componentId: string) => {
    if (!currentPage) return;

    const updatedComponents = currentPage.components?.filter(comp => comp.id !== componentId) || [];
    
    dispatch(updateCurrentPage({
      ...currentPage,
      components: updatedComponents,
    }));

    if (selectedComponent === componentId) {
      onComponentSelect(null);
    }
  }, [currentPage, dispatch, selectedComponent, onComponentSelect]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 点击空白区域取消选择
    if (e.target === e.currentTarget) {
      onComponentSelect(null);
    }
  }, [onComponentSelect]);

  // 计算画布样式
  const canvasStyle: React.CSSProperties = {
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: 'top left',
    width: `${100 / (zoomLevel / 100)}%`,
    height: `${100 / (zoomLevel / 100)}%`,
    minHeight: 800,
    background: showGrid ? 
      `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
       linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)` : 
      '#fff',
    backgroundSize: showGrid ? '20px 20px' : 'auto',
    position: 'relative',
    cursor: editMode === 'design' ? 'default' : 'not-allowed',
  };

  const components = currentPage?.components || [];

  return (
    <div style={{ 
      flex: 1, 
      overflow: 'auto', 
      position: 'relative',
      background: '#f5f5f5'
    }}>
      {/* 标尺 */}
      {showRuler && (
        <>
          <CanvasRuler direction="horizontal" zoomLevel={zoomLevel} />
          <CanvasRuler direction="vertical" zoomLevel={zoomLevel} />
        </>
      )}

      {/* 画布容器 */}
      <div
        ref={(node) => {
          if (canvasRef.current !== node) { (canvasRef as any).current = node; }
          drop(node);
        }}
        style={{
          padding: showRuler ? '20px 0 0 20px' : 0,
          height: '100%',
          overflow: 'auto',
        }}
      >
        {/* 画布 */}
        <div
          className="canvas-container"
          style={canvasStyle}
          onClick={handleCanvasClick}
        >
          {/* 拖拽预览 */}
          {isOver && canDrop && dragPosition && (
            <div
              style={{
                position: 'absolute',
                left: dragPosition.x,
                top: dragPosition.y,
                width: 200,
                height: 100,
                border: '2px dashed #1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                borderRadius: 4,
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            />
          )}

          {/* 组件渲染 */}
          {components.map((component) => (
            <CanvasComponent
              key={component.id}
              component={component}
              selected={selectedComponent === component.id}
              editMode={editMode}
              showGuides={showGuides}
              onSelect={() => onComponentSelect(component.id)}
              onUpdate={(updates) => handleComponentUpdate(component.id, updates)}
              onDelete={() => handleComponentDelete(component.id)}
            />
          ))}

          {/* 空状态 */}
          {components.length === 0 && editMode === 'design' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#999',
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <div>从左侧组件库拖拽组件到此处开始设计</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#ccc' }}>
                      或点击下方按钮添加组件
                    </div>
                  </div>
                }
              >
                <Card
                  style={{
                    width: 200,
                    height: 120,
                    border: '2px dashed #d9d9d9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  styles={{ body: {
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                   }}}
                  onClick={() => {
                    // 添加默认文本组件
                    handleAddComponent('text', { x: 100, y: 100 }, {
                      content: '点击编辑文本',
                      fontSize: 14,
                      color: '#000000',
                    });
                  }}
                >
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                    <div>添加文本</div>
                  </div>
                </Card>
              </Empty>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
