"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, Upload, Share, Mail, Check, Loader2, Sparkles, Bot } from "lucide-react";
import { getSession, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// DeepSeek is called via API route to keep the key server-side

const getHealthScoreConfig = (score: number) => {
  if (score < 0) return { emoji: "⏸", label: "Paused", color: "text-gray-400" };
  if (score >= 80) return { emoji: "🟢", label: "Healthy", color: "text-green-600" };
  if (score >= 60) return { emoji: "🟡", label: "Needs Attention", color: "text-yellow-600" };
  if (score >= 40) return { emoji: "🟠", label: "At Risk", color: "text-orange-600" };
  return { emoji: "🔴", label: "Critical", color: "text-red-600" };
};

function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div className={cn(
      "fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50",
      show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    )}>
      <span className="flex items-center gap-2">
        <Check className="w-4 h-4" />
        {message}
      </span>
    </div>
  );
}

interface AnalysisData {
  id: string;
  healthScore: number;
  laborPct: number | null;
  laborTarget: string | null;
  primeCostPct: number | null;
  primeCostTarget: string | null;
  foodCostEstimated?: boolean | null;
  totalRevenue: number | null;
  totalLabor: number | null;
  bestDay: string | null;
  bestDayRevenue: number | null;
  worstDay: string | null;
  worstDayRevenue: number | null;
  worstDayLabor: number | null;
  worstDayLoss: number | null;
  insight: string;
  action: string;
  savings: string;
  severity: string;
  pdfUrl: string | null;
  createdAt: string;
  // Data coverage
  salesDays: number | null;
  laborDays: number | null;
  salesDateRange: string | null;
  laborDateRange: string | null;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPct(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return `${Number(value).toFixed(1)}%`;
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const analysisId = searchParams.get("analysisId");

  const fetchAIInsight = useCallback(async () => {
    if (!analysisId) return;
    setIsLoadingAI(true);
    setAiInsight(null);
    setAiError(null);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/ai-insight`);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      // Stream the response — update text as chunks arrive
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setAiInsight(accumulated);
      }
      // Flush any remaining bytes
      accumulated += decoder.decode();
      setAiInsight(accumulated || "No insights generated.");
    } catch (err) {
      console.error("AI insight stream error:", err);
      setAiError("AI insights unavailable right now. Try regenerating.");
    } finally {
      setIsLoadingAI(false);
    }
  }, [analysisId]);

  const fetchAnalysis = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch analysis");
      setAnalysis(data.analysis);
    } catch (err) {
      console.error("Fetch analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    getSession().then((sess) => {
      if (sess) {
        setSession(sess);
        setStatus("authenticated");
        if (analysisId) {
          fetchAnalysis();
        } else {
          router.push("/dashboard");
        }
      } else {
        setStatus("unauthenticated");
        router.push("/auth/login");
      }
    });
  }, [analysisId, fetchAnalysis, router]);

  // Once analysis loads and it's not paused, trigger the AI insight fetch
  useEffect(() => {
    if (analysis && analysis.healthScore >= 0) {
      fetchAIInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.id]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShareReport = () => {
    const shareableLink = `${window.location.origin}/results?analysisId=${analysisId}`;
    navigator.clipboard.writeText(shareableLink);
    showToastMessage("Link copied!");
  };

  const handleEmailReminder = async () => {
    setIsSendingReminder(true);
    try {
      const res = await fetch("/api/remind", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReminderSent(true);
        showToastMessage("Reminder set! We'll email you next month.");
      } else {
        showToastMessage("Failed to set reminder. Try again.");
      }
    } catch {
      showToastMessage("Failed to set reminder. Try again.");
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Analysis not found</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const healthConfig = getHealthScoreConfig(analysis.healthScore);
  const reportDate = new Date(analysis.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Paused state: healthScore = -1 means labor was missing or severely mismatched
  const isPaused = analysis.healthScore < 0;

  // Determine labor/prime warning state (only meaningful when not paused)
  const laborPctNum = Number(analysis.laborPct);
  const laborIsHigh = !isPaused && laborPctNum > 32;
  const primeCostPctNum = Number(analysis.primeCostPct);
  const primeCostIsHigh = !isPaused && primeCostPctNum > 60;

  // Fix 2: data coverage
  const salesDays = analysis.salesDays ?? null;
  const laborDays = analysis.laborDays ?? null;
  const salesDateRange = analysis.salesDateRange ?? null;
  const laborDateRange = analysis.laborDateRange ?? null;
  const hasMismatch = salesDays !== null && laborDays !== null && Math.abs(salesDays - laborDays) > 2;
  const maxDays = Math.max(salesDays ?? 1, laborDays ?? 1, 1);

  // Fix 3: detect impossible numbers (labor > 2× sales indicates bad data)
  const totalRevNum = Number(analysis.totalRevenue ?? 0);
  const totalLaborNum = Number(analysis.totalLabor ?? 0);
  const impossibleNumbers = salesDays && laborDays && salesDays > 0 && laborDays > 0
    ? (totalLaborNum / laborDays) > (totalRevNum / salesDays) * 2
    : false;

  // Fix 2: generate suggestion from stored data or from day counts
  const mismatchSuggestion = hasMismatch && salesDays && laborDays
    ? `💡 Suggestion: Either upload ${Math.max(salesDays, laborDays)} days of ${salesDays < laborDays ? "sales" : "labor"
    } data (${salesDays < laborDays ? laborDateRange : salesDateRange}) to match the other file, or trim the longer file to ${Math.min(salesDays, laborDays)} days.`
    : null;

  // Fix 3 (UI): best/worst only shown when meaningful comparisons exist
  const hasDayComparison = analysis.bestDay && analysis.worstDay && analysis.bestDay !== analysis.worstDay;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-gray-900">
            🍽 Restaurant Intel
          </a>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* FIX 1: Loud mismatch banner — shown before EVERYTHING else */}
          {hasMismatch && (
            <section
              className="rounded-xl p-5 mb-6 border-2"
              style={{ backgroundColor: "#fef2f2", borderColor: "#dc2626" }}
            >
              <p className="text-base font-black text-red-700 mb-2" style={{ letterSpacing: "-0.01em" }}>
                🚨 DATA MISMATCH DETECTED
              </p>
              <div className="space-y-1 mb-3">
                <p className="text-sm font-semibold text-red-800">
                  Sales data:&nbsp;
                  <span className="font-bold">{salesDays} days{salesDateRange ? ` (${salesDateRange})` : ""}</span>
                </p>
                <p className="text-sm font-semibold text-red-800">
                  Labor data:&nbsp;
                  <span className="font-bold">{laborDays} days{laborDateRange ? ` (${laborDateRange})` : ""}</span>
                </p>
              </div>
              <p className="text-sm font-bold text-red-900 mb-2">
                → Results are unreliable until you upload matching date ranges.
              </p>
              {mismatchSuggestion && (
                <p className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2 border border-red-200">
                  {mismatchSuggestion}
                </p>
              )}
            </section>
          )}

          {/* FIX 3: Impossible numbers banner */}
          {impossibleNumbers && !hasMismatch && (
            <section
              className="rounded-xl p-4 mb-6 border-2"
              style={{ backgroundColor: "#fff7ed", borderColor: "#ea580c" }}
            >
              <p className="text-sm font-bold text-orange-800">
                ⚠️ Impossible numbers detected: Your average daily labor cost exceeds daily sales by more than 2×. This almost always means a file or date range mismatch. Verify your uploads before trusting these results.
              </p>
            </section>
          )}

          {/* Title + Health Score */}
          <section className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Monthly Analysis</h1>
            <p className="text-lg font-bold text-gray-900">
              {session?.user?.restaurantName || "Restaurant"}
            </p>
            <p className="text-base text-gray-600 mb-4">{reportDate}</p>

            {isPaused ? (
              /* Paused: gray "--" with explanation */
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-gray-400">Health Score: ——</span>
                <span className="text-4xl">⏸</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  Health Score: {analysis.healthScore}
                </span>
                <span className="text-4xl">{healthConfig.emoji}</span>
              </div>
            )}

            {isPaused && (
              <div
                className="mt-4 rounded-xl p-4 border-2"
                style={{ backgroundColor: "#f9fafb", borderColor: "#d1d5db" }}
              >
                <p className="text-sm font-bold text-gray-500 mb-1">⏸ CALCULATION PAUSED</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {analysis.insight}
                </p>
              </div>
            )}
          </section>

          {/* Data Coverage Bar — always visible when we have day counts */}
          {(salesDays !== null || laborDays !== null) && (
            <section className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <p className="text-xs font-bold uppercase text-gray-500 mb-3">📊 Data Coverage</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      Sales{salesDateRange ? ` · ${salesDateRange}` : ""}
                    </span>
                    <span className="font-medium text-gray-900">{salesDays ?? 0} days</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((salesDays ?? 0) / maxDays) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      Labor{laborDateRange ? ` · ${laborDateRange}` : ""}
                    </span>
                    <span className="font-medium text-gray-900">{laborDays ?? 0} days</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${hasMismatch ? "bg-red-400" : "bg-green-500"
                        }`}
                      style={{ width: `${Math.min(100, ((laborDays ?? 0) / maxDays) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              {hasMismatch && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3 font-medium">
                  ⚠️ Mismatch detected — align date ranges for accurate results.
                </p>
              )}
            </section>
          )}


          {/* Insight Card — only shown when NOT paused (paused insight shows inline above) */}
          {!isPaused && (
            <section className="rounded-lg p-6 mb-6" style={{ backgroundColor: "#f9fafb", maxWidth: "600px" }}>
              <p className="text-sm font-bold uppercase text-gray-500 mb-3">INSIGHT</p>
              <p className="text-base text-black leading-relaxed">{analysis.insight}</p>
            </section>
          )}

          {/* ── Deep Analysis section ──────────────────────────────────── */}
          {!isPaused && (
            <section className="mb-8">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f3460 100%)",
                  boxShadow: "0 4px 24px rgba(15,23,42,0.18)",
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/10">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base leading-tight">Deep Analysis</p>
                    <p className="text-white/50 text-xs">Personalized recommendations for your restaurant</p>
                  </div>
                  {isLoadingAI && (
                    <div className="ml-auto flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      <span className="text-xs text-violet-400">Analyzing…</span>
                    </div>
                  )}
                  {aiInsight && !isLoadingAI && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="text-xs text-violet-300 font-medium">Ready</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  {/* Skeleton — only before first chunk arrives */}
                  {isLoadingAI && !aiInsight && (
                    <div className="space-y-3 animate-pulse">
                      {["w-full", "w-4/5", "w-3/5"].map((w, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <div className={`h-3 bg-white/10 rounded ${w}`} />
                            <div className="h-3 bg-white/10 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {aiError && !aiInsight && (
                    <p className="text-sm text-red-400">{aiError}</p>
                  )}

                  {aiInsight && (
                    <div className="space-y-4">
                      {aiInsight
                        .split(/\n/)
                        .filter((line) => line.trim())
                        .map((line, i) => {
                          const isNumbered = /^\d+[.)\s]/.test(line.trim());
                          const text = line.replace(/^\d+[.)\s]+/, "").trim();
                          if (!text) return null;

                          if (isNumbered) {
                            const num = (line.match(/^(\d+)/) || [])[1];
                            return (
                              <div key={i} className="flex items-start gap-3">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm"
                                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
                                >
                                  {num}
                                </div>
                                <p className="text-white/90 text-sm leading-relaxed flex-1">
                                  {text}
                                </p>
                              </div>
                            );
                          }

                          if (line.trim().endsWith(":") || /^[A-Z\s]{5,}$/.test(line.trim())) {
                            return (
                              <p key={i} className="text-violet-300 font-bold text-xs uppercase tracking-wider mt-2">
                                {line.trim().replace(/:$/, "")}
                              </p>
                            );
                          }

                          return (
                            <p key={i} className="text-white/75 text-sm leading-relaxed">
                              {line.trim()}
                            </p>
                          );
                        })}
                      {/* Blinking cursor while still streaming */}
                      {isLoadingAI && (
                        <span
                          className="inline-block w-0.5 h-4 bg-violet-400 ml-1 align-middle"
                          style={{ animation: "blink 1s step-end infinite" }}
                        />
                      )}
                      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
                    </div>
                  )}
                </div>

              </div>
            </section>
          )}

          {/* Action + Savings Card */}
          <section
            className="rounded-lg p-6 mb-8"
            style={{
              backgroundColor: isPaused ? "#f3f4f6" : "#ecfdf5",
              borderLeft: `4px solid ${isPaused ? "#9ca3af" : "#10b981"}`
            }}
          >
            <p
              className="text-sm font-bold uppercase mb-3"
              style={{ color: isPaused ? "#9ca3af" : "#10b981" }}
            >
              {isPaused ? "NEXT STEP" : "ACTION"}
            </p>
            <p className="text-lg font-bold text-black mb-2">{analysis.action}</p>
            <p className="text-base text-gray-700 flex items-center gap-2">
              <span className="text-2xl">{isPaused ? "📋" : "💰"}</span>
              {isPaused ? analysis.savings : `Saves ${analysis.savings}`}
            </p>
          </section>

          {/* Numbers Grid — hidden when paused to avoid misleading zeros */}
          {!isPaused && (
            <section className="mb-8">
              <p className="text-sm font-bold uppercase text-gray-500 mb-4">NUMBERS</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Total Revenue */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <p className="text-sm text-gray-600 mb-1">Sales (period)</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrency(analysis.totalRevenue)}
                  </p>
                </div>

                {/* Labor */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <p className="text-sm text-gray-600 mb-1">Labor</p>
                  <p className="text-xl font-bold text-black flex items-center gap-2">
                    {formatPct(analysis.laborPct)}
                    {laborIsHigh && <span>⚠️</span>}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    target: {analysis.laborTarget ?? "28-32%"}
                  </p>
                </div>

                {/* Prime Cost */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <p className="text-sm text-gray-600 mb-1">Prime Cost</p>
                  <p className="text-xl font-bold text-black flex items-center gap-2">
                    {formatPct(analysis.primeCostPct)}
                    {primeCostIsHigh && <span>⚠️</span>}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    target: {analysis.primeCostTarget ?? "under 60%"}
                  </p>
                  {analysis.foodCostEstimated && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Food cost estimated at 30% — add expense categories to get real number
                    </p>
                  )}
                </div>

                {/* Slowest Day + Best Day — Fix 3: only show when meaningful */}
                {hasDayComparison ? (
                  <>
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <p className="text-sm text-gray-600 mb-1">Slowest Day</p>
                      <p className="text-xl font-bold text-black">{analysis.worstDay}</p>
                      {analysis.worstDayRevenue != null && (
                        <p className="text-sm text-gray-600 mt-1">
                          avg {formatCurrency(analysis.worstDayRevenue)}
                        </p>
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <p className="text-sm text-gray-600 mb-1">Best Day</p>
                      <p className="text-xl font-bold text-black">{analysis.bestDay}</p>
                      {analysis.bestDayRevenue != null && (
                        <p className="text-sm text-gray-600 mt-1">
                          avg {formatCurrency(analysis.bestDayRevenue)}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 sm:col-span-2">
                    <p className="text-sm font-medium text-amber-800">
                      📅 Need at least 7 days of data to identify best and slowest day patterns.
                    </p>
                  </div>
                )}

                {/* Total Labor Cost */}
                {analysis.totalLabor != null && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <p className="text-sm text-gray-600 mb-1">Labor Cost (period)</p>
                    <p className="text-xl font-bold text-black">
                      {formatCurrency(analysis.totalLabor)}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="flex-1 py-6 text-base font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Next Month
              </Button>
              <Button
                onClick={handleShareReport}
                variant="outline"
                className="flex-1 py-6 text-base font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Share className="w-5 h-5" />
                Share Report
              </Button>
            </div>
          </section>

          {/* Email Reminder */}
          <section className="rounded-lg p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📅 Get Your Next Analysis</h3>
            <p className="text-base text-black mb-4">
              Upload your files next month to see how this month compares.
            </p>
            <p className="text-base text-black mb-4">Want a reminder?</p>
            <Button
              onClick={handleEmailReminder}
              disabled={reminderSent || isSendingReminder}
              variant="outline"
              className={cn(
                "flex items-center gap-2",
                reminderSent && "bg-green-50 border-green-300 text-green-700"
              )}
            >
              {isSendingReminder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {reminderSent ? "Reminder Set! ✓" : "Email me next month"}
            </Button>
          </section>
        </div>
      </main>

      <Toast message={toastMessage} show={showToast} />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
