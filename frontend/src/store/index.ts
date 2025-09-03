import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import templateReducer from './slices/templateSlice';
import agentReducer from './slices/agentSlice';
import workflowReducer from './slices/workflowSlice';
import uiReducer from './slices/uiSlice';
import desktopReducer from './slices/desktopSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    template: templateReducer,
    agent: agentReducer,
    workflow: workflowReducer,
    ui: uiReducer,
    desktop: desktopReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 类型化的hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
