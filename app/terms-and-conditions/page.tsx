"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CheckCircle2, ShieldAlert, Scale, CreditCard, RefreshCcw, AlertTriangle, FileText, Mail } from "lucide-react";

const SECTIONS = [
    { id: "acceptance", title: "1. Acceptance of Terms", icon: CheckCircle2 },
    { id: "license", title: "2. Use License", icon: Scale },
    { id: "service", title: "3. Service Description", icon: ShieldAlert },
    { id: "payment", title: "4. Payment Terms", icon: CreditCard },
    { id: "subscription", title: "5. Subscription & Cancellation", icon: RefreshCcw },
    { id: "liability", title: "6. Limitation of Liability", icon: AlertTriangle },
    { id: "modifications", title: "7. Modifications", icon: FileText },
    { id: "contact", title: "8. Contact", icon: Mail },
];

export default function TermsAndConditions() {
    const [activeSection, setActiveSection] = useState("acceptance");

    // Intersection Observer to highlight active section in sidebar
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                        entry.target.classList.add("animate-in", "fade-in", "slide-in-from-bottom-8", "duration-700");
                    }
                });
            },
            { rootMargin: "-100px 0px -40% 0px", threshold: 0.1 }
        );

        document.querySelectorAll("section[id]").forEach((section) => {
            // Add initial opacity-0 to elements before they are observed for the scroll effect
            section.classList.add("opacity-0");
            observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.offsetTop - 100,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-gray-900 font-sans selection:bg-green-100 selection:text-green-900">
            <Header />

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-slate-900 py-24 text-center text-white sm:py-32">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <div className="relative z-10 mx-auto max-w-3xl px-6">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-green-400">Legal Agreement</p>
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Terms of Service</h1>
                    <p className="text-lg leading-relaxed text-slate-300">
                        Please read these terms carefully before using Restaurant Intel. They form a binding legal agreement. <br className="hidden sm:block" />
                        Last updated: March 2026
                    </p>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-6 py-16 lg:flex-row lg:py-24">

                {/* Sticky Sidebar */}
                <aside className="hidden w-64 shrink-0 lg:block">
                    <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Contents</h3>
                        <nav className="flex flex-col gap-2">
                            {SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollTo(section.id)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${activeSection === section.id
                                            ? "bg-green-50 text-green-700"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <section.icon className={`h-4 w-4 ${activeSection === section.id ? "text-green-600" : "text-gray-400"}`} />
                                    <span className="text-left">{section.title}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 space-y-16 pb-24">
                    <section id="acceptance" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">1. Acceptance of Terms</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                By accessing or using the Restaurant Intel platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                            <p>
                                We reserve the right to update and change the Terms of Service from time to time without notice. Any new features that augment or enhance the current Service, including the release of new tools and resources, shall be subject to the Terms of Service.
                            </p>
                        </div>
                    </section>

                    <section id="license" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Scale className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">2. Use License</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Permission is granted to temporarily access the materials (information or software) on Restaurant Intel's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                            </p>
                            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-gray-400">
                                <li>modify or copy the materials;</li>
                                <li>use the materials for any commercial purpose, or for any public display;</li>
                                <li>attempt to decompile or reverse engineer any software contained on the platform;</li>
                                <li>remove any copyright or other proprietary notations from the materials; or</li>
                                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="service" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">3. Service Description</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Restaurant Intel provides business analytics, financial insights, and labor tracking specifically designed for restaurant owners. The service converts CSV data into actionable metrics.
                            </p>
                            <p>
                                We strive to ensure the accuracy of our insights, but the Service is provided on an "as is" and "as available" basis. We do not warrant that the service will meet your specific requirements, be uninterrupted, timely, secure, or error-free.
                            </p>
                        </div>
                    </section>

                    <section id="payment" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">4. Payment Terms</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                A valid credit card is required for paying accounts after the standard 14-day free trial period. The service is billed in advance on a monthly or annual basis and is non-refundable.
                            </p>
                            <p>
                                There will be no refunds or credits for partial months of service, upgrade/downgrade refunds, or refunds for months unused with an open account. In order to treat everyone equally, no exceptions will be made.
                            </p>
                        </div>
                    </section>

                    <section id="subscription" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <RefreshCcw className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">5. Subscription & Cancellation</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                You are solely responsible for properly canceling your account. An email or phone request to cancel your account is not considered cancellation. You can cancel your account at any time by clicking on your account settings and finding the subscription management portal.
                            </p>
                            <p>
                                If you cancel the Service before the end of your current paid up month, your cancellation will take effect immediately, and you will not be charged again.
                            </p>
                        </div>
                    </section>

                    <section id="liability" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">6. Limitation of Liability</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                In no event shall Restaurant Intel or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Restaurant Intel's website, even if Restaurant Intel or an authorized representative has been notified orally or in writing of the possibility of such damage.
                            </p>
                        </div>
                    </section>

                    <section id="modifications" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">7. Modifications</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Restaurant Intel may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
                            </p>
                        </div>
                    </section>

                    <section id="contact" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                <Mail className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">8. Contact Us</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                If you have any questions about these Terms, please contact us at:
                            </p>
                            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <a href="mailto:support@restaurantintel.com" className="text-lg font-medium text-green-600 hover:text-green-700 hover:underline">
                                    support@restaurantintel.com
                                </a>
                                <p className="mt-2 text-sm text-gray-500">We aim to respond to all inquiries within 24 hours.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
