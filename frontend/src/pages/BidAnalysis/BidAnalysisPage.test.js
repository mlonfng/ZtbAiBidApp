import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import BidAnalysisPage from './BidAnalysisPage';
import { useProjectLoader } from '../../hooks/useProjectLoader';

// Mock the custom hook
jest.mock('../../hooks/useProjectLoader', () => ({
  useProjectLoader: jest.fn(),
}));

// Mock the Step API
jest.mock('../../services/api', () => ({
  bidStepAPI: {
    getStatus: jest.fn(),
    execute: jest.fn(),
    getResult: jest.fn(),
  },
}));

describe('BidAnalysisPage', () => {
  const mockProject = {
    id: '1',
    name: '模拟项目：山西路桥第三工程有限公司办公家具竞争性谈判采购',
    status: 'in_progress',
    service_mode: 'AI智能模式',
    project_path: 'G:\\ZtbAiBidApp_202507210900\\Bid\\Project-1',
    bid_document_name: '招标文件示例.docx',
    current_step: '招标文件分析',
    created_at: '2025-08-22T10:00:00Z',
    updated_at: '2025-08-23T09:58:10Z',
    files: [
      {
        name: '招标文件示例.docx',
        size: 1024000,
        modified_time: 1724411890,
        is_bid_candidate: true
      }
    ],
    progress: { total_progress: 25 },
  };

  beforeEach(() => {
    // Reset mocks before each test
    useProjectLoader.mockReturnValue({
      projectId: '1',
      project: mockProject,
      isLoading: false,
      error: null,
    });

    // Mock Step API responses
    const { bidStepAPI } = require('../../services/api');
    bidStepAPI.getStatus.mockResolvedValue({
      success: true,
      data: {
        status: 'pending',
        progress: 0,
        message: '等待分析'
      }
    });

    bidStepAPI.execute.mockResolvedValue({
      success: true,
      data: {
        task_id: 'task-123'
      }
    });

    bidStepAPI.getResult.mockResolvedValue({
      success: true,
      data: {
        basic_info: {
          project_name: '测试项目',
          project_code: 'TEST-001'
        }
      }
    });
  });

  test('should render project information header correctly', async () => {
    renderWithProviders(<BidAnalysisPage />);

    // Wait for the header to be rendered with the project name
    await waitFor(() => {
      expect(screen.getByText(/模拟项目/)).toBeInTheDocument();
    });

    // Assertions for basic page elements
    expect(screen.getByText('招标文件')).toBeInTheDocument();
    expect(screen.getByText('招标文件示例.docx')).toBeInTheDocument();
    expect(screen.getByText('开始分析')).toBeInTheDocument();
  });

  test('should display file information correctly', async () => {
    renderWithProviders(<BidAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText('招标文件示例.docx')).toBeInTheDocument();
    });

    // Check file size formatting
    expect(screen.getByText(/1\.00 MB/)).toBeInTheDocument();
  });

  test('should handle analysis completion state', async () => {
    // Mock completed analysis status
    const { bidStepAPI } = require('../../services/api');
    bidStepAPI.getStatus.mockResolvedValue({
      success: true,
      data: {
        status: 'completed',
        progress: 100,
        message: '分析完成'
      }
    });

    renderWithProviders(<BidAnalysisPage />);

    // Check if next step button is enabled when analysis is completed
    await waitFor(() => {
      const nextButton = screen.getByText('下一步：投标文件初始化');
      expect(nextButton).not.toBeDisabled();
    });
  });
});