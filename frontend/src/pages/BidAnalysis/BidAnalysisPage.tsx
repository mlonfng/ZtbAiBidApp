import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Typography, Space, Alert, Progress, message, Modal, Spin, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined, FilePdfOutlined, FileWordOutlined, EyeOutlined } from '@ant-design/icons';
import { bidStepAPI } from '../../services/api';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';

import { useProjectLoader } from '../../hooks/useProjectLoader';
import { useStepProgress } from '../../hooks/useStepProgress';
import EnhancedAnalysisResult from '../../components/AnalysisResult/EnhancedAnalysisResult';

const { Text } = Typography;

const BidAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();

  // 使用步骤进度管理Hook
  const { markStepCompleted, markStepInProgress } = useStepProgress(projectId || '', 'bid-analysis');

  // 状态管理

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisType] = useState('comprehensive');


  const [analysisStatus, setAnalysisStatus] = useState<any>(null);
  const [selectedReportContent, setSelectedReportContent] = useState<string>('');
  // AI健康状态 - 移除API调用，使用默认健康状态
  const [aiHealth] = useState<{healthy:boolean, configured:boolean, base_url?:string, model?:string} | null>({ healthy: true, configured: true });


  const loadStepData = useCallback(async () => {
    if (!projectId) {
      console.error('❌ [BID_ANALYSIS] 没有项目ID，停止加载步骤数据');
      return;
    }

    try {
      // 使用Step API获取分析状态
      const statusResponse = await bidStepAPI.getStatus(projectId);

      if (statusResponse.success) {
        const stepStatus = statusResponse.data;
        const analysisCompleted = stepStatus.status === 'completed';
        
        setAnalysisStatus({ 
          analysis_completed: analysisCompleted,
          has_analysis_report: analysisCompleted,
          has_strategy_report: false,
          report_files: []
        });
        
        if (analysisCompleted) {
          markStepCompleted({ analysisStatus: stepStatus });
          try {
            const analysisResponse = await bidStepAPI.getResult(projectId);
            if (analysisResponse.success && analysisResponse.data) {
              setAnalysisResult(analysisResponse.data);
            }
          } catch (e) {
            console.error('❌ [BID_ANALYSIS] 加载分析结果失败:', e);
          }
        }
      } else {
        setAnalysisStatus({ analysis_completed: false, has_analysis_report: false, has_strategy_report: false, report_files: [] });
      }
    } catch (error: any) {
      console.error('❌ [BID_ANALYSIS] 加载分析状态失败:', error);
      setAnalysisStatus({ analysis_completed: false, has_analysis_report: false, has_strategy_report: false, report_files: [] });
    }
  }, [projectId, markStepCompleted]);

  useEffect(() => {
    if (projectId) {
      loadStepData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const startAnalysis = async () => {
    const triggerStart = async () => {
      console.log('🚀 [BID_ANALYSIS] startAnalysis 函数被调用');
      console.log('🚀 [BID_ANALYSIS] 当前projectId:', projectId);
      console.log('🚀 [BID_ANALYSIS] 当前analysisType:', analysisType);

      if (!projectId) {
        console.error('❌ [BID_ANALYSIS] 项目ID不存在');
        message.error('项目ID不存在');
        return;
      }

      try {
        console.log('🔄 [BID_ANALYSIS] 开始设置分析状态...');
        setAnalyzing(true);
        setAnalysisProgress(0);
        markStepInProgress(0);
        console.log('✅ [BID_ANALYSIS] 分析状态设置完成');

        console.log('📡 [BID_ANALYSIS] 开始调用分析API...');
        console.log('📡 [BID_ANALYSIS] API调用参数:', { projectId, analysisType });

        const response = await bidStepAPI.execute(projectId, analysisType);

        console.log('📡 [BID_ANALYSIS] API响应:', response);

        if (response.success) {
          const taskId = response.data.task_id;
          console.log('✅ [BID_ANALYSIS] 分析任务启动成功，taskId:', taskId);
          setCurrentTaskId(taskId);

          // 启动后等待进入运行态再提示成功，避免用户误以为失败
          const enteredRunning = await waitUntilRunning();
          if (enteredRunning) {
            message.success('分析任务已启动');
          } else {
            message.info('分析任务已提交，正在排队...');
          }

          // 开始监控分析进度
          console.log('🔄 [BID_ANALYSIS] 开始监控分析进度...');
          monitorAnalysisProgress(taskId);
        } else {
          console.error('❌ [BID_ANALYSIS] 分析任务启动失败:', response.message);
          message.error(response.message || '启动分析失败');
          setAnalyzing(false);
        }
      } catch (error: any) {
        console.error('❌ [BID_ANALYSIS] 启动分析异常:', error);
        console.error('❌ [BID_ANALYSIS] 错误详情:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        message.error(`启动分析失败: ${error.message || '未知错误'}`);
        setAnalyzing(false);
      }
    };

    if (analysisStatus?.analysis_completed) {
      Modal.confirm({
        title: '重新分析确认',
        content: '已检测到本项目已有分析结果。继续将重新生成分析报告并可能覆盖现有内容，是否继续？',
        okText: '重新分析',
        cancelText: '取消',
        onOk: async () => { await triggerStart(); }
      });
      return;
    }

    await triggerStart();
  };

  // 启动后先轮询到 running/进度>0 再提示
  const waitUntilRunning = async (): Promise<boolean> => {
    for (let i = 0; i < 15; i++) { // 最多等待约15秒
      try {
        const resp = await bidStepAPI.getStatus(projectId || '');
        if (resp?.success) {
          const { status, progress } = resp.data || {};
          if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
            return true;
          }
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    return false;
  };

  const monitorAnalysisProgress = async (taskId: string) => {
    const checkProgress = async () => {
      try {
        // 使用Step API获取状态
        const response = await bidStepAPI.getStatus(projectId || '');

        if (response.success) {
          const { status, progress } = response.data;

          setAnalysisProgress(progress || 0);

          if (status === 'completed') {
            setAnalyzing(false);
            // 获取分析结果
            try {
              const resultResponse = await bidStepAPI.getResult(projectId || '');
              if (resultResponse.success) {
                setAnalysisResult(resultResponse.data);
                message.success('分析完成');
                loadStepData();
                markStepCompleted({ analysisResult: resultResponse.data });
              }
            } catch (error) {
              console.error('获取分析结果失败:', error);
              message.error('获取分析结果失败');
            }
            return;
          } else if (status === 'error' || status === 'cancelled') {
            setAnalyzing(false);
            message.error('分析失败');
            return;
          }

          // 继续监控
          setTimeout(checkProgress, 2000);
        }
      } catch (error) {
        console.error('获取分析状态失败:', error);
        setAnalyzing(false);
        message.error('获取分析状态失败');
      }
    };

    checkProgress();
  };

  // 查看报告文件内容 - 移除API调用，此功能需要后端支持
  const viewReportContent = async (filename: string) => {
    message.info('查看文件内容功能需要后端API支持');
  };



  // 获取招标文件图标
  const getBidFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      return <FilePdfOutlined style={{ color: '#f5222d', fontSize: '24px' }} />;
    } else if (ext === 'docx' || ext === 'doc') {
      return <FileWordOutlined style={{ color: '#1890ff', fontSize: '24px' }} />;
    }
    return <FileTextOutlined style={{ fontSize: '24px' }} />;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const projectFiles = project?.files || [];
  const reportFiles = projectFiles.filter((file: any) => file.is_analysis_report);
  const bidFile = projectFiles.find(file => file.is_bid_candidate) || projectFiles.find(file => file.name.includes('招标')) || projectFiles[0];

  if (isProjectLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (projectError) {
    return <Result status="error" title="加载项目失败" subTitle={projectError} />;
  }

  if (!project) {
    return <Result status="warning" title="未找到项目" subTitle="请确保项目ID是否正确。" />;
  }
  // 如果有分析结果且包含有效数据，使用真实数据，否则使用模拟数据
  const hasValidAnalysisResult = analysisResult && (
    analysisResult.basic_info ||
    analysisResult.evaluation_criteria ||
    analysisResult.technical_requirements
  );

  const displayResult = hasValidAnalysisResult ? analysisResult : {
    projectName: project?.name || '项目名称',
    projectCode: 'PROJECT-001',
    bidDeadline: '2024-12-31 14:30:00',
    openingTime: '2024-12-31 15:00:00',
    budget: '待分析',
    requirements: [
      { type: '技术方案', weight: 60, description: '技术方案及实施计划' },
      { type: '商务方案', weight: 30, description: '价格方案及服务承诺' },
      { type: '资质证明', weight: 10, description: '企业资质及项目经验证明' }
    ],
    keyPoints: [
      { level: 'high', content: '请先进行招标文件分析以获取详细信息' }
    ],
    technicalRequirements: [
      '请先进行招标文件分析以获取技术要求'
    ],
    timeline: [
      { date: '待分析', event: '招标公告发布', status: 'pending' },
      { date: '待分析', event: '投标文件递交截止', status: 'pending' },
      { date: '待分析', event: '开标时间', status: 'pending' }
    ]
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <ProjectInfoHeader project={project} isLoading={isProjectLoading} onRefresh={() => projectId && dispatch(getProject(projectId))} />
      {/* AI 健康状态提示 */}
      {aiHealth && !aiHealth.healthy && (
        <Alert
          type="warning"
          showIcon
          message="AI服务不可用，生成报告可能失败"
          description={
            <div>
              <div>请检查AI配置或网络，确保已正确设置 API Key。</div>
              {aiHealth.configured === false && <div>未检测到API Key配置。</div>}
            </div>
          }
          style={{ margin: '12px 0' }}
        />
      )}

      {/* 页面顶部导航（返回/上一步/下一步） */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
        <div />
        <Space>
          <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回项目操作页面</Button>
          <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/service-mode`)}>上一步：服务模式</Button>
          <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/step/file-formatting`)} disabled={!analysisStatus?.analysis_completed}>
            下一步：投标文件初始化
          </Button>
        </Space>
      </div>

      {/* 招标文件信息卡片 */}
      <Card title="招标文件" style={{ marginBottom: 24 }}>
        {bidFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {getBidFileIcon(bidFile.name)}
            <div style={{ flex: 1 }}>
              <Text strong>{bidFile.name}</Text>
              <br />
              <Text type="secondary">
                文件大小: {formatFileSize(bidFile.size)} |
                修改时间: {new Date(bidFile.modified_time * 1000).toLocaleString()}
              </Text>
            </div>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => {
                console.log('🖱️ [BID_ANALYSIS] 开始分析按钮被点击');
                console.log('🖱️ [BID_ANALYSIS] 按钮状态检查:', {
                  analyzing,
                  analysisCompleted: analysisStatus?.analysis_completed,
                  disabled: analyzing
                });
                startAnalysis();
              }}
              disabled={analyzing}
              loading={analyzing}
            >
              {analyzing ? '分析中...' : (analysisStatus?.analysis_completed ? '重新分析' : '开始分析')}
            </Button>
          </div>
        ) : (
          <Alert
            message="未找到招标文件"
            description="项目目录中没有找到PDF或DOCX格式的招标文件"
            type="warning"
            showIcon
          />
        )}

        {analyzing && (
          <Card style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>正在分析招标文件...</Text>
              <Progress
                percent={analysisProgress}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text type="secondary">
                {analysisProgress < 30 ? 'AI正在解析文件内容...' :
                 analysisProgress < 60 ? '正在提取关键信息...' :
                 analysisProgress < 90 ? '正在生成分析报告...' :
                 '分析即将完成...'}
              </Text>
              {currentTaskId && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  任务ID: {currentTaskId}
                </Text>
              )}
            </Space>
          </Card>
        )}
      </Card>

      {/* 分析报告文件卡片 */}
      {reportFiles.length > 0 && (
        <Card title="分析报告文件" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {reportFiles.map((file, index) => (
              <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileTextOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                    <div>
                      <Text strong>{file.name}</Text>
                      <br />
                      <Text type="secondary">
                        {formatFileSize(file.size)} | {new Date(file.modified_time * 1000).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => viewReportContent(file.name)}
                  >
                    查看内容
                  </Button>
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* 报告内容显示 */}
      {selectedReportContent && (
        <Card title="报告内容" style={{ marginBottom: 24 }}>
          <div style={{
            maxHeight: '400px',
            overflow: 'auto',
            backgroundColor: '#fafafa',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #d9d9d9'
          }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
              {selectedReportContent}
            </pre>
          </div>
        </Card>
      )}

      {/* 分析结果展示 - 使用增强组件 */}
      {(hasValidAnalysisResult || analysisStatus?.analysis_completed) && (
        <EnhancedAnalysisResult
          data={hasValidAnalysisResult ? analysisResult : displayResult}
          loading={analyzing}
        />
      )}


      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="bid-analysis"
        canProceed={analysisStatus?.analysis_completed || false}
        strictMode={true}
      />
    </div>
  );
};

export default BidAnalysisPage;
