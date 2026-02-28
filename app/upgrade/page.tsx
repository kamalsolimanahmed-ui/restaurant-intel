"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signOut } from "@/lib/auth";
import { useEffect, Suspense, useState } from "react";

function UpgradeContent() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  useEffect(() => {
    getSession().then((sess) => setSession(sess));

    // Log trial expiration for analytics
    if (reason === 'trial_expired' && session?.user?.email) {
      console.log(`Trial expired for user: ${session.user.email}`);
    }
  }, [reason, session]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-10 text-center">
        <div className="text-6xl mb-6">🔒</div>

        {reason === 'trial_expired' ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Your Free Trial Has Ended
            </h1>
            <p className="text-gray-500 mb-8 text-lg">
              Upgrade to Pro for <strong>$15/month</strong> to continue using Restaurant Intel.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Upgrade to Pro
            </h1>
            <p className="text-gray-500 mb-8 text-lg">
              Get unlimited access to all features for just <strong>$15/month</strong>.
            </p>
          </>
        )}

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-100">
          <p className="text-sm font-bold uppercase text-green-600 mb-4 tracking-wider">
            Pro Features
          </p>
          <ul className="space-y-4 text-left">
            {[
              { icon: "📊", text: "Unlimited monthly file uploads" },
              { icon: "🏥", text: "Continuous health score tracking" },
              { icon: "📈", text: "Monthly trend analysis & reports" },
              { icon: "💡", text: "AI-generated actionable insights" },
              { icon: "📧", text: "Priority email support" },
              { icon: "🔒", text: "All your historical data preserved" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-gray-700">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold text-gray-900">$15</span>
            <span className="text-lg text-gray-400">/month</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Cancel anytime • No setup fees</p>

          {reason === 'trial_expired' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ <strong>Immediate access:</strong> Upgrade now and get instant access to all your previous data.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <a
            href="/checkout"
            className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl text-center text-lg transition-all hover:shadow-lg"
          >
            Upgrade Now - $15/month
          </a>

          <button
            onClick={async () => {
              await signOut();
              router.push("/auth/login");
            }}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-3 transition-colors"
          >
            Sign out instead
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            Questions? <a href="mailto:support@restaurantintel.app" className="text-green-600 hover:text-green-700">Contact support</a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            By upgrading, you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <p className="text-gray-500">Loading upgrade page...</p>
        </div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}


