import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import ServiceModePage from './ServiceModePage';
import { useProjectLoader } from '../../hooks/useProjectLoader';

// Mock the custom hook, as it's a dependency of the component under test.
jest.mock('../../hooks/useProjectLoader', () => ({
  useProjectLoader: jest.fn(),
}));

describe('ServiceModePage', () => {
  const mockProject = {
    id: '1',
    name: '模拟项目：山西路桥第三工程有限公司办公家具竞争性谈判采购',
    status: 'in_progress',
    service_mode: 'AI智能模式',
    project_path: 'G:\\ZtbAiBidApp_202507210900\\Bid\\Project-1',
    bid_document_name: '招标文件示例.docx',
    current_step: '服务模式',
    created_at: '2025-08-22T10:00:00Z',
    updated_at: '2025-08-23T09:58:10Z',
    files: [{}, {}, {}],
    progress: { total_progress: 75 },
  };

  beforeEach(() => {
    // Reset mocks before each test
    useProjectLoader.mockReturnValue({
      projectId: '1',
      project: mockProject,
      isLoading: false,
      error: null,
    });
  });

  test('should display project information header correctly', async () => {
    renderWithProviders(<ServiceModePage />);

    // Wait for the header to be rendered with the project name
    await waitFor(() => {
      expect(screen.getByText(/模拟项目/)).toBeInTheDocument();
    });

    // Assertions for the ProjectInfoHeader
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('AI智能模式')).toBeInTheDocument();
    expect(screen.getByLabelText('folder-open')).toBeInTheDocument();
    expect(screen.getByLabelText('reload')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('招标文件示例.docx')).toBeInTheDocument();
    expect(screen.getByText('服务模式')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // File count
    expect(screen.getByText(/Project-1/)).toBeInTheDocument();
    expect(screen.getByLabelText('copy')).toBeInTheDocument();
  });
});

