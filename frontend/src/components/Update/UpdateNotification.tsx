import React, { useState, useEffect } from 'react';
import { Modal, Button, Progress, Typography, Space, Alert, Divider } from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { autoUpdater, UpdateInfo, UpdateProgress, UpdateStatus } from '../../services/autoUpdater';

const { Title, Text, Paragraph } = Typography;

interface UpdateNotificationProps {
  visible: boolean;
  onClose: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ visible, onClose }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: null,
    updateInfo: null,
  });

  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    // 监听更新事件
    const handleUpdateAvailable = (updateInfo: UpdateInfo) => {
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        available: true,
        updateInfo,
      }));
    };

    const handleUpdateNotAvailable = () => {
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        available: false,
      }));
    };

    const handleDownloadProgress = (progress: UpdateProgress) => {
      setUpdateStatus(prev => ({
        ...prev,
        downloading: true,
        progress,
      }));
    };

    const handleUpdateDownloaded = (updateInfo: UpdateInfo) => {
      setUpdateStatus(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        updateInfo,
      }));
    };

    const handleError = (error: string) => {
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error,
      }));
    };

    const handleCheckingForUpdate = () => {
      setUpdateStatus(prev => ({
        ...prev,
        checking: true,
        error: null,
      }));
    };

    // 注册事件监听器
    autoUpdater.on('update-available', handleUpdateAvailable);
    autoUpdater.on('update-not-available', handleUpdateNotAvailable);
    autoUpdater.on('download-progress', handleDownloadProgress);
    autoUpdater.on('update-downloaded', handleUpdateDownloaded);
    autoUpdater.on('error', handleError);
    autoUpdater.on('checking-for-update', handleCheckingForUpdate);

    return () => {
      // 清理事件监听器
      autoUpdater.off('update-available', handleUpdateAvailable);
      autoUpdater.off('update-not-available', handleUpdateNotAvailable);
      autoUpdater.off('download-progress', handleDownloadProgress);
      autoUpdater.off('update-downloaded', handleUpdateDownloaded);
      autoUpdater.off('error', handleError);
      autoUpdater.off('checking-for-update', handleCheckingForUpdate);
    };
  }, []);

  const handleCheckForUpdates = async () => {
    await autoUpdater.checkForUpdates();
  };

  const handleDownloadUpdate = async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('下载更新失败:', error);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await autoUpdater.installUpdate();
    } catch (error) {
      console.error('安装更新失败:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const renderContent = () => {
    if (updateStatus.checking) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Progress type="circle" percent={100} status="active" />
          <div style={{ marginTop: '16px' }}>
            <Text>正在检查更新...</Text>
          </div>
        </div>
      );
    }

    if (updateStatus.error) {
      return (
        <Alert
          message="更新检查失败"
          description={updateStatus.error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleCheckForUpdates}>
              重试
            </Button>
          }
        />
      );
    }

    if (!updateStatus.available) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <InfoCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
          <div style={{ marginTop: '16px' }}>
            <Title level={4}>已是最新版本</Title>
            <Text type="secondary">当前版本: v2.1.0</Text>
          </div>
        </div>
      );
    }

    if (updateStatus.downloading && updateStatus.progress) {
      const { progress } = updateStatus;
      return (
        <div>
          <Title level={4}>正在下载更新</Title>
          <Progress
            percent={Math.round(progress.percent)}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">
              {formatFileSize(progress.transferred)} / {formatFileSize(progress.total)}
            </Text>
            <Text type="secondary">
              {formatSpeed(progress.bytesPerSecond)}
            </Text>
          </div>
        </div>
      );
    }

    if (updateStatus.downloaded) {
      return (
        <div>
          <Alert
            message="更新已下载完成"
            description="点击'立即安装'重启应用并安装更新，或稍后手动重启应用。"
            type="success"
            showIcon
          />
          {updateStatus.updateInfo && (
            <div style={{ marginTop: '16px' }}>
              <Title level={5}>版本 {updateStatus.updateInfo.version}</Title>
              <Text type="secondary">发布日期: {updateStatus.updateInfo.releaseDate}</Text>
            </div>
          )}
        </div>
      );
    }

    if (updateStatus.updateInfo) {
      const { updateInfo } = updateStatus;
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginRight: '8px' }} />
            <Title level={4} style={{ margin: 0 }}>发现新版本</Title>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>版本: </Text>
            <Text>{updateInfo.version}</Text>
            <br />
            <Text strong>发布日期: </Text>
            <Text>{updateInfo.releaseDate}</Text>
            <br />
            <Text strong>文件大小: </Text>
            <Text>{formatFileSize(updateInfo.fileSize)}</Text>
            {updateInfo.mandatory && (
              <>
                <br />
                <Text type="danger" strong>此更新为必需更新</Text>
              </>
            )}
          </div>

          {updateInfo.releaseNotes && (
            <div>
              <Button
                type="link"
                onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                style={{ padding: 0, marginBottom: '8px' }}
              >
                {showReleaseNotes ? '隐藏' : '查看'}更新说明
              </Button>
              {showReleaseNotes && (
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  marginBottom: '16px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {updateInfo.releaseNotes}
                  </Paragraph>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (updateStatus.checking || updateStatus.downloading) {
      return [
        <Button key="close" onClick={onClose}>
          后台下载
        </Button>
      ];
    }

    if (updateStatus.error) {
      return [
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button key="retry" type="primary" onClick={handleCheckForUpdates}>
          重试
        </Button>
      ];
    }

    if (!updateStatus.available) {
      return [
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button key="check" type="primary" onClick={handleCheckForUpdates}>
          重新检查
        </Button>
      ];
    }

    if (updateStatus.downloaded) {
      return [
        <Button key="later" onClick={onClose}>
          稍后安装
        </Button>,
        <Button 
          key="install" 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={handleInstallUpdate}
        >
          立即安装
        </Button>
      ];
    }

    if (updateStatus.updateInfo) {
      const buttons = [
        <Button key="close" onClick={onClose}>
          {updateStatus.updateInfo.mandatory ? '稍后' : '跳过'}
        </Button>,
        <Button 
          key="download" 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={handleDownloadUpdate}
        >
          下载更新
        </Button>
      ];

      return buttons;
    }

    return [
      <Button key="close" onClick={onClose}>
        关闭
      </Button>
    ];
  };

  return (
    <Modal
      title="应用更新"
      open={visible}
      onCancel={onClose}
      footer={renderFooter()}
      width={500}
      maskClosable={!updateStatus.updateInfo?.mandatory}
      closable={!updateStatus.updateInfo?.mandatory}
    >
      {renderContent()}
    </Modal>
  );
};

export default UpdateNotification;
