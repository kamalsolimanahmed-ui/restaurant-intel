import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: February 24, 2025
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-gray-600 mb-4">
              We collect information you provide directly to us, including your name, email address, and restaurant data (sales, labor, and expense reports).
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">
              We use your information to provide analytics services, generate reports, and communicate with you about your account.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Data Security
            </h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate security measures to protect your personal information and restaurant data.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Contact Us
            </h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy@restaurantintel.com.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
