import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { fetchProjectProgress } from '../../store/slices/projectSlice';

import ProjectWorkflowSteps from '../../components/Project/ProjectWorkflowSteps';

const ProjectWorkflowStepPage: React.FC = () => {
  const { projectId, stepKey } = useParams<{ projectId: string; stepKey: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [smartNavigation, setSmartNavigation] = useState(false);

  // 智能导航：根据项目进展自动跳转到正确步骤
  useEffect(() => {
    if (!projectId || stepKey || smartNavigation) return;

    const loadProjectProgress = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchProjectProgress(projectId)).unwrap();

        // 确定应该跳转到的步骤
        let targetStep = result.current_step || 'service-mode';

        // 如果有下一步且当前步骤已完成，跳转到下一步
        if (result.next_step) {
          const currentStepData = result.steps.find((s: any) => s.step_key === result.current_step);
          if (currentStepData && currentStepData.status === 'completed') {
            targetStep = result.next_step;
          }
        }

        console.log(`🚀 智能导航：项目 ${projectId} 应该跳转到步骤 ${targetStep}`);
        setSmartNavigation(true);
        navigate(`/projects/${projectId}/step/${targetStep}`, { replace: true });

      } catch (error) {
        console.error('获取项目进展失败:', error);
        message.error('获取项目进展失败，跳转到第一步');
        setSmartNavigation(true);
        navigate(`/projects/${projectId}/step/service-mode`, { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadProjectProgress();
  }, [projectId, stepKey, dispatch, navigate, smartNavigation]);

  if (!projectId) {
    return (
      <Result
        status="404"
        title="页面不存在"
        subTitle="请检查项目ID是否正确"
        extra={
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
          >
            返回项目列表
          </Button>
        }
      />
    );
  }

  // 如果没有指定步骤且正在加载，显示加载状态
  if (!stepKey && loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          正在分析项目进展，即将跳转到合适的步骤...
        </div>
      </div>
    );
  }

  // 如果没有指定步骤且未开始智能导航，返回null等待导航
  if (!stepKey) {
    return null;
  }

  return <ProjectWorkflowSteps projectId={projectId} currentStep={stepKey} />;
};

export default ProjectWorkflowStepPage;
