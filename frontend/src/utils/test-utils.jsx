import React from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

// Import your own reducers
import projectReducer from '../store/slices/projectSlice';
import authReducer from '../store/slices/authSlice';
import desktopReducer from '../store/slices/desktopSlice'; // Import other necessary reducers

// This is a custom render function that sets up a Redux store and router for tests.
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({ 
      reducer: { 
        project: projectReducer, 
        auth: authReducer,
        desktop: desktopReducer, // Add other reducers to the mock store
      }, 
      preloadedState 
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
