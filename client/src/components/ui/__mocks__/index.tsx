import React from 'react';

export const Button = ({ children, ...props }: any) => {
  // debug: ensure mock is actually used in tests
  // console.log('Mock Button render:', children);
  return React.createElement('button', { ...props }, children);
};

export const Input = (props: any) => {
  return React.createElement('input', { ...props });
};

export const Select = (props: any) => {
  return React.createElement('select', { ...props }, props.children);
};

export const Textarea = (props: any) => {
  return React.createElement('textarea', { ...props });
};

export const LoadingSpinner = () => React.createElement('div', { 'data-testid': 'loading-spinner' });
