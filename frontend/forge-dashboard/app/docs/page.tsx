'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type CodeTab = 'curl' | 'javascript' | 'python'

interface Param {
  name: string
  type: string
  required: boolean
  description: string
}

interface StatusCode {
  code: number
  description: string
}

interface Endpoint {
  id: string
  method: Method
  path: string
  title: string
  description: string
  params?: Param[]
  requestBody?: string
  responseBody: string
  statusCodes: StatusCode[]
}

/* ------------------------------------------------------------------ */
/*  Sidebar sections                                                  */
/* ------------------------------------------------------------------ */
interface SidebarSection {
  title: string
  id: string
  children?: { title: string; id: string }[]
}

const sidebarSections: SidebarSection[] = [
  { title: 'Getting Started', id: 'getting-started', children: [{ title: 'Quickstart Guide', id: 'quickstart-link' }] },
  { title: 'Authentication', id: 'authentication' },
  {
    title: 'Payouts',
    id: 'payouts',
    children: [
      { title: 'Create Batch', id: 'post-payout-batches' },
      { title: 'Single Payout', id: 'post-payouts' },
    ],
  },
  {
    title: 'Batches',
    id: 'batches',
    children: [
      { title: 'Get Batch', id: 'get-batch' },
      { title: 'Batch Transactions', id: 'get-batch-transactions' },
    ],
  },
  {
    title: 'Transactions',
    id: 'transactions',
    children: [
      { title: 'List', id: 'get-transactions' },
      { title: 'Detail', id: 'get-transaction-detail' },
    ],
  },
  {
    title: 'Banks',
    id: 'banks',
    children: [
      { title: 'List Banks', id: 'get-banks' },
      { title: 'Normalize', id: 'get-banks-normalize' },
    ],
  },
  { title: 'Errors', id: 'errors' },
  { title: 'Rate Limiting', id: 'rate-limiting' },
]

/* ------------------------------------------------------------------ */
/*  Endpoints data                                                    */
/* ------------------------------------------------------------------ */
const endpoints: Endpoint[] = [
  {
    id: 'post-payout-batches',
    method: 'POST',
    path: '/api/v1/payout-batches',
    title: 'Create Payment Batch',
    description: 'Create a new batch of payments to be processed. Each payment in the batch will be validated and queued for processing.',
    requestBody: JSON.stringify(
      {
        payments: [
          {
            recipientName: 'John Doe',
            bankName: 'Access Bank',
            accountNumber: '0123456789',
            amount: 50000,
          },
        ],
      },
      null,
      2,
    ),
    responseBody: JSON.stringify(
      {
        success: true,
        data: {
          id: 'batch_abc123',
          totalRecords: 1,
          validRecords: 1,
          status: 'pending',
        },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 201, description: 'Batch created successfully' },
      { code: 400, description: 'Validation error in request body' },
      { code: 401, description: 'Missing or invalid API key' },
      { code: 429, description: 'Rate limit exceeded' },
    ],
  },
  {
    id: 'post-payouts',
    method: 'POST',
    path: '/api/v1/payouts',
    title: 'Single Payout',
    description: 'Create a single payout transaction. The payment will be validated and queued for processing immediately.',
    requestBody: JSON.stringify(
      {
        recipientName: 'Jane Smith',
        bankName: 'GTBank',
        accountNumber: '0987654321',
        amount: 50000,
      },
      null,
      2,
    ),
    responseBody: JSON.stringify(
      {
        success: true,
        data: {
          id: 'txn_xyz789',
          recipientName: 'Jane Smith',
          bankName: 'Guaranty Trust Bank',
          accountNumber: '0987654321',
          amount: 50000,
          status: 'pending',
        },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 201, description: 'Payout created successfully' },
      { code: 400, description: 'Validation error' },
      { code: 401, description: 'Unauthorized' },
    ],
  },
  {
    id: 'get-batch',
    method: 'GET',
    path: '/api/v1/payout-batches/{id}',
    title: 'Get Batch Status',
    description: 'Retrieve the current status and details of a specific payout batch by its ID.',
    params: [{ name: 'id', type: 'string', required: true, description: 'The batch ID' }],
    responseBody: JSON.stringify(
      {
        success: true,
        data: {
          id: 'batch_abc123',
          totalRecords: 1,
          validRecords: 1,
          invalidRecords: 0,
          status: 'completed',
          createdAt: '2026-03-11T10:00:00Z',
        },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 200, description: 'Batch details returned' },
      { code: 404, description: 'Batch not found' },
      { code: 401, description: 'Unauthorized' },
    ],
  },
  {
    id: 'get-batch-transactions',
    method: 'GET',
    path: '/api/v1/payout-batches/{id}/transactions',
    title: 'Get Batch Transactions',
    description: 'List all transactions belonging to a specific payout batch.',
    params: [{ name: 'id', type: 'string', required: true, description: 'The batch ID' }],
    responseBody: JSON.stringify(
      {
        success: true,
        data: [
          {
            id: 'txn_001',
            recipientName: 'John Doe',
            bankName: 'Access Bank',
            amount: 50000,
            status: 'completed',
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 1 },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 200, description: 'Transactions returned' },
      { code: 404, description: 'Batch not found' },
    ],
  },
  {
    id: 'get-transactions',
    method: 'GET',
    path: '/api/v1/transactions',
    title: 'List Transactions',
    description: 'Retrieve a paginated list of all transactions. Supports filtering by status.',
    params: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status: pending, completed, failed' },
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'pageSize', type: 'number', required: false, description: 'Items per page (default: 20)' },
    ],
    responseBody: JSON.stringify(
      {
        success: true,
        data: [
          {
            id: 'txn_001',
            recipientName: 'John Doe',
            amount: 50000,
            status: 'completed',
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 42 },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 200, description: 'Transactions returned' },
      { code: 401, description: 'Unauthorized' },
    ],
  },
  {
    id: 'get-transaction-detail',
    method: 'GET',
    path: '/api/v1/transactions/{id}',
    title: 'Transaction Detail',
    description: 'Get complete details for a single transaction including processing history.',
    params: [{ name: 'id', type: 'string', required: true, description: 'The transaction ID' }],
    responseBody: JSON.stringify(
      {
        success: true,
        data: {
          id: 'txn_001',
          recipientName: 'John Doe',
          bankName: 'Access Bank',
          accountNumber: '0123456789',
          amount: 50000,
          status: 'completed',
          batchId: 'batch_abc123',
          createdAt: '2026-03-11T10:00:00Z',
          completedAt: '2026-03-11T10:01:30Z',
        },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 200, description: 'Transaction returned' },
      { code: 404, description: 'Transaction not found' },
    ],
  },
  {
    id: 'get-banks',
    method: 'GET',
    path: '/api/v1/banks',
    title: 'List Supported Banks',
    description: 'Retrieve a list of all supported bank names and their codes.',
    responseBody: JSON.stringify(
      {
        success: true,
        data: [
          { name: 'Access Bank', code: '044' },
          { name: 'Guaranty Trust Bank', code: '058' },
          { name: 'First Bank of Nigeria', code: '011' },
        ],
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 200, description: 'Banks returned' },
      { code: 401, description: 'Unauthorized' },
    ],
  },
  {
    id: 'get-banks-normalize',
    method: 'GET',
    path: '/api/v1/banks/normalize',
    title: 'Normalize Bank Name',
    description: 'Use AI-powered normalization to resolve shorthand or misspelled bank names to their official form.',
    params: [{ name: 'name', type: 'string', required: true, description: 'The bank name to normalize (e.g. "GTB", "access", "first bk")' }],
    responseBody: JSON.stringify(
      {
        success: true,
        data: {
          input: 'GTB',
          normalized: 'Guaranty Trust Bank',
          confidence: 0.98,
        },
      },
      null,
      2,
    ),
    statusCodes: [
      { code: 200, description: 'Normalized bank name returned' },
      { code: 400, description: 'Missing name parameter' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Code examples                                                     */
/* ------------------------------------------------------------------ */
const codeExamples: Record<CodeTab, string> = {
  curl: `curl -X POST https://api.forgeapi.com/api/v1/payout-batches \\
  -H "X-Api-Key: forge_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payments": [
      {
        "recipientName": "John Doe",
        "bankName": "Access Bank",
        "accountNumber": "0123456789",
        "amount": 50000
      }
    ]
  }'`,
  javascript: `const response = await fetch('https://api.forgeapi.com/api/v1/payout-batches', {
  method: 'POST',
  headers: {
    'X-Api-Key': 'forge_your_api_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    payments: [
      {
        recipientName: 'John Doe',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        amount: 50000,
      },
    ],
  }),
})

const data = await response.json()
console.log(data)`,
  python: `import requests

response = requests.post(
    'https://api.forgeapi.com/api/v1/payout-batches',
    headers={'X-Api-Key': 'forge_your_api_key_here'},
    json={
        'payments': [
            {
                'recipientName': 'John Doe',
                'bankName': 'Access Bank',
                'accountNumber': '0123456789',
                'amount': 50000,
            }
        ]
    }
)

print(response.json())`,
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const methodColor: Record<Method, string> = {
  GET: 'bg-blue-100 text-blue-700 border-blue-200',
  POST: 'bg-green-100 text-green-700 border-green-200',
  PUT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
}

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

function CodeBlock({ code, className = '' }: { code: string; className?: string }) {
  return (
    <div className={`relative rounded-lg bg-gray-900 ${className}`}>
      <CopyButton text={code} />
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-green-400 font-mono">{code}</code>
      </pre>
    </div>
  )
}

function ParamsTable({ params }: { params: Param[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2 font-semibold text-gray-700">Parameter</th>
            <th className="px-4 py-2 font-semibold text-gray-700">Type</th>
            <th className="px-4 py-2 font-semibold text-gray-700">Required</th>
            <th className="px-4 py-2 font-semibold text-gray-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-t border-gray-100">
              <td className="px-4 py-2 font-mono text-sm text-forge-primary">{p.name}</td>
              <td className="px-4 py-2 text-gray-600">{p.type}</td>
              <td className="px-4 py-2">
                {p.required ? (
                  <span className="text-red-600 font-medium">Yes</span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-600">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusCodesTable({ codes }: { codes: StatusCode[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
            <th className="px-4 py-2 font-semibold text-gray-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.code} className="border-t border-gray-100">
              <td className="px-4 py-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${c.code < 300 ? 'bg-green-100 text-green-700' : c.code < 400 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {c.code}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-600">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EndpointSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <section id={endpoint.id} className="scroll-mt-8 pb-10 border-b border-gray-100 last:border-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${methodColor[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{endpoint.title}</h3>
      <p className="text-gray-600 mb-4">{endpoint.description}</p>

      {/* Auth */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>API Key required in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">X-Api-Key</code> header</span>
      </div>

      {/* Parameters */}
      {endpoint.params && endpoint.params.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
          <ParamsTable params={endpoint.params} />
        </div>
      )}

      {/* Request body */}
      {endpoint.requestBody && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h4>
          <CodeBlock code={endpoint.requestBody} />
        </div>
      )}

      {/* Response */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Response</h4>
        <CodeBlock code={endpoint.responseBody} />
      </div>

      {/* Status codes */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Status Codes</h4>
        <StatusCodesTable codes={endpoint.statusCodes} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [codeTab, setCodeTab] = useState<CodeTab>('curl')

  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarSections.flatMap((s) => [s.id, ...(s.children?.map((c) => c.id) ?? [])])
      for (const id of sections.reverse()) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120) {
            setActiveSection(id)
            return
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    if (id === 'quickstart-link') {
      return
    }
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <span className="text-sm font-semibold text-gray-600">API Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/docs/quickstart"
              className="text-sm font-medium text-gray-600 hover:text-forge-primary transition-colors"
            >
              Quickstart
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

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto py-8 px-4 space-y-1">
            {sidebarSections.map((section) => (
              <div key={section.id}>
                {section.id === 'quickstart-link' ? null : (
                  <button
                    onClick={() => scrollTo(section.id)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      activeSection === section.id
                        ? 'text-forge-primary bg-indigo-50'
                        : 'text-gray-700 hover:text-forge-primary hover:bg-gray-50'
                    }`}
                  >
                    {section.title}
                  </button>
                )}
                {section.children?.map((child) =>
                  child.id === 'quickstart-link' ? (
                    <Link
                      key={child.id}
                      href="/docs/quickstart"
                      className="block pl-6 pr-3 py-1.5 text-sm text-gray-500 hover:text-forge-primary transition-colors"
                    >
                      {child.title}
                    </Link>
                  ) : (
                    <button
                      key={child.id}
                      onClick={() => scrollTo(child.id)}
                      className={`block w-full text-left pl-6 pr-3 py-1.5 text-sm transition-colors ${
                        activeSection === child.id
                          ? 'text-forge-primary font-medium'
                          : 'text-gray-500 hover:text-forge-primary'
                      }`}
                    >
                      {child.title}
                    </button>
                  ),
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-8 px-6 lg:px-12">
          {/* Getting started */}
          <section id="getting-started" className="scroll-mt-24 mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Forge API Reference</h1>
            <p className="text-gray-600 text-lg mb-6">
              Complete reference documentation for the Forge Payments API. Build payment integrations with bulk payouts,
              transaction tracking, and AI-powered bank name normalization.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                <span className="text-xs font-medium text-gray-500">BASE URL</span>
                <code className="text-sm font-mono font-semibold text-gray-900">https://api.forgeapi.com/api/v1</code>
              </div>
            </div>
            <Link
              href="/docs/quickstart"
              className="inline-flex items-center gap-2 text-forge-primary font-semibold text-sm hover:underline"
            >
              Follow the Quickstart Guide
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </section>

          {/* Authentication */}
          <section id="authentication" className="scroll-mt-24 mb-12 pb-10 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              All API requests require an API key passed in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">X-Api-Key</code> header.
              You can generate API keys from the{' '}
              <Link href="/dashboard/api-keys" className="text-forge-primary hover:underline">
                Dashboard
              </Link>.
            </p>
            <CodeBlock code={`curl -H "X-Api-Key: forge_your_api_key_here" https://api.forgeapi.com/api/v1/banks`} />

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Permissions</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2 font-semibold text-gray-700">Permission</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-sm text-forge-primary">read</td>
                      <td className="px-4 py-2 text-gray-600">Read-only access to transactions, batches, and banks</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-sm text-forge-primary">write</td>
                      <td className="px-4 py-2 text-gray-600">Create payouts, batches, and manage transactions</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-sm text-forge-primary">admin</td>
                      <td className="px-4 py-2 text-gray-600">Full access including API key management and org settings</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section id="payouts" className="scroll-mt-24 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payouts</h2>
          </section>
          {endpoints.filter((e) => e.id.startsWith('post-payout') || e.id === 'post-payouts').map((ep) => (
            <EndpointSection key={ep.id} endpoint={ep} />
          ))}

          <section id="batches" className="scroll-mt-24 mt-10 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Batches</h2>
          </section>
          {endpoints.filter((e) => e.id.startsWith('get-batch')).map((ep) => (
            <EndpointSection key={ep.id} endpoint={ep} />
          ))}

          <section id="transactions" className="scroll-mt-24 mt-10 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transactions</h2>
          </section>
          {endpoints.filter((e) => e.id.startsWith('get-transaction')).map((ep) => (
            <EndpointSection key={ep.id} endpoint={ep} />
          ))}

          <section id="banks" className="scroll-mt-24 mt-10 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Banks</h2>
          </section>
          {endpoints.filter((e) => e.id.startsWith('get-bank')).map((ep) => (
            <EndpointSection key={ep.id} endpoint={ep} />
          ))}

          {/* Code examples */}
          <section className="scroll-mt-24 mt-12 mb-12 pb-10 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Code Examples</h2>
            <p className="text-gray-600 mb-6">Examples for creating a payout batch across different languages.</p>

            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
              {(['curl', 'javascript', 'python'] as CodeTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCodeTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    codeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'javascript' ? 'JavaScript' : 'Python'}
                </button>
              ))}
            </div>
            <CodeBlock code={codeExamples[codeTab]} />
          </section>

          {/* Errors */}
          <section id="errors" className="scroll-mt-24 mb-12 pb-10 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Responses</h2>
            <p className="text-gray-600 mb-4">
              All error responses follow a consistent format. The <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">success</code> field
              will be <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">false</code>, and the response will include a human-readable message
              and optional error details.
            </p>
            <CodeBlock
              code={JSON.stringify(
                {
                  success: false,
                  message: 'Validation failed',
                  errors: [
                    { field: 'amount', message: 'Amount must be a positive number' },
                    { field: 'bankName', message: 'Bank name is required' },
                  ],
                },
                null,
                2,
              )}
            />
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Error Codes</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [400, 'Bad Request -- Invalid parameters or request body'],
                      [401, 'Unauthorized -- Missing or invalid API key'],
                      [403, 'Forbidden -- Insufficient permissions'],
                      [404, 'Not Found -- Resource does not exist'],
                      [429, 'Too Many Requests -- Rate limit exceeded'],
                      [500, 'Internal Server Error -- Something went wrong on our end'],
                    ].map(([code, desc]) => (
                      <tr key={code} className="border-t border-gray-100">
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${Number(code) < 500 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {code}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Rate limiting */}
          <section id="rate-limiting" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Limiting</h2>
            <p className="text-gray-600 mb-4">
              API requests are rate limited per API key. When you exceed the limit, you will receive a{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">429</code> status code.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900">100</p>
                <p className="text-sm text-gray-500">requests per minute</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900">1,000</p>
                <p className="text-sm text-gray-500">requests per hour</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Limit Headers</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 font-semibold text-gray-700">Header</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-sm text-forge-primary">X-RateLimit-Remaining</td>
                    <td className="px-4 py-2 text-gray-600">Number of requests remaining in the current window</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-sm text-forge-primary">X-RateLimit-Reset</td>
                    <td className="px-4 py-2 text-gray-600">Unix timestamp when the rate limit window resets</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
