"use client";

import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-gray-900 font-sans selection:bg-green-100 selection:text-green-900">
            <Header />

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-slate-900 py-24 text-center text-white sm:py-32">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <div className="relative z-10 mx-auto max-w-3xl px-6">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-green-400">Simple Pricing</p>
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Everything you need. No surprises.</h1>
                    <p className="text-lg leading-relaxed text-slate-300">
                        Start saving money on your restaurant operations today with our simple, transparent pricing.
                    </p>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-16 lg:py-24">

                {/* Pricing Card */}
                <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-xl sm:p-10">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Restaurant Intel Pro</h2>

                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold tracking-tight text-green-600">$15</span>
                        <span className="text-base font-medium text-gray-500">/month</span>
                    </div>

                    <p className="mt-6 text-base text-gray-600">
                        Get complete financial clarity and identify where you are losing money in minutes.
                    </p>

                    <ul className="mt-8 space-y-4 text-sm leading-6 text-gray-600">
                        <li className="flex gap-x-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Check className="h-4 w-4" />
                            </div>
                            Monthly financial analysis
                        </li>
                        <li className="flex gap-x-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Check className="h-4 w-4" />
                            </div>
                            Health score & insights
                        </li>
                        <li className="flex gap-x-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Check className="h-4 w-4" />
                            </div>
                            PDF report download
                        </li>
                        <li className="flex gap-x-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Check className="h-4 w-4" />
                            </div>
                            Works with any POS system
                        </li>
                        <li className="flex gap-x-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Check className="h-4 w-4" />
                            </div>
                            14-day free trial
                        </li>
                    </ul>

                    <Button asChild className="mt-8 w-full bg-green-600 py-6 text-lg font-semibold hover:bg-green-700">
                        <Link href="/auth/signup">Start Free Trial</Link>
                    </Button>
                    <p className="mt-4 text-center text-xs text-gray-500">No credit card required for trial.</p>
                </div>

            </main>

            <Footer />
        </div>
    );
}
