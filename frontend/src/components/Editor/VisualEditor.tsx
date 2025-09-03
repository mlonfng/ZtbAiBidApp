import React, { useEffect, useRef } from 'react';
import { Layout, Spin } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedComponent, updateEditorLayout } from '../../store/slices/uiSlice';
import { getProject } from '../../store/slices/projectSlice';

import EditorToolbar from './EditorToolbar';
import ComponentLibrary from './ComponentLibrary';
import EditorCanvas from './EditorCanvas';
import PropertyPanel from './PropertyPanel';
import PageTree from './PageTree';

const { Sider, Content } = Layout;

interface VisualEditorProps {
  projectId: string;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);

  const { currentProject, loading, error } = useAppSelector(state => state.project);
  const {
    editorLayout,
    selectedComponent,
    editMode,
    zoomLevel,
    showGrid,
    showRuler,
    showGuides
  } = useAppSelector(state => state.ui);

  useEffect(() => {
    console.log('🔍 [DEBUG] VisualEditor useEffect - projectId:', projectId, 'currentProject:', currentProject);
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      console.log('🔍 [DEBUG] VisualEditor dispatching getProject for:', projectId);
      dispatch(getProject(projectId));
    }
  }, [projectId, currentProject, dispatch]);

  const handleLayoutChange = (changes: Partial<typeof editorLayout>) => {
    dispatch(updateEditorLayout(changes));
  };

  const handleComponentSelect = (componentId: string | null) => {
    dispatch(setSelectedComponent(componentId));
  };

  if (loading) {
    console.log('🔍 [DEBUG] VisualEditor showing loading state');
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" tip={`加载项目中... (ID: ${projectId})`} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ color: 'red', marginBottom: '10px', fontSize: '16px' }}>
          项目加载失败
        </div>
        <div style={{ color: '#666', marginBottom: '20px' }}>
          项目ID: {projectId}
        </div>
        <div style={{ color: '#999', fontSize: '14px' }}>
          错误信息: {error}
        </div>
        <button
          onClick={() => dispatch(getProject(projectId))}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!currentProject) {
    console.warn('🔍 [DEBUG] VisualEditor - no currentProject but no error, projectId:', projectId);
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '10px', fontSize: '16px' }}>
          项目不存在
        </div>
        <div style={{ color: '#666', marginBottom: '20px' }}>
          项目ID: {projectId}
        </div>
        <button
          onClick={() => dispatch(getProject(projectId))}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        ref={containerRef}
        className="editor-container"
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 工具栏 */}
        <EditorToolbar 
          project={currentProject}
          onLayoutChange={handleLayoutChange}
        />

        {/* 主编辑区域 */}
        <Layout style={{ flex: 1, overflow: 'hidden' }}>
          {/* 左侧面板 */}
          {!editorLayout.leftPanelCollapsed && (
            <Sider
              width={editorLayout.leftPanelWidth}
              style={{
                background: '#fafafa',
                borderRight: '1px solid #f0f0f0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              theme="light"
            >
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* 页面树 */}
                <div style={{ 
                  height: '40%', 
                  borderBottom: '1px solid #f0f0f0',
                  overflow: 'auto'
                }}>
                  <PageTree 
                    project={currentProject}
                    onPageSelect={(pageId) => {
                      // 处理页面选择
                    }}
                  />
                </div>

                {/* 组件库 */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <ComponentLibrary />
                </div>
              </div>
            </Sider>
          )}

          {/* 中央画布区域 */}
          <Content style={{ 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#f5f5f5'
          }}>
            <EditorCanvas
              project={currentProject}
              selectedComponent={selectedComponent}
              editMode={editMode}
              zoomLevel={zoomLevel}
              showGrid={showGrid}
              showRuler={showRuler}
              showGuides={showGuides}
              onComponentSelect={handleComponentSelect}
            />
          </Content>

          {/* 右侧属性面板 */}
          {!editorLayout.rightPanelCollapsed && (
            <Sider
              width={editorLayout.rightPanelWidth}
              style={{
                background: '#fafafa',
                borderLeft: '1px solid #f0f0f0',
                overflow: 'auto',
              }}
              theme="light"
            >
              <PropertyPanel 
                selectedComponent={selectedComponent}
                project={currentProject}
              />
            </Sider>
          )}
        </Layout>
      </div>
    </DndProvider>
  );
};

export default VisualEditor;
