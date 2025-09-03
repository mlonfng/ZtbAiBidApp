import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { templateAPI } from '../../services/templateAPI';

export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'framework' | 'page' | 'component' | 'section' | 'style';
  category: string;
  status: 'draft' | 'published' | 'archived';
  shareLevel: 'private' | 'team' | 'organization' | 'public';
  author: string;
  createdTime: string;
  updatedTime: string;
  version: string;
  tags: string[];
  previewImage?: string;
  downloadCount: number;
  rating: number;
  ratingCount: number;
}

interface TemplateState {
  templates: Template[];
  currentTemplate: Template | null;
  loading: boolean;
  error: string | null;
  filters: {
    type?: string;
    category?: string;
    status?: string;
    search?: string;
  };
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

const initialState: TemplateState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    current: 1,
    pageSize: 12,
    total: 0,
  },
};

export const fetchTemplates = createAsyncThunk(
  'template/fetchTemplates',
  async (params: any) => {
    const response = await templateAPI.getTemplates(params);
    return response;
  }
);

export const createTemplate = createAsyncThunk(
  'template/createTemplate',
  async (templateData: any) => {
    const response = await templateAPI.createTemplate(templateData);
    return response;
  }
);

export const updateTemplate = createAsyncThunk(
  'template/updateTemplate',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await templateAPI.updateTemplate(id, data);
    return response;
  }
);

export const deleteTemplate = createAsyncThunk(
  'template/deleteTemplate',
  async (id: string) => {
    await templateAPI.deleteTemplate(id);
    return id;
  }
);

export const rateTemplate = createAsyncThunk(
  'template/rateTemplate',
  async ({ id, rating, comment }: { id: string; rating: number; comment?: string }) => {
    const response = await templateAPI.rateTemplate(id, rating, comment);
    return response;
  }
);

const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取模板失败';
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearError, setFilters, clearFilters } = templateSlice.actions;
export default templateSlice.reducer;
