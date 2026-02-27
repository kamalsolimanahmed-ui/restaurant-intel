"use client";

import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { Header } from "@/components/shared/Header";

export default function CheckoutPage() {
    const handleContinue = async () => {
        try {
            const res = await fetch("/api/paddle/checkout", { method: "POST" });
            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        } catch (err) {
            console.error("Checkout error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        {/* Header band */}
                        <div className="bg-green-600 px-8 py-5 text-white">
                            <p className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-1">
                                Order Summary
                            </p>
                            <h1 className="text-2xl font-bold">Restaurant Intel Pro</h1>
                        </div>

                        {/* Body */}
                        <div className="px-8 py-8">
                            {/* Price line */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                                <div>
                                    <p className="font-semibold text-gray-900">Pro Plan</p>
                                    <p className="text-sm text-gray-500">Unlimited analyses</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">$15</p>
                                    <p className="text-sm text-gray-400">/month</p>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between mb-6">
                                <p className="font-semibold text-gray-700">Total due today</p>
                                <p className="text-xl font-bold text-green-600">$15.00</p>
                            </div>

                            <p className="text-xs text-gray-400 mb-6 text-center">
                                Billed monthly. Cancel anytime, no questions asked.
                            </p>

                            {/* CTA */}
                            <button
                                id="continue-to-payment-btn"
                                onClick={handleContinue}
                                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Continue to Payment
                            </button>

                            {/* Security badge */}
                            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                <span className="text-xs">
                                    Secured by{" "}
                                    <span className="font-semibold text-gray-600">Paddle</span> ·
                                    256-bit SSL encryption
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Back link */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Changed your mind?{" "}
                        <Link
                            href="/pricing"
                            className="text-green-600 hover:underline font-medium"
                        >
                            View pricing plans
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
