import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Tooltip } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  PlusOutlined,
  BarChartOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../store';
import { logoutSync, getCurrentUser } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { fetchProjects, setCurrentProject } from '../../store/slices/projectSlice';


const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { sidebarCollapsed } = useAppSelector(state => state.ui);
  const { projects, currentProject, loading: projectLoading } = useAppSelector(state => state.project);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 获取当前用户信息
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  // 单独处理项目列表获取，避免无限循环
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProjects({ pageSize: 50 }));
    }
  }, [isAuthenticated, dispatch]);

  // 计算项目进度
  const calculateProjectProgress = (project: any) => {
    if (!project) return 0;

    // 基于项目状态和创建时间计算更合理的进度
    const now = new Date();
    const createdAt = new Date(project.created_at || project.createdTime || now);
    const updatedAt = new Date(project.updated_at || project.updatedTime || now);

    // 计算项目存在天数
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceUpdated = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    switch (project.status) {
      case 'completed':
        return 100;
      case 'in_progress':
      case 'active':
        // 进行中项目：基于时间和活跃度计算 40-85%
        const activeProgress = Math.min(40 + daysSinceCreated * 3, 85);
        return Math.max(activeProgress - daysSinceUpdated * 2, 40);
      case 'draft':
        // 草稿项目：基于创建时间计算 5-35%
        return Math.min(5 + daysSinceCreated * 2, 35);
      case 'archived':
        // 已归档项目：固定在 60-80% 之间
        return 60 + (daysSinceCreated % 20);
      default:
        return Math.min(10 + daysSinceCreated, 25);
    }
  };

  // 获取当前活动项目（优先使用 currentProject，否则使用最近的进行中项目）
  const getActiveProject = () => {
    if (currentProject) {
      return {
        id: currentProject.id,
        name: currentProject.name,
        status: currentProject.status || 'draft',
        progress: calculateProjectProgress(currentProject),
        deadline: currentProject.updated_at ?
          new Date(new Date(currentProject.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          undefined,
      };
    }

    // 如果没有 currentProject，尝试找到最近的进行中项目
    const activeProject = projects.find(p => p.status === 'in_progress' || p.status === 'active');
    if (activeProject) {
      return {
        id: activeProject.id,
        name: activeProject.name,
        status: activeProject.status || 'draft',
        progress: calculateProjectProgress(activeProject),
        deadline: activeProject.updated_at ?
          new Date(new Date(activeProject.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          undefined,
      };
    }

    return null;
  };

  const handleCloseProject = () => {
    dispatch(setCurrentProject(null));
    navigate('/projects');
  };

  const handleLogout = () => {
    dispatch(logoutSync());
    localStorage.removeItem('ztb_token');
    localStorage.removeItem('ztb_user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/projects/new',
      icon: <PlusOutlined />,
      label: '创建项目',
    },
    {
      key: '/data-stats',
      icon: <BarChartOutlined />,
      label: '数据统计',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: '帮助支持',
    },
  ];

  const selectedKeys = [location.pathname];

    if (!isAuthenticated) {
    return null;
  }

  // 判断是否为项目工作流页面
  const isProjectWorkflowPage = (pathname: string): boolean => {
    // 项目流程相关页面路径
    const workflowPaths = [
      '/service-mode',
      '/bid-analysis',
      '/file-formatting',
      '/material-management',
      '/framework-generation',
      '/content-generation',
      '/format-config',
      '/document-export'
    ];

    // 检查是否为项目步骤页面或直接的工作流页面
    return (pathname.includes('/projects/') && pathname.includes('/step/')) ||
           workflowPaths.some(path => pathname.startsWith(path));
  };

  // 根据路径获取页面标题
  const getPageTitle = (pathname: string, currentProject?: any): string => {
    const titleMap: Record<string, string> = {
      '/dashboard': '工作台',
      '/projects': '投标项目管理',
      '/projects/new': '创建项目',
      '/data-stats': '数据统计',
      '/service-mode': '服务模式选择',
      '/bid-analysis': '招标文件分析',
      '/file-formatting': '投标文件初始化',
      '/material-management': '资料管理',
      '/framework-generation': '框架生成',
      '/content-generation': '内容生成',
      '/format-config': '格式配置',
      '/document-export': '文档导出',
      '/prompt-management': '提示词管理',
      '/system-monitor': '系统监控',
      '/system-diagnostic': '系统诊断',
      '/help': '帮助中心',
      '/settings': '系统配置',
    };

    // 处理动态路由
    if (pathname.includes('/projects/') && pathname.includes('/edit')) {
      return '投标项目编辑';
    }
    if (pathname.includes('/projects/') && pathname.includes('/workflow')) {
      return '投标文件生成流程';
    }

    // 获取基础标题
    let baseTitle = titleMap[pathname];

    // 如果没有找到基础标题，检查是否为项目步骤页面
    if (!baseTitle && pathname.includes('/projects/') && pathname.includes('/step/')) {
      const stepPath = pathname.split('/step/')[1];
      baseTitle = titleMap[`/${stepPath}`];
    }

    // 如果是项目工作流页面且有当前项目，添加项目名称前缀
    if (baseTitle && currentProject && (
      (pathname.includes('/projects/') && pathname.includes('/step/')) ||
      ['/service-mode', '/bid-analysis', '/file-formatting', '/material-management',
       '/framework-generation', '/content-generation', '/format-config', '/document-export'].some(path => pathname.startsWith(path))
    )) {
      return `${currentProject.name} - ${baseTitle}`;
    }

    return baseTitle || 'ZtbAi投标文件AI智能编辑';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={260}
        style={{
          background: '#001529',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #303030',
            fontSize: sidebarCollapsed ? 14 : 16,
            fontWeight: 'bold',
            color: '#fff',
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          }}
        >
          {sidebarCollapsed ? 'ZtbAi' : 'ZtbAi投标文件AI智能编辑'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems.map(item => ({ ...item, disabled: projectLoading }))}
          theme="dark"
          style={{ border: 'none', background: 'transparent' }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
              style={{ marginRight: 16 }}
            />
            <h2 style={{ margin: 0, color: '#262626' }}>
              {getPageTitle(location.pathname, getActiveProject())}
            </h2>
            {isProjectWorkflowPage(location.pathname) && (
              <Button onClick={handleCloseProject} style={{ marginLeft: 16 }}>
                关闭项目
              </Button>
            )}
          </div>

          <Space size="middle">
            <Tooltip title="通知">
              <Badge count={0} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ border: 'none' }}
                />
              </Badge>
            </Tooltip>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Avatar
                  size="small"
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontSize: 14 }}>
                  {user?.displayName || user?.username}
                </span>
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 0,
            padding: 0,
            background: '#f5f5f5',
            overflow: 'auto',
          }}
        >

          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};



export default MainLayout;
