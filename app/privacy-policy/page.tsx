"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Database, Eye, ShieldCheck, Link2, Users, Mail } from "lucide-react";

const SECTIONS = [
    { id: "collect", title: "1. Information We Collect", icon: Database },
    { id: "use", title: "2. How We Use Your Data", icon: Eye },
    { id: "security", title: "3. Data Security", icon: ShieldCheck },
    { id: "third-party", title: "4. Third-Party Services", icon: Link2 },
    { id: "rights", title: "5. Your Rights", icon: Users },
    { id: "contact", title: "6. Contact Us", icon: Mail },
];

export default function PrivacyPolicy() {
    const [activeSection, setActiveSection] = useState("collect");

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
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Header />

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-slate-900 py-24 text-center text-white sm:py-32">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-50"></div>
                <div className="absolute top-0 right-0 -mr-40 -mt-40 h-96 w-96 rounded-full bg-blue-900/40 blur-3xl"></div>
                <div className="relative z-10 mx-auto max-w-3xl px-6">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-400">Data & Security</p>
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Privacy Policy</h1>
                    <p className="text-lg leading-relaxed text-slate-300">
                        Your privacy is our utmost priority. We believe in complete transparency about how we collect, use, and protect your data. <br className="hidden sm:block" />
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
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <section.icon className={`h-4 w-4 ${activeSection === section.id ? "text-blue-600" : "text-gray-400"}`} />
                                    <span className="text-left">{section.title}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 space-y-16 pb-24">

                    <section id="collect" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                                <Database className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">1. Information We Collect</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                To provide our financial reporting services effectively, Restaurant Intel collects the following types of information:
                            </p>
                            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                                <p className="text-sm">Email address, restaurant name, location data, and securely hashed passwords used during registration.</p>
                                <hr className="my-4 border-gray-100" />
                                <h4 className="font-semibold text-gray-900 mb-2">Financial & CSV Data</h4>
                                <p className="text-sm">Information uploaded via CSV regarding your restaurant's sales, labor costs, and operational expenses. We do NOT collect customer credit card numbers or individual patron data.</p>
                                <hr className="my-4 border-gray-100" />
                                <h4 className="font-semibold text-gray-900 mb-2">Usage Data</h4>
                                <p className="text-sm">Technical logs, IP addresses, browser types, and usage patterns to help us improve the application functionality.</p>
                            </div>
                        </div>
                    </section>

                    <section id="use" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Eye className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">2. How We Use Your Data</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Your data is strictly used to deliver value to your business. We use the information we collect in the following ways:
                            </p>
                            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-gray-400">
                                <li>To generate your financial reports, health scores, and actionable insights.</li>
                                <li>To maintain, improve, and personalize the Platform.</li>
                                <li>To process transactions and manage your subscription.</li>
                                <li>To send you important system updates, alert notifications, or operational emails.</li>
                            </ul>
                            <div className="mt-6 rounded-lg bg-green-50 p-4 text-green-800 text-sm font-medium border border-green-200">
                                Data Selling Pledge: We will never sell, rent, or trade your restaurant's financial data to third-party marketers or aggregators. Your numbers are yours alone.
                            </div>
                        </div>
                    </section>

                    <section id="security" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">3. Data Security</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                We implement industry-standard security measures to maintain the safety of your personal and financial information. Our security practices include:
                            </p>
                            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-gray-400">
                                <li>End-to-end encryption for data in transit (HTTPS/SSL).</li>
                                <li>Secure server architecture and encrypted database storage via modern cloud providers.</li>
                                <li>Strict access controls and Row Level Security for isolating user tenant data.</li>
                                <li>Routine automated backups to prevent data loss.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="third-party" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                <Link2 className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">4. Third-Party Services</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                We employ trusted third-party companies and individuals to facilitate our Service. These parties have access to your Data only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2 mt-6">
                                <div className="rounded-xl border border-gray-200 p-4">
                                    <h4 className="font-semibold text-gray-900">Supabase / PostgreSQL</h4>
                                    <p className="text-sm text-gray-500 mt-1">Our primary database infrastructure and authentication provider. Data is stored securely in compliant servers.</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-4">
                                    <h4 className="font-semibold text-gray-900">Payment Processors</h4>
                                    <p className="text-sm text-gray-500 mt-1">We utilize secure third-party payment gateways (like Paddle/Stripe) to process subscription billing.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="rights" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <Users className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">5. Your Rights</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Depending on your location, you may have specific rights regarding your personal information, such as the right to:
                            </p>
                            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-gray-400">
                                <li>Request access to the personal data we hold about you.</li>
                                <li>Request that we correct any inaccuracies.</li>
                                <li>Request the deletion of your account and all associated database records (Right to be Forgotten).</li>
                                <li>Export your uploaded data at any time.</li>
                            </ul>
                            <p className="mt-4">
                                You can execute account deletions or data exports directly from your dashboard settings, or by contacting our support team.
                            </p>
                        </div>
                    </section>

                    <section id="contact" className="scroll-mt-28 fill-mode-forwards opacity-0">
                        <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                <Mail className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">6. Contact Us</h2>
                        </div>
                        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                            <p>
                                Your trust is incredibly important to us. If you have any questions, concerns, or requests related to your privacy, please don't hesitate to reach out.
                            </p>
                            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <a href="mailto:privacy@restaurantintel.com" className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                    privacy@restaurantintel.com
                                </a>
                                <p className="mt-2 text-sm text-gray-500">Our privacy and security team will respond within 24-48 hours.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
