import React, { useEffect, useState } from 'react';
import { Card, Button, Progress, Steps, Tag, Space, message, Modal, Descriptions } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAppDispatch } from '../../store';
import { fetchProjectProgress, updateStepProgress } from '../../store/slices/projectSlice';

interface ProjectProgressManagerProps {
  projectId: string;
  onStepChange?: (stepKey: string) => void;
}

const ProjectProgressManager: React.FC<ProjectProgressManagerProps> = ({
  projectId,
  onStepChange
}) => {
  const dispatch = useAppDispatch();
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 加载项目进展数据
  const loadProgress = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchProjectProgress(projectId)).unwrap();
      setProgressData(result);
    } catch (error) {
      message.error('加载项目进展失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProgress();
    }
  }, [projectId]);

  // 标记步骤为完成
  const markStepCompleted = async (stepKey: string) => {
    try {
      await dispatch(updateStepProgress({
        projectId,
        stepKey,
        status: 'completed',
        progress: 100
      })).unwrap();
      
      message.success('步骤已标记为完成');
      loadProgress(); // 重新加载进展
      
      // 通知父组件步骤变化
      if (onStepChange) {
        const nextStep = getNextStep(stepKey);
        if (nextStep) {
          onStepChange(nextStep);
        }
      }
    } catch (error) {
      message.error('更新步骤状态失败');
    }
  };

  // 重置项目进展
  const resetProgress = async () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置项目进展吗？这将清除所有步骤的完成状态。',
      onOk: async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/progress/reset`, {
            method: 'POST'
          });
          const result = await response.json();
          
          if (result.success) {
            message.success('项目进展已重置');
            loadProgress();
            if (onStepChange) {
              onStepChange('service-mode');
            }
          } else {
            message.error(result.message || '重置失败');
          }
        } catch (error) {
          message.error('重置项目进展失败');
        }
      }
    });
  };

  // 获取下一步
  const getNextStep = (currentStep: string) => {
    const stepOrder = [
      'service-mode', 'bid-analysis', 'file-formatting',
      'material-management', 'framework-generation', 
      'content-generation', 'format-config', 'document-export'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    return null;
  };

  // 获取步骤状态颜色
  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'pending': return 'default';
      case 'skipped': return 'warning';
      default: return 'default';
    }
  };

  // 获取步骤状态文本
  const getStepStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'pending': return '待开始';
      case 'skipped': return '已跳过';
      default: return '未知';
    }
  };

  if (!progressData) {
    return (
      <Card title="项目进展管理" loading={loading}>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          暂无进展数据
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card 
        title="项目进展管理" 
        loading={loading}
        extra={
          <Space>
            <Button 
              icon={<InfoCircleOutlined />}
              onClick={() => setDetailModalVisible(true)}
            >
              详情
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadProgress}
            >
              刷新
            </Button>
            <Button 
              danger
              icon={<ReloadOutlined />}
              onClick={resetProgress}
            >
              重置进展
            </Button>
          </Space>
        }
      >
        {/* 总体进度 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>总体进度</span>
            <span>{progressData.total_progress}%</span>
          </div>
          <Progress 
            percent={progressData.total_progress} 
            status={progressData.total_progress === 100 ? 'success' : 'active'}
          />
        </div>

        {/* 当前步骤信息 */}
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>当前步骤：</strong>
              {progressData.steps.find((s: any) => s.step_key === progressData.current_step)?.step_name || '未知'}
            </div>
            <Tag color={getStepStatusColor(
              progressData.steps.find((s: any) => s.step_key === progressData.current_step)?.status || 'pending'
            )}>
              {getStepStatusText(
                progressData.steps.find((s: any) => s.step_key === progressData.current_step)?.status || 'pending'
              )}
            </Tag>
          </div>
          {progressData.next_step && (
            <div style={{ marginTop: 8, color: '#666' }}>
              <strong>下一步：</strong>
              {progressData.steps.find((s: any) => s.step_key === progressData.next_step)?.step_name || '未知'}
            </div>
          )}
        </div>

        {/* 步骤列表 */}
        <div>
          <h4>步骤详情</h4>
          <Steps
            direction="vertical"
            size="small"
            current={progressData.steps.findIndex((s: any) => s.step_key === progressData.current_step)}
            items={progressData.steps.map((step: any, index: number) => ({
              title: step.step_name,
              description: (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={getStepStatusColor(step.status)}>
                      {getStepStatusText(step.status)}
                    </Tag>
                    <span style={{ marginLeft: 8 }}>进度: {step.progress}%</span>
                  </div>
                  {step.status !== 'completed' && step.status !== 'skipped' && (
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => markStepCompleted(step.step_key)}
                    >
                      标记为完成
                    </Button>
                  )}
                </div>
              ),
              status: step.status === 'completed' ? 'finish' : 
                     step.status === 'in_progress' ? 'process' : 'wait',
              icon: step.status === 'completed' ? <CheckCircleOutlined /> : 
                    step.status === 'in_progress' ? <ClockCircleOutlined /> : undefined
            }))}
          />
        </div>
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="项目进展详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="项目ID">{progressData.project_id}</Descriptions.Item>
          <Descriptions.Item label="项目状态">{progressData.project_status}</Descriptions.Item>
          <Descriptions.Item label="当前步骤">{progressData.current_step}</Descriptions.Item>
          <Descriptions.Item label="下一步骤">{progressData.next_step || '无'}</Descriptions.Item>
          <Descriptions.Item label="总体进度" span={2}>
            <Progress percent={progressData.total_progress} size="small" />
          </Descriptions.Item>
        </Descriptions>
        
        <div style={{ marginTop: 16 }}>
          <h4>步骤详情</h4>
          {progressData.steps.map((step: any, index: number) => (
            <Card key={step.step_key} size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{step.step_name}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {step.started_at && `开始时间: ${new Date(step.started_at).toLocaleString()}`}
                    {step.completed_at && ` | 完成时间: ${new Date(step.completed_at).toLocaleString()}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={getStepStatusColor(step.status)}>
                    {getStepStatusText(step.status)}
                  </Tag>
                  <div style={{ fontSize: 12 }}>
                    <Progress percent={step.progress} size="small" showInfo={false} />
                    {step.progress}%
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ProjectProgressManager;
