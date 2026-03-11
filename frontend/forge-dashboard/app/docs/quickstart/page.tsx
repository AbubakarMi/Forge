'use client'

import { useState } from 'react'
import Link from 'next/link'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-lg bg-gray-900">
      <CopyButton text={code} />
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-green-400 font-mono">{code}</code>
      </pre>
    </div>
  )
}

interface Step {
  number: number
  title: string
  description: string
  code?: string
  link?: { href: string; label: string }
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Create an Account',
    description:
      'Sign up for a Forge account to get access to the dashboard and API. Your organization will be created automatically during registration.',
    link: { href: '/register', label: 'Create Account' },
  },
  {
    number: 2,
    title: 'Create an Organization',
    description:
      'An organization is created automatically when you register. You can manage your organization settings, invite team members, and configure permissions from the dashboard.',
    link: { href: '/dashboard/organization', label: 'View Organization' },
  },
  {
    number: 3,
    title: 'Generate an API Key',
    description:
      'Navigate to Dashboard > API Keys and click "Generate New Key". You will receive an API key prefixed with forge_. Store it securely -- you will not be able to see the full key again.',
    link: { href: '/dashboard/api-keys', label: 'Go to API Keys' },
  },
  {
    number: 4,
    title: 'Make Your First API Call',
    description: 'Test your API key by fetching the list of supported banks. This is a read-only endpoint that confirms your key is working.',
    code: `curl -X GET https://api.forgeapi.com/api/v1/banks \\
  -H "X-Api-Key: forge_abc123..."`,
  },
  {
    number: 5,
    title: 'Create Your First Payout',
    description: 'Send a single payout to a recipient. The payment will be validated against the bank registry and queued for processing.',
    code: `curl -X POST https://api.forgeapi.com/api/v1/payouts \\
  -H "X-Api-Key: forge_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientName": "John Doe",
    "bankName": "Access Bank",
    "accountNumber": "0123456789",
    "amount": 50000
  }'`,
  },
  {
    number: 6,
    title: 'Check Results',
    description: 'Query the transaction status to see if your payout was processed successfully. Replace the transaction ID with the one returned from step 5.',
    code: `curl -X GET https://api.forgeapi.com/api/v1/transactions/txn_xyz789 \\
  -H "X-Api-Key: forge_abc123..."`,
  },
]

export default function QuickstartPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-forge-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">Forge</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-600">Quickstart</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm font-medium text-gray-600 hover:text-forge-primary transition-colors"
            >
              API Reference
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-white bg-forge-primary hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-forge-primary hover:underline mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to API Reference
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Quickstart Guide</h1>
          <p className="text-lg text-gray-600">
            Get up and running with the Forge Payments API in under 5 minutes. This guide walks you through account
            creation, API key generation, and making your first payout.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-10">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              {/* Number badge */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-forge-primary text-white flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
                {step.number < steps.length && (
                  <div className="w-px h-full bg-gray-200 mx-auto mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
                <p className="text-gray-600 mb-4">{step.description}</p>

                {step.code && <CodeBlock code={step.code} />}

                {step.link && (
                  <Link
                    href={step.link.href}
                    className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-forge-primary hover:underline"
                  >
                    {step.link.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready for more?</h2>
          <p className="text-gray-600 mb-6">
            Explore the full API reference for advanced features like batch payouts, AI bank name normalization, and webhook integrations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/docs"
              className="px-6 py-3 bg-forge-primary text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Full API Reference
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
