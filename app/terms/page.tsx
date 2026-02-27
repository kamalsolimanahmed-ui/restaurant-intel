import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: February 24, 2025
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 mb-4">
              By accessing or using Restaurant Intel, you agree to be bound by these Terms of Service.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-600 mb-4">
              Restaurant Intel provides restaurant analytics and reporting services based on data you upload.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Subscription and Billing
            </h2>
            <p className="text-gray-600 mb-4">
              We offer a 14-day free trial. After the trial, the service costs $15/month. You may cancel at any time.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Limitation of Liability
            </h2>
            <p className="text-gray-600 mb-4">
              Restaurant Intel is not responsible for any business decisions made based on our analytics.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
