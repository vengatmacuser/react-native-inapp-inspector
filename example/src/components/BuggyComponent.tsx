import React from 'react';

export interface BuggyComponentProps {
  type: 'none' | 'js' | 'native';
}

export function BuggyComponent({ type }: BuggyComponentProps) {
  if (type === 'js') {
    throw new Error(
      'Simulated JavaScript Crash: ReferenceError: x is not defined in App.tsx at line 67',
    );
  }
  if (type === 'native') {
    throw new Error(
      'Simulated Native Crash: fatal error: Index out of range in Native Swift/Java module at line 70',
    );
  }
  return null;
}
