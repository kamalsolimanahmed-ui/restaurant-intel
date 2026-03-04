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
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
            <h1>Restaurant Intel Pro</h1>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>$15/month</p>
            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '6px', marginTop: '15px', marginBottom: '15px', border: '1px solid #f87171', fontWeight: '500' }}>
                    {error}
                </div>
            )}
            <button
                onClick={handleCheckout}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: loading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    marginTop: '20px'
                }}
            >
                {loading ? 'Loading...' : 'Upgrade to Pro'}
            </button>
        </div>
    )
}
