import { InputHTMLAttributes, ChangeEvent } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  name?: string
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  name,
  className = '',
  ...rest
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-forge-muted mb-1.5"
        >
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full px-4 py-2.5 border rounded-lg text-white text-sm
          placeholder-forge-muted bg-forge-background
          focus:outline-none focus:ring-2 focus:ring-forge-primary focus:border-transparent
          transition-all duration-200
          disabled:bg-forge-surface disabled:text-forge-muted disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-forge-border'}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
