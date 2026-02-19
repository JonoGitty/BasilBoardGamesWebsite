import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';

// eslint-disable-next-line react-refresh/only-export-components
function AllProviders({ children }: { children: React.ReactNode }) {
  // Add AuthContext, ThemeProvider, etc. as needed
  return <>{children}</>;
}

/**
 * Custom render that wraps the component in app providers.
 *
 * Usage:
 *   const { getByText } = renderWithProviders(<MyComponent />);
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
