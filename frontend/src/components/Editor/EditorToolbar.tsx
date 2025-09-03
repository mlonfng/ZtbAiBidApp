import React from 'react';
import { 
  Space, 
  Button, 
  Divider, 
  Select, 
  InputNumber, 
  Tooltip, 
  Dropdown,
  Typography 
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  CodeOutlined,
  EditOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  BorderOutlined,
  TableOutlined,
  LineOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoreOutlined,
  ExportOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
import { 
  setEditMode, 
  setZoomLevel, 
  zoomIn, 
  zoomOut, 
  resetZoom,
  toggleGrid,
  toggleRuler,
  toggleGuides,
  // updateEditorLayout
} from '../../store/slices/uiSlice';
import { Project } from '../../store/slices/projectSlice';

const { Text } = Typography;
const { Option } = Select;

interface EditorToolbarProps {
  project: Project;
  onLayoutChange: (changes: any) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ project, onLayoutChange }) => {
  const dispatch = useAppDispatch();
  
  const { 
    editMode, 
    zoomLevel, 
    showGrid, 
    showRuler, 
    showGuides,
    editorLayout 
  } = useAppSelector(state => state.ui);

  const handleEditModeChange = (mode: 'design' | 'preview' | 'code') => {
    dispatch(setEditMode(mode));
  };

  const handleZoomChange = (value: number | null) => {
    if (value) {
      dispatch(setZoomLevel(value));
    }
  };

  const handleSave = () => {
    // 保存项目
    console.log('保存项目');
  };

  const handleUndo = () => {
    // 撤销操作
    console.log('撤销');
  };

  const handleRedo = () => {
    // 重做操作
    console.log('重做');
  };

  const handleExport = () => {
    // 导出项目
    console.log('导出项目');
  };

  const handleShare = () => {
    // 分享项目
    console.log('分享项目');
  };

  const moreMenuItems = [
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: '导出项目',
      onClick: handleExport,
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: '分享项目',
      onClick: handleShare,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'settings',
      label: '编辑器设置',
    },
  ];

  return (
    <div className="editor-toolbar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 左侧工具组 */}
        <Space split={<Divider type="vertical" />}>
          {/* 面板控制 */}
          <Space>
            <Tooltip title={editorLayout.leftPanelCollapsed ? '显示左侧面板' : '隐藏左侧面板'}>
              <Button
                type="text"
                size="small"
                icon={<MenuUnfoldOutlined />}
                onClick={() => onLayoutChange({ 
                  leftPanelCollapsed: !editorLayout.leftPanelCollapsed 
                })}
              />
            </Tooltip>
            <Tooltip title={editorLayout.rightPanelCollapsed ? '显示右侧面板' : '隐藏右侧面板'}>
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined />}
                onClick={() => onLayoutChange({ 
                  rightPanelCollapsed: !editorLayout.rightPanelCollapsed 
                })}
              />
            </Tooltip>
          </Space>

          {/* 文件操作 */}
          <Space>
            <Tooltip title="保存 (Ctrl+S)">
              <Button
                type="text"
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSave}
              />
            </Tooltip>
            <Tooltip title="撤销 (Ctrl+Z)">
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={handleUndo}
                disabled={true} // TODO: 实现撤销逻辑
              />
            </Tooltip>
            <Tooltip title="重做 (Ctrl+Y)">
              <Button
                type="text"
                size="small"
                icon={<RedoOutlined />}
                onClick={handleRedo}
                disabled={true} // TODO: 实现重做逻辑
              />
            </Tooltip>
          </Space>

          {/* 编辑模式 */}
          <Space>
            <Button.Group size="small">
              <Button
                type={editMode === 'design' ? 'primary' : 'default'}
                icon={<EditOutlined />}
                onClick={() => handleEditModeChange('design')}
              >
                设计
              </Button>
              <Button
                type={editMode === 'preview' ? 'primary' : 'default'}
                icon={<EyeOutlined />}
                onClick={() => handleEditModeChange('preview')}
              >
                预览
              </Button>
              <Button
                type={editMode === 'code' ? 'primary' : 'default'}
                icon={<CodeOutlined />}
                onClick={() => handleEditModeChange('code')}
              >
                代码
              </Button>
            </Button.Group>
          </Space>

          {/* 视图控制 */}
          <Space>
            <Tooltip title="缩小">
              <Button
                type="text"
                size="small"
                icon={<ZoomOutOutlined />}
                onClick={() => dispatch(zoomOut())}
                disabled={zoomLevel <= 10}
              />
            </Tooltip>
            <InputNumber
              size="small"
              min={10}
              max={500}
              value={zoomLevel}
              onChange={handleZoomChange}
              formatter={value => `${value}%`}
              parser={value => parseInt(value?.replace('%', '') || '100')}
              style={{ width: 80 }}
            />
            <Tooltip title="放大">
              <Button
                type="text"
                size="small"
                icon={<ZoomInOutlined />}
                onClick={() => dispatch(zoomIn())}
                disabled={zoomLevel >= 500}
              />
            </Tooltip>
            <Tooltip title="重置缩放">
              <Button
                type="text"
                size="small"
                onClick={() => dispatch(resetZoom())}
              >
                1:1
              </Button>
            </Tooltip>
          </Space>

          {/* 辅助工具 */}
          <Space>
            <Tooltip title="网格">
              <Button
                type={showGrid ? 'primary' : 'text'}
                size="small"
                icon={<BorderOutlined />}
                onClick={() => dispatch(toggleGrid())}
              />
            </Tooltip>
            <Tooltip title="标尺">
              <Button
                type={showRuler ? 'primary' : 'text'}
                size="small"
                icon={<TableOutlined />}
                onClick={() => dispatch(toggleRuler())}
              />
            </Tooltip>
            <Tooltip title="辅助线">
              <Button
                type={showGuides ? 'primary' : 'text'}
                size="small"
                icon={<LineOutlined />}
                onClick={() => dispatch(toggleGuides())}
              />
            </Tooltip>
          </Space>
        </Space>

        {/* 中间项目信息 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            {project.name}
          </Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            {project.status === 'draft' ? '草稿' : 
             project.status === 'in_progress' ? '进行中' : 
             project.status === 'completed' ? '已完成' : '未知状态'}
          </Text>
        </div>

        {/* 右侧操作组 */}
        <Space>
          <Dropdown
            menu={{ items: moreMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
            />
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default EditorToolbar;
