import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary:
    'bg-accent-gradient text-white border-transparent shadow-glow hover:brightness-110',
  secondary:
    'bg-chess-surface-alt hover:bg-chess-surface-hover text-chess-text-primary border-chess-border',
  ghost:
    'bg-transparent hover:bg-chess-surface-alt text-chess-text-secondary border-transparent',
  danger:
    'bg-chess-blunder/90 hover:bg-chess-blunder text-white border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 border font-semibold
        transition-all duration-150 select-none
        active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chess-accent-light/70 focus-visible:ring-offset-2 focus-visible:ring-offset-chess-bg
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
