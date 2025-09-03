import React from 'react';
import {
  Card,
  Tabs,
  Alert,
  Typography,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Input
} from 'antd';
import {
  FileTextOutlined
} from '@ant-design/icons';

// Text and Title are not used
// const { Text, Title } = Typography;
const { TextArea } = Input;

interface AnalysisResultProps {
  data: any;
  loading?: boolean;
}

const EnhancedAnalysisResult: React.FC<AnalysisResultProps> = ({ data, loading = false }) => {
  if (!data) {
    return (
      <Alert
        message="暂无分析结果"
        description="请先进行招标文件分析以获取详细信息"
        type="info"
        showIcon
      />
    );
  }

  const {
    basic_info = {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    evaluation_criteria = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    technical_requirements = [],
    commercial_requirements = {},
    key_points = [],
    timeline = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    risks = [],
    recommendations = [],
    generated_time
  } = data;

  // 格式化显示内容的辅助函数
  const formatBasicInfo = (info: any) => {
    if (!info || Object.keys(info).length === 0) return '暂无基本信息';

    const fields = [
      { key: 'project_name', label: '项目名称' },
      { key: 'project_number', label: '项目编号' },
      { key: 'tender_unit', label: '招标单位' },
      { key: 'project_budget', label: '项目预算' },
      { key: 'bid_deadline', label: '投标截止时间' },
      { key: 'bid_opening_time', label: '开标时间' },
      { key: 'project_location', label: '项目地点' },
      { key: 'contact_info', label: '联系方式' }
    ];

    return fields
      .filter(field => info[field.key])
      .map(field => `${field.label}: ${info[field.key]}`)
      .join('\n');
  };

  const formatEvaluationCriteria = (criteria: any[]) => {
    if (!criteria || criteria.length === 0) return '暂无评分标准';

    return criteria
      .map((item, index) => {
        const title = item.title || `评分标准${index + 1}`;
        const content = item.content || '无具体内容';
        const weight = item.weight ? `（权重: ${item.weight}分）` : '';
        return `${title}${weight}\n${content}`;
      })
      .join('\n\n---\n\n');
  };

  const formatTechnicalRequirements = (requirements: any[]) => {
    if (!requirements || requirements.length === 0) return '暂无技术要求';

    if (typeof requirements[0] === 'string') {
      return requirements.join('\n\n');
    }

    return requirements
      .map((item, index) => {
        if (typeof item === 'string') return `${index + 1}. ${item}`;
        return `${index + 1}. ${item.requirement || item.content || JSON.stringify(item)}`;
      })
      .join('\n\n');
  };

  const formatTimeline = (timeline: any[]) => {
    if (!timeline || timeline.length === 0) return '暂无时间节点信息';

    return timeline
      .map(item => {
        const date = item.date || '待确定';
        const event = item.event || '未知事件';
        const status = item.status === 'completed' ? '已完成' : '待进行';
        return `${date} - ${event} (${status})`;
      })
      .join('\n');
  };

  const formatRisks = (risks: any[]) => {
    if (!risks || risks.length === 0) return '暂无风险提示';

    return risks
      .map((risk, index) => `${index + 1}. ${typeof risk === 'string' ? risk : risk.content || JSON.stringify(risk)}`)
      .join('\n\n');
  };

  const formatRecommendations = (recommendations: any[]) => {
    if (!recommendations || recommendations.length === 0) return '暂无建议事项';

    return recommendations
      .map((rec, index) => `${index + 1}. ${typeof rec === 'string' ? rec : rec.content || JSON.stringify(rec)}`)
      .join('\n\n');
  };

  const tabItems = [
    {
      key: 'basic_info',
      label: '基本信息',
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <TextArea
            value={formatBasicInfo(basic_info)}
            readOnly
            autoSize={{ minRows: 8, maxRows: 20 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </Card>
      )
    },
    {
      key: 'evaluation_criteria',
      label: '评分标准',
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <TextArea
            value={formatEvaluationCriteria(evaluation_criteria)}
            readOnly
            autoSize={{ minRows: 10, maxRows: 30 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </Card>
      )
    },
    {
      key: 'technical_requirements',
      label: '技术要求',
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <TextArea
            value={formatTechnicalRequirements(technical_requirements)}
            readOnly
            autoSize={{ minRows: 8, maxRows: 25 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </Card>
      )
    },
    {
      key: 'timeline',
      label: '时间节点',
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <TextArea
            value={formatTimeline(timeline)}
            readOnly
            autoSize={{ minRows: 6, maxRows: 15 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </Card>
      )
    },
    {
      key: 'risks',
      label: '风险提示',
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <TextArea
            value={formatRisks(risks)}
            readOnly
            autoSize={{ minRows: 6, maxRows: 20 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </Card>
      )
    },
    {
      key: 'recommendations',
      label: '建议事项',
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <TextArea
            value={formatRecommendations(recommendations)}
            readOnly
            autoSize={{ minRows: 6, maxRows: 20 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </Card>
      )
    }
  ];

  return (
    <Card
      title="招标文件分析结果"
      extra={<FileTextOutlined />}
      loading={loading}
    >
      <Tabs
        items={tabItems}
        defaultActiveKey="basic_info"
        type="card"
      />
    </Card>
  );
};

export default EnhancedAnalysisResult;
