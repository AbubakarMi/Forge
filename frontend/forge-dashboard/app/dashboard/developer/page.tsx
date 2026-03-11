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
      className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const baseUrl = 'http://localhost:5000/api/v1'
const exampleCurl = `curl -X GET ${baseUrl}/banks \\
  -H "X-Api-Key: forge_abc123..."`

export default function DeveloperPage() {
  const [curlCopied, setCurlCopied] = useState(false)

  const handleCopyCurl = async () => {
    await navigator.clipboard.writeText(exampleCurl)
    setCurlCopied(true)
    setTimeout(() => setCurlCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-forge-text">Developer</h1>
        <p className="text-forge-muted mt-1">API resources, documentation, and developer tools.</p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Keys card */}
        <Link
          href="/dashboard/api-keys"
          className="group bg-white rounded-xl border border-forge-border p-6 hover:border-forge-primary hover:shadow-lg hover:shadow-forge-primary/5 transition-all"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <svg className="w-5 h-5 text-forge-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="font-bold text-forge-text mb-1">API Keys</h3>
          <p className="text-sm text-forge-muted">Manage your API keys and permissions</p>
        </Link>

        {/* Docs card */}
        <Link
          href="/docs"
          className="group bg-white rounded-xl border border-forge-border p-6 hover:border-forge-primary hover:shadow-lg hover:shadow-forge-primary/5 transition-all"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <svg className="w-5 h-5 text-forge-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-bold text-forge-text mb-1">API Documentation</h3>
          <p className="text-sm text-forge-muted">Full API reference and guides</p>
        </Link>

        {/* Webhooks card */}
        <Link
          href="/dashboard/webhooks"
          className="group bg-white rounded-xl border border-forge-border p-6 hover:border-forge-primary hover:shadow-lg hover:shadow-forge-primary/5 transition-all"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <svg className="w-5 h-5 text-forge-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="font-bold text-forge-text mb-1">Webhooks</h3>
          <p className="text-sm text-forge-muted">Configure event notifications</p>
        </Link>
      </div>

      {/* Quick reference */}
      <div className="bg-white rounded-xl border border-forge-border p-6">
        <h2 className="text-lg font-bold text-forge-text mb-4">Quick Reference</h2>

        {/* Base URL */}
        <div className="mb-6">
          <label className="text-xs font-bold text-forge-muted uppercase tracking-wider mb-2 block">Base URL</label>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <code className="flex-1 text-sm font-mono text-forge-text">{baseUrl}</code>
            <CopyButton text={baseUrl} />
          </div>
        </div>

        {/* Example cURL */}
        <div>
          <label className="text-xs font-bold text-forge-muted uppercase tracking-wider mb-2 block">Example Request</label>
          <div className="relative rounded-lg bg-gray-900">
            <button
              onClick={handleCopyCurl}
              className="absolute top-3 right-3 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              {curlCopied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
              <code className="text-green-400 font-mono">{exampleCurl}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Recent API activity placeholder */}
      <div className="bg-white rounded-xl border border-forge-border p-6">
        <h2 className="text-lg font-bold text-forge-text mb-4">Recent API Activity</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-forge-text mb-1">No activity yet</p>
          <p className="text-sm text-forge-muted">
            API request logging will appear here once enabled.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-forge-border p-6">
        <h2 className="text-lg font-bold text-forge-text mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/docs"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-forge-primary hover:bg-indigo-50/50 transition-colors"
          >
            <svg className="w-5 h-5 text-forge-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-forge-text">API Reference</p>
              <p className="text-xs text-forge-muted">Full documentation</p>
            </div>
          </Link>
          <Link
            href="/docs/quickstart"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-forge-primary hover:bg-indigo-50/50 transition-colors"
          >
            <svg className="w-5 h-5 text-forge-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-forge-text">Quickstart</p>
              <p className="text-xs text-forge-muted">Get started in 5 min</p>
            </div>
          </Link>
          <Link
            href="/dashboard/webhooks"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-forge-primary hover:bg-indigo-50/50 transition-colors"
          >
            <svg className="w-5 h-5 text-forge-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-forge-text">Webhooks</p>
              <p className="text-xs text-forge-muted">Event notifications</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
