'use client'

import { useEffect } from 'react'

// Add Paddle to the Window interface to prevent TypeScript errors
declare global {
    interface Window {
        Paddle?: any;
    }
}

export default function CheckoutPage() {
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
        script.async = true
        script.onload = () => {
            if (window.Paddle) {
                window.Paddle.Initialize({
                    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'live_93cb45b182c9fd6883547a652dc'
                })
            }
        }
        document.body.appendChild(script)
    }, [])

    const handleCheckout = () => {
        if (window.Paddle) {
            window.Paddle.Checkout.open({
                items: [
                    {
                        priceId: 'pri_01kjsq8qh97741bxa8t7jrfpa',
                        quantity: 1
                    }
                ]
            })
        }
    }

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
            <h1>Restaurant Intel Pro</h1>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>$15/month</p>
            <button
                onClick={handleCheckout}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                Start Free Trial
            </button>
        </div>
    )
}
