import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export const metadata = {
    title: "Pricing – Restaurant Intel",
    description:
        "Simple, transparent pricing. Start with a 14-day free trial — no credit card required. Upgrade to Pro for $15/month.",
};

const FREE_FEATURES = [
    "1 analysis per month",
    "Health score & trend tracking",
    "Basic labor & cost overview",
    "CSV & Excel file support",
];

const PRO_FEATURES = [
    "Unlimited analyses",
    "Health score & trend tracking",
    "Labor & prime cost benchmarking",
    "AI-generated action insights",
    "Worst day & best day analysis",
    "PDF report (shareable)",
    "Monthly email reminders",
    "Works with any POS system",
    "US & European restaurants",
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero */}
                <section className="bg-white border-b border-gray-100 py-16 px-4 text-center">
                    <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold tracking-wide">
                        Transparent Pricing
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Start free. Upgrade when ready.
                    </h1>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto">
                        14-day free trial on every account. No credit card required to get
                        started.
                    </p>
                </section>

                {/* Pricing Cards */}
                <section className="py-16 px-4">
                    <div className="mx-auto max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Free Plan */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col">
                            <div className="mb-6">
                                <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">
                                    Free
                                </p>
                                <div className="flex items-end gap-1 mb-1">
                                    <span className="text-5xl font-bold text-gray-900">$0</span>
                                    <span className="text-gray-500 mb-1">/month</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    14-day free trial included
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {FREE_FEATURES.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-gray-700">
                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                id="free-trial-btn"
                                href="/auth/signup"
                                className="block w-full rounded-xl border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-3.5 text-center transition-colors text-sm"
                            >
                                Start Free Trial (14 days)
                            </Link>
                            <p className="text-xs text-gray-400 text-center mt-3">
                                No credit card required
                            </p>
                        </div>

                        {/* Pro Plan */}
                        <div className="rounded-2xl border-2 border-green-500 bg-white p-8 flex flex-col relative shadow-lg shadow-green-100">
                            {/* Popular badge */}
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                    <Zap className="h-3 w-3" /> Most Popular
                                </span>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm font-semibold uppercase tracking-widest text-green-600 mb-2">
                                    Pro
                                </p>
                                <div className="flex items-end gap-1 mb-1">
                                    <span className="text-5xl font-bold text-gray-900">$15</span>
                                    <span className="text-gray-500 mb-1">/month</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Billed monthly. Cancel anytime.
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {PRO_FEATURES.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-gray-700">
                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                id="upgrade-pro-btn"
                                href="/checkout"
                                className="block w-full rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3.5 text-center transition-colors text-sm"
                            >
                                Upgrade to Pro →
                            </Link>
                            <p className="text-xs text-gray-400 text-center mt-3">
                                Secure checkout · Cancel anytime
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ CTA */}
                <section className="py-12 px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        Questions?{" "}
                        <a
                            href="mailto:hello@restaurantintel.com"
                            className="text-green-600 hover:underline font-medium"
                        >
                            Email us
                        </a>{" "}
                        — we reply within 24 hours.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
