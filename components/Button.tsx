'use client';

import * as React from 'react';

type ButtonVariant = 'primary';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseClasses =
  'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-red-600 hover:bg-red-500 text-white px-4 py-2',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const variantClass = variantClasses[variant];
  const merged = `${baseClasses} ${variantClass} ${className}`.trim();
  return <button className={merged} {...props} />;
}

