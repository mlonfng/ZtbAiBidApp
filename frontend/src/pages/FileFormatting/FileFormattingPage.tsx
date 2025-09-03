import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Typography, Space, Alert, Select, Progress, List, Table, Tag, Tabs, Descriptions, Steps, message, Spin, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined, FilePdfOutlined, FileWordOutlined, Html5Outlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { exportStepAPI } from '../../services/api';
import ProjectStepNavigation from '../../components/Project/ProjectStepNavigation';
import { useStepProgress } from '../../hooks/useStepProgress';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ProjectInfoHeader from '../../components/Project/ProjectInfoHeader';
import { useAppDispatch } from '../../store';
import { getProject } from '../../store/slices/projectSlice';


const { Title, Text } = Typography;
const { Option } = Select;

const FileFormattingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, project, isLoading: isProjectLoading, error: projectError } = useProjectLoader();

  // 统一步骤进度（回写后端 project_progress）
  const { markStepInProgress, markStepCompleted, markStepError, updateProgress } = useStepProgress(projectId || '', 'file-formatting');

  // 顶部统一状态条
  // 注：如需更简洁可复用你在其他页面的 Alert 组件封装

  // 对齐 BidAnalysis 的状态组织
  const [formatResult, setFormatResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending'|'in_progress'|'running'|'completed'|'error'|'cancelled'>('pending');
  const [targetFormat, setTargetFormat] = useState('html');
  const [currentStep, setCurrentStep] = useState(0);


  const [selectedBidIndex, setSelectedBidIndex] = useState<number>(0);

  // 关键字优先匹配，提高招标/投标等命名文件的优先级
  const bidKeywords = useMemo(() => ['招标', '投标', 'tender', 'bid', '采购'].map(s => s.toLowerCase()), []);

  // 后端已提供 is_bid_candidate 与 relative_path，这里进一步排序；若后端不可用则回退到扩展名判断
  const bidCandidates = useMemo(() => {
    const projectFiles = project?.files || [];
    const files = projectFiles.filter((f: any) => {
      const ext = (f.extension || '').toLowerCase();
      return (f.is_bid_candidate || ['.pdf', '.docx', '.doc'].includes(ext)) && !f.is_analysis_report;
    });
    const score = (f: any) => {
      const name = (f.name || '').toLowerCase();
      let s = 0;
      for (const kw of bidKeywords) if (name.includes(kw)) s += 2;
      const rel = (f.relative_path || f.name || '');
      if (rel.indexOf('/') === -1 && rel.indexOf('\\') === -1) s += 1; // 顶层文件加分
      return s;
    };
    return files.sort((a: any, b: any) => {
      const sa = score(a), sb = score(b);
      if (sb !== sa) return sb - sa;
      const ma = a.modified_time || 0, mb = b.modified_time || 0;
      return mb - ma;
    });
  }, [project, bidKeywords]);

  const bidFile = bidCandidates[selectedBidIndex] || null;

  // 生成绝对路径（Windows/Unix均可），用作打开文件/目录
  const toAbsPath = (rel?: string | null) => {
    const base = project?.project_path as string | undefined;
    if (!base || !rel) return null;
    const sep = base.includes('\\') ? '\\' : '/';
    const normRel = String(rel).replace(/[\\/]/g, sep);
    return base.endsWith(sep) ? `${base}${normRel}` : `${base}${sep}${normRel}`;
  };

  const openCandidateFile = async (file: any) => {
    const abs = toAbsPath(file?.relative_path || file?.name);
    const api = (window as any).electronAPI;
    if (abs && api?.openPath) {
      await api.openPath(abs);
    } else {
      console.warn('electronAPI.openPath not available');
    }
  };

  const openCandidateFolder = async (file: any) => {
    const abs = toAbsPath(file?.relative_path || file?.name);
    const api = (window as any).electronAPI;
    if (abs && api?.openPath) {
      const lastSep = Math.max(abs.lastIndexOf('\\'), abs.lastIndexOf('/'));
      const folder = lastSep >= 0 ? abs.slice(0, lastSep) : abs;
      await api.openPath(folder);
    } else {
      console.warn('electronAPI.openPath not available');
    }
  };


  // 初始化：加载步骤状态与结果
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        // 状态
        const st = await exportStepAPI.getStatus(projectId);
        if (st.success && st.data) {
          setStatus(st.data.status);
          setProgress(st.data.progress || 0);
          setCurrentStep(st.data.status === 'completed' ? 2 : st.data.status === 'in_progress' ? 1 : 0);
        }
        // 结果
        const res = await exportStepAPI.getResult(projectId);
        if (res.success && res.data) {
          setFormatResult(res.data);
        }
      } catch (error) {
        console.error('加载格式化初始数据失败:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // 检测文件格式 - 已整合到一键执行中

  // 转换文件格式（一键执行 + 等待进入running + 轮询）
  const handleConvert = async () => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }

    try {
      setExecuting(true);
      setCurrentStep(1);
      setStatus('in_progress');
      setProgress(0);
      if (projectId) await markStepInProgress(0);

      const response = await exportStepAPI.execute(projectId, 'html', { source_relative_path: bidFile?.relative_path || bidFile?.name });
      if (!response.success) {
        message.error(response.message || '文件格式转换失败');
        setStatus('error');
        if (projectId) await markStepError('execute failed');
        setExecuting(false);
        return;
      }

      // 等待进入运行态再提示
      const enteredRunning = await (async () => {
        for (let i = 0; i < 12; i++) {
          try {
            const st = await exportStepAPI.getStatus(projectId);
            if (st?.success && st.data) {
              const { status, progress } = st.data;
              setStatus(status);
              setProgress(progress || 0);
              if (projectId) await updateProgress(progress || 0);
              if ((typeof progress === 'number' && progress > 0) || status === 'running' || status === 'in_progress') {
                return true;
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 1000));
        }
        return false;
      })();
      if (enteredRunning) message.success('文件格式转换已启动'); else message.info('文件格式转换已提交，正在排队...');

      const poll = async () => {
        try {
          const st = await exportStepAPI.getStatus(projectId);
          if (st.success && st.data) {
            setStatus(st.data.status);
            setProgress(st.data.progress || 0);
            if (projectId) await updateProgress(st.data.progress || 0);
            if (st.data.status === 'completed') {
              const res = await exportStepAPI.getResult(projectId);
              if (res.success) setFormatResult(res.data);
              setCurrentStep(2);
              setExecuting(false);
              if (projectId) await markStepCompleted({ formatResult: (res?.data || null) });
              message.success('文件格式转换完成');
              return;
            }
            if (st.data.status === 'error' || st.data.status === 'cancelled') {
              setExecuting(false);
              if (projectId) await markStepError(st.data.status);
              message.error(`任务${st.data.status === 'error' ? '失败' : '已取消'}`);
              return;
            }
          }
        } catch (e) {
          console.error('轮询状态失败:', e);
        }
        setTimeout(poll, 1500);
      };
      poll();
    } catch (error) {
      console.error('文件格式转换失败:', error);
      if (projectId) await markStepError('exception');
      message.error('文件格式转换失败');
      setExecuting(false);
    }
  };

  // 提取文件内容 - 已整合到一键执行中

  // 生成HTML - 已整合到一键执行中

  // 验证文件格式 - 已整合到一键执行中

  // 清理文件格式 - 已整合到一键执行中

  // 下载格式化文件（统一到“文档导出”Step）
  const handleDownload = async () => {
    if (!projectId) {
      message.error('项目ID不存在');
      return;
    }
    try {
      setLoading(true);
      const exec = await exportStepAPI.execute(projectId, 'docx', {});
      if (!exec.success) {
        message.error(exec.message || '导出任务启动失败');
        setLoading(false);
        return;
      }
      // 轮询导出状态
      const poll = async () => {
        try {
          const st = await exportStepAPI.getStatus(projectId);
          if (st.success && st.data) {
            if (st.data.status === 'completed') {
              const res = await exportStepAPI.getResult(projectId);
              if (res.success) {
                const url = res.data?.files?.[0]?.url;
                if (url) {
                  window.open(url, '_blank');
                  message.success('导出完成，开始下载');
                } else {
                  message.warning('导出完成但未返回下载链接');
                }
              }
              setLoading(false);
              return;
            }
            if (st.data.status === 'error' || st.data.status === 'cancelled') {
              message.error(`导出任务${st.data.status === 'error' ? '失败' : '已取消'}`);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('导出轮询失败:', e);
        }
        setTimeout(poll, 1500);
      };
      poll();
    } catch (error) {
      console.error('文件下载失败:', error);
      message.error('文件下载失败');
      setLoading(false);
    }
  };

  // 跳转到下一步
  const handleNextStep = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/step/material-management`);
    }
  };

  const formatOptions = [
    { value: 'html', label: 'HTML', icon: <Html5Outlined />, description: '网页格式，便于在线预览' },
    { value: 'pdf', label: 'PDF', icon: <FilePdfOutlined />, description: '便携式文档格式' },
    { value: 'docx', label: 'DOCX', icon: <FileWordOutlined />, description: 'Word文档格式' },
    { value: 'txt', label: 'TXT', icon: <FileTextOutlined />, description: '纯文本格式' },
  ];

  const steps = [
    { title: '准备', description: '确认源文件与项目信息' },
    { title: '格式化执行', description: 'detect → clean → extract → html' },
    { title: '结果/导出', description: '预览或下载格式化结果' },
  ];

  if (isProjectLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (projectError) {
    return <Result status="error" title="加载项目失败" subTitle={projectError} />;
  }

  if (!project) {
    return <Result status="warning" title="未找到项目" subTitle="请确保项目ID是否正确。" />;
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <ProjectInfoHeader project={project} isLoading={isProjectLoading} onRefresh={() => projectId && dispatch(getProject(projectId))} />
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div />
          <Space>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/workflow`)}>返回项目操作页面</Button>
            <Button onClick={() => projectId && navigate(`/projects/${projectId}/step/bid-analysis`)}>上一步：招标文件分析</Button>
            <Button type="primary" onClick={() => projectId && navigate(`/projects/${projectId}/step/material-management`)} disabled={status !== 'completed'}>
              下一步：资料管理
            </Button>
          </Space>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>源文件（来自项目目录）</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          招标文件已在“创建项目”时复制到项目目录，无需再次上传。
        </Text>

        {bidCandidates.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <Text strong>检测到多个候选文件：</Text>
            <Select
              style={{ width: 420, marginLeft: 12 }}
              value={selectedBidIndex}
              onChange={setSelectedBidIndex}
              options={bidCandidates.map((f: any, idx: number) => ({
                label: `${f.name} ${f.relative_path ? `（${f.relative_path}）` : ''}`,
                value: idx,
              }))}
            />
          </div>
        )}

        {bidFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {String(bidFile.extension).toLowerCase() === '.pdf' ? (
              <FilePdfOutlined style={{ color: '#f5222d' }} />
            ) : (
              <FileWordOutlined style={{ color: '#1890ff' }} />
            )}
            <div style={{ flex: 1 }}>
              <Text strong>{bidFile.name}</Text>
              {bidFile.relative_path && (
                <>
                  <br />
                  <Text type="secondary">相对路径：{bidFile.relative_path}</Text>
                </>
              )}
              <br />
              <Text type="secondary">
                文件大小: {Math.round((bidFile.size || 0) / 1024)} KB |
                修改时间: {new Date((bidFile.modified_time || 0) * 1000).toLocaleString()}
              </Text>
            </div>
            <Space>
              <Button size="small" onClick={() => openCandidateFile(bidFile)}>打开文件</Button>
              <Button size="small" onClick={() => openCandidateFolder(bidFile)}>打开所在目录</Button>
            </Space>
          </div>
        ) : (
          <Alert message="未找到源招标文件" description="请确认项目目录中存在 PDF/DOCX/DOC 格式文件（可在子目录中）" type="warning" showIcon />
        )}
      </Card>

      {(
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>格式化执行</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>目标格式：</Text>
              <Select
                value={targetFormat}
                onChange={setTargetFormat}
                style={{ width: 200, marginLeft: 8 }}
              >
                {formatOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      {option.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>

            <Alert
              message={formatOptions.find(opt => opt.value === targetFormat)?.description}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Space wrap>
              <Button
                type="primary"
                size="large"
                onClick={handleConvert}
                loading={executing}
                disabled={!projectId || executing}
              >
                {executing || status === 'in_progress' ? '执行中...' : status === 'completed' ? '已完成（可重跑）' : '一键执行（检测→清理→提取→HTML）'}
              </Button>
            </Space>
          </Space>

          {(executing || status === 'in_progress') && (
            <div style={{ marginTop: 16 }}>
              <Alert
                message={'正在执行文件格式化流程...'}
                description="请稍候，系统正在处理您的文件"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>进度</Text>
                  <Progress percent={progress} status="active" style={{ marginTop: 4 }} />
                </div>
              </Space>
            </div>
          )}
        </Card>
      )}


      {formatResult && (
        <Card title="格式化结果" style={{ marginBottom: 24 }}>
          <Tabs
            items={[
              {
                key: 'info',
                label: '文件信息',
                children: formatResult.file_info && (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="文件总数">
                      {formatResult.file_info.total_files}
                    </Descriptions.Item>
                    <Descriptions.Item label="主要格式">
                      {formatResult.format_info?.primary_format}
                    </Descriptions.Item>
                    <Descriptions.Item label="格式支持">
                      <Tag color={formatResult.format_info?.supported ? 'green' : 'red'}>
                        {formatResult.format_info?.supported ? '支持' : '不支持'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="格式有效性">
                      <Tag color={formatResult.format_info?.is_valid ? 'green' : 'red'}>
                        {formatResult.format_info?.is_valid ? '有效' : '无效'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="处理时间">
                      {formatResult.processing_stats?.processing_time}
                    </Descriptions.Item>
                    <Descriptions.Item label="内存使用">
                      {formatResult.processing_stats?.memory_usage}
                    </Descriptions.Item>
                    {project?.project_path && (
                      <Descriptions.Item label="项目目录">
                        <Space>
                          <Text>{project.project_path}</Text>
                          <Button size="small" onClick={async ()=>{
                            const api = (window as any).electronAPI;
                            const res = await api?.openPath?.(project.project_path);
                            if (!res?.success) message.error(res?.message || '打开失败');
                          }}>打开目录</Button>
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ),
              },
              {
                key: 'conversion',
                label: '转换信息',
                children: formatResult.conversion_info && (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="源格式">
                      {formatResult.conversion_info.source_format}
                    </Descriptions.Item>
                    <Descriptions.Item label="目标格式">
                      {formatResult.conversion_info.target_format}
                    </Descriptions.Item>
                    <Descriptions.Item label="转换状态">
                      <Tag color={formatResult.conversion_info.status === 'completed' ? 'green' : 'orange'}>
                        {formatResult.conversion_info.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="输出文件" span={2}>
                      {formatResult.conversion_info.output_files?.map((file: any, index: number) => (
                        <div key={index} style={{ marginBottom: 8 }}>
                          <Text>{file.filename}</Text>
                          <Tag style={{ marginLeft: 8 }}>{file.format}</Tag>
                          {file.fullpath && (
                            <Button size="small" style={{ marginLeft: 8 }} onClick={async () => {
                              const api = (window as any).electronAPI;
                              const res = await api?.openPath?.(file.fullpath);
                              if (!res?.success) message.error(res?.message || '打开失败');
                            }}>打开</Button>
                          )}
                        </div>
                      ))}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'validation',
                label: '验证结果',
                children: formatResult.validation_info && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message={formatResult.validation_info.is_valid ? '文件格式验证通过' : '文件格式验证失败'}
                      type={formatResult.validation_info.is_valid ? 'success' : 'error'}
                      showIcon
                    />

                    {formatResult.validation_info.errors?.length > 0 && (
                      <div>
                        <Text strong style={{ color: '#ff4d4f' }}>错误信息：</Text>
                        <List
                          size="small"
                          dataSource={formatResult.validation_info.errors}
                          renderItem={(error: string) => (
                            <List.Item>
                              <Text type="danger">{error}</Text>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}

                    {formatResult.validation_info.warnings?.length > 0 && (
                      <div>
                        <Text strong style={{ color: '#faad14' }}>警告信息：</Text>
                        <List
                          size="small"
                          dataSource={formatResult.validation_info.warnings}
                          renderItem={(warning: string) => (
                            <List.Item>
                              <Text type="warning">{warning}</Text>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}
                  </Space>
                ),
              },
            ]}
          />

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                onClick={handleDownload}
                loading={loading}
              >
                下载格式化文件
              </Button>

              <Button
                icon={<EyeOutlined />}
                size="large"
                onClick={() => {
                  // TODO: 实现预览功能
                  message.info('预览功能开发中');
                }}
              >
                预览文档
              </Button>

              {formatResult && (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNextStep}
                >
                  下一步：资料管理
                </Button>
              )}
            </Space>
          </div>
        </Card>
      )}

      {/* 项目流程导航 */}
      <ProjectStepNavigation
        projectId={projectId}
        currentStep="file-formatting"
        canProceed={!!formatResult}
      />
    </div>
  );
};

export default FileFormattingPage;
