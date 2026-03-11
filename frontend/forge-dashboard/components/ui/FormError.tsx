'use client'

interface FormErrorProps {
  errors: string[]
}

export default function FormError({ errors }: FormErrorProps) {
  if (errors.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, i) => (
          <li key={i} className="text-sm text-red-600">
            {error}
          </li>
        ))}
      </ul>
    </div>
  )
}
