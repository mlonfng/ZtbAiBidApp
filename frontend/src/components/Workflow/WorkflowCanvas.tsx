import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

interface WorkflowCanvasProps {
  workflowId: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onNodeClick?: (node: WorkflowNode) => void;
  onNodeUpdate?: (node: WorkflowNode) => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflowId,
  nodes,
  connections,
  onNodeClick,
  onNodeUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 绘制工作流画布
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置变换
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 绘制网格
    drawGrid(ctx, canvas.width, canvas.height);

    // 绘制连接线
    connections.forEach(connection => {
      drawConnection(ctx, connection);
    });

    // 绘制节点
    nodes.forEach(node => {
      drawNode(ctx, node);
    });

    ctx.restore();
  };

  // 绘制网格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // 绘制节点
  const drawNode = (ctx: CanvasRenderingContext2D, node: WorkflowNode) => {
    const { x, y, width, height, name, status } = node;

    // 节点背景色
    const statusColors = {
      pending: '#f0f0f0',
      running: '#1890ff',
      completed: '#52c41a',
      failed: '#ff4d4f',
    };

    // 绘制节点矩形
    ctx.fillStyle = statusColors[status];
    ctx.fillRect(x, y, width, height);

    // 绘制边框
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 绘制文本
    ctx.fillStyle = status === 'pending' ? '#000' : '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + width / 2, y + height / 2);

    // 绘制状态指示器
    const indicatorSize = 8;
    ctx.fillStyle = statusColors[status];
    ctx.fillRect(x + width - indicatorSize - 4, y + 4, indicatorSize, indicatorSize);
  };

  // 绘制连接线
  const drawConnection = (ctx: CanvasRenderingContext2D, connection: WorkflowConnection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) return;

    const fromX = fromNode.x + fromNode.width;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x;
    const toY = toNode.y + toNode.height / 2;

    // 绘制连接线
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // 绘制箭头
    const arrowSize = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.fillStyle = '#1890ff';
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // 工作流控制
  const handlePlay = () => {
    message.info('开始执行工作流');
  };

  const handlePause = () => {
    message.info('暂停工作流');
  };

  const handleStop = () => {
    message.info('停止工作流');
  };

  // 重绘画布
  useEffect(() => {
    drawCanvas();
  }, [nodes, connections, scale, offset]);

  // 设置画布大小
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawCanvas();
  }, []);

  return (
    <Card
      title="工作流画布"
      extra={
        <Space>
          <Button icon={<PlayCircleOutlined />} onClick={handlePlay}>
            执行
          </Button>
          <Button icon={<PauseCircleOutlined />} onClick={handlePause}>
            暂停
          </Button>
          <Button icon={<StopOutlined />} onClick={handleStop}>
            停止
          </Button>
          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          <Button icon={<FullscreenOutlined />} onClick={handleResetView}>
            重置
          </Button>
        </Space>
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: 0, height: 'calc(100% - 57px)'  }}}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* 状态信息 */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 12px',
          borderRadius: 4,
          fontSize: 12,
        }}>
          <Text>缩放: {Math.round(scale * 100)}%</Text>
          <br />
          <Text>节点: {nodes.length}</Text>
        </div>
      </div>
    </Card>
  );
};

export default WorkflowCanvas;
