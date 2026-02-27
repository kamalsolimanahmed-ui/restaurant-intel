import Link from "next/link";
import { Check } from "lucide-react";

export function Pricing() {
  const features = [
    "Monthly + yearly analysis",
    "Weekly action plan in plain English",
    "PDF report you can share",
    "Works with any POS system",
    "US and European restaurants",
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-[32px]">
          Transparent Pricing
        </h2>

        {/* Pricing Card */}
        <div className="mx-auto max-w-[500px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-12">
            {/* Price */}
            <div className="mb-8 text-center">
              <span className="text-6xl font-bold text-green-600">$50</span>
              <span className="text-lg text-gray-600">/month</span>
            </div>

            {/* Features */}
            <ul className="mb-8 space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link
              href="/auth/signup"
              className="block w-full rounded-lg bg-green-600 px-8 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800"
            >
              Analyse My Restaurant Free
            </Link>

            {/* Trial text */}
            <p className="mt-4 text-center text-[13px] text-gray-500">
              14-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
