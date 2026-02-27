import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-[56px]">
            See where your restaurant is losing money
          </h1>

          {/* Subheader */}
          <p className="mb-8 max-w-[600px] text-base text-gray-500 md:text-xl">
            Upload your sales, labor, and expenses. Get one clear action. Save money.
          </p>

          {/* CTA Button */}
          <Link
            href="/auth/signup"
            className="mb-3 inline-block rounded-lg bg-green-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800"
          >
            Analyse My Restaurant Free
          </Link>

          {/* Trial text */}
          <p className="text-sm text-gray-400">
            14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
