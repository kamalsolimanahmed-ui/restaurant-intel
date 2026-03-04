'use client'

import { useState } from 'react'

export default function CheckoutPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCheckout = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
            })
            const data = await res.json()

            if (!res.ok) {
                if (res.status === 401) {
                    window.location.href = '/auth/login?callbackUrl=/checkout'
                    return
                }
                throw new Error(data.error || 'Failed to initialize checkout')
            }

            // Redirect to Stripe checkout
            window.location.href = data.url
        } catch (err: any) {
            console.error('Checkout error:', err)
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Intel Pro</h1>
                <p className="text-4xl font-extrabold text-green-600 mb-6">$15<span className="text-lg text-gray-400 font-medium">/month</span></p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 mb-6 font-medium text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all 
                        ${loading
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 hover:shadow-md active:bg-green-800'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : 'Upgrade to Pro'}
                </button>
            </div>
        </div>
    )
}
