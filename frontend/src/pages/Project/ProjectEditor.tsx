import React from 'react';
import { useParams } from 'react-router-dom';
import { Result, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import VisualEditor from '../../components/Editor/VisualEditor';

const ProjectEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <Result
        status="404"
        title="项目不存在"
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

  return <VisualEditor projectId={projectId} />;
};

export default ProjectEditor;
