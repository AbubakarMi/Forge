import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-forge-primary text-white hover:opacity-90 focus:ring-forge-primary border-transparent',
  secondary:
    'bg-forge-surface text-white border-forge-border hover:bg-white/5 focus:ring-forge-secondary',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 border-transparent',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center border font-medium
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
