'use client';

import * as React from 'react';

interface EffectBoundaryState {
  hasError: boolean;
}

interface EffectBoundaryProps extends React.PropsWithChildren {
  fallback?: React.ReactNode;
}

export class EffectBoundary extends React.Component<
  EffectBoundaryProps,
  EffectBoundaryState
> {
  state: EffectBoundaryState = { hasError: false };

  static getDerivedStateFromError(): EffectBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Weather visual effects were disabled after a rendering error.', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
