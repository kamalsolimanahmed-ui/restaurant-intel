"use client";

import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { RotateCcw, HelpCircle, XCircle, Mail } from "lucide-react";

export default function RefundPolicyPage() {
    const lastUpdated = "March 2026";

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            <Header />

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-slate-900 py-24 text-center text-white sm:py-32">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40"></div>
                <div className="relative z-10 mx-auto max-w-3xl px-6">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-400">Rest Assured</p>
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Refund Policy</h1>
                    <p className="text-lg leading-relaxed text-slate-300">
                        We stand by our product with a simple, no-questions-asked guarantee. <br className="hidden sm:block" />
                        Last updated: {lastUpdated}
                    </p>
                </div>
            </div>

            <main className="mx-auto w-full max-w-3xl px-6 py-16 lg:py-24">

                <div className="space-y-12">
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                <RotateCcw className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">30-Day Money Back Guarantee</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                We offer a 30-day money-back guarantee. If you're not satisfied with Restaurant Intel for any reason, contact us within 30 days of your first payment for a full refund.
                            </p>
                        </div>
                    </section>

                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">How to Request a Refund</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Email <a href="mailto:support@restaurantintel.com" className="text-purple-600 hover:text-purple-700 font-medium">support@restaurantintel.com</a> with your request. We'll verify your account details and process your refund within 5-7 business days. No hassle, no complicated forms.
                            </p>
                        </div>
                    </section>

                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Cancellation</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                You can cancel your subscription anytime directly from your billing dashboard. If you cancel outside of the 30-day window, no further charges will be applied, and your access continues until the end of your current billing period.
                            </p>
                        </div>
                    </section>

                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                <Mail className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Contact</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                If you have questions about our billing or refund policies, we are here to help.
                            </p>
                            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <a href="mailto:support@restaurantintel.com" className="text-lg font-medium text-purple-600 hover:text-purple-700 hover:underline">
                                    support@restaurantintel.com
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
