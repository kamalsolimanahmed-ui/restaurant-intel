"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays, parseISO } from "date-fns";
import { LogOut, Check, FileText, Download, Loader2, X, FileDown } from "lucide-react";
import { getSession, signOut } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
interface UploadedFile {
  name: string;
  size: number;
  type: "sales" | "labor" | "expenses";
  file: File; // actual File object for upload
}

interface FileUploads {
  sales: UploadedFile | null;
  labor: UploadedFile | null;
  expenses: UploadedFile | null;
}

interface Analysis {
  id: string;
  healthScore: number;
  createdAt: string;
  pdfUrl: string | null;
}

// Health score configuration
const getHealthScoreConfig = (score: number | null) => {
  if (score === null) return { color: "gray", emoji: "?", label: "Unknown", barColor: "bg-gray-200" };
  if (score >= 80) return { color: "green", emoji: "🟢", label: "Healthy", barColor: "bg-green-500" };
  if (score >= 60) return { color: "yellow", emoji: "🟡", label: "Needs Attention", barColor: "bg-yellow-500" };
  if (score >= 40) return { color: "orange", emoji: "🟠", label: "At Risk", barColor: "bg-orange-500" };
  return { color: "red", emoji: "🔴", label: "Critical", barColor: "bg-red-500" };
};

// Drop zone component
interface DropZoneProps {
  type: "sales" | "labor" | "expenses";
  icon: string;
  label: string;
  file: UploadedFile | null;
  onDrop: (type: keyof FileUploads, file: File) => void;
  onClear: (type: keyof FileUploads) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

function DropZone({ type, icon, label, file, onDrop, onClear, isDragging, setIsDragging }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx"))) {
      onDrop(type, droppedFile);
    }
  }, [type, onDrop, setIsDragging]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onDrop(type, selectedFile);
    }
  }, [type, onDrop]);

  return (
    <div className="relative">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200",
          isDragging
            ? "border-green-500 bg-green-50"
            : file
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-white hover:border-green-400 hover:bg-gray-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleFileInput}
        />

        {file ? (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-900 text-center break-all max-w-full">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">{icon}</div>
            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-xs text-gray-400 mt-4">Drop CSV or Excel</p>
          </>
        )}
      </label>

      {file && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear(type);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Health Score Section
function HealthScoreSection({ score, lastAnalyzed, trialDaysLeft }: { score: number | null; lastAnalyzed: Date | null; trialDaysLeft: number }) {
  const config = getHealthScoreConfig(score);
  const filledBars = score !== null ? Math.round(score / 6.25) : 0;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 px-4 py-2 bg-green-50 rounded-full">
          <span className="text-sm font-medium text-green-700">
            {trialDaysLeft > 0 ? `Trial: ${trialDaysLeft} days left` : "Trial expired"}
          </span>
        </div>

        <div className="text-7xl font-bold text-gray-900 mb-4">
          {score !== null ? score : "?"}
        </div>

        <div className="flex gap-1 mb-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-6 rounded-sm transition-all duration-300",
                i < filledBars ? config.barColor : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {score !== null ? (
          <>
            <div className="flex items-center gap-2 text-lg font-medium text-gray-700">
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Last analysed: {lastAnalyzed ? format(lastAnalyzed, "MMM yyyy") : "Never"}
            </p>
          </>
        ) : (
          <p className="text-gray-500">Upload your files to find out</p>
        )}
      </div>
    </section>
  );
}

// Previous Reports Sidebar
function PreviousReports({ reports, isLoading }: { reports: Analysis[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Previous Reports
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">
          No reports yet. Upload your first file.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Previous Reports
      </h3>

      <div className="space-y-3">
        {reports.map((report) => {
          const config = getHealthScoreConfig(report.healthScore);
          return (
            <div
              key={report.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(parseISO(report.createdAt), "MMM yyyy")}
                </p>
                <p className="text-xs text-gray-500">
                  Score:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      config.color === "green" && "text-green-600",
                      config.color === "yellow" && "text-yellow-600",
                      config.color === "orange" && "text-orange-600",
                      config.color === "red" && "text-red-600"
                    )}
                  >
                    {report.healthScore}
                  </span>
                </p>
              </div>
              <a
                href={`/results?analysisId=${report.id}`}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Analysis step indicator
function StepIndicator({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", active ? "text-green-600 font-medium" : done ? "text-gray-400" : "text-gray-300")}>
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
        active ? "border-green-500 bg-green-50 text-green-600" :
          done ? "border-green-500 bg-green-500 text-white" :
            "border-gray-200 text-gray-300"
      )}>
        {done ? "✓" : step}
      </div>
      {label}
    </div>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileUploads>({ sales: null, labor: null, expenses: null });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [latestHealthScore, setLatestHealthScore] = useState<number | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  useEffect(() => {
    getSession().then((sess) => {
      if (sess) {
        setSession(sess);
        setStatus("authenticated");
        fetchAnalyses();
        calculateTrialDays(sess);
      } else {
        setStatus("unauthenticated");
        router.push("/auth/login");
      }
    });
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch("/api/analyses");
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses);
        if (data.analyses.length > 0) {
          setLatestHealthScore(data.analyses[0].healthScore);
          setLastAnalyzed(parseISO(data.analyses[0].createdAt));
        }
      }
    } catch (error) {
      console.error("Failed to fetch analyses:", error);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  const calculateTrialDays = (currentSession: any) => {
    if (currentSession?.user?.trialEndsAt) {
      const trialEnd = parseISO(currentSession.user.trialEndsAt);
      const daysLeft = differenceInDays(trialEnd, new Date());
      setTrialDaysLeft(Math.max(0, daysLeft));
    }
  };

  const handleFileDrop = useCallback((type: keyof FileUploads, file: File) => {
    setFiles((prev) => ({
      ...prev,
      [type]: { name: file.name, size: file.size, type, file },
    }));
    setAnalyzeError(null);
  }, []);

  const handleFileClear = useCallback((type: keyof FileUploads) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
  }, []);

  const allFilesUploaded = files.sales && files.labor && files.expenses;

  const handleAnalyze = async () => {
    if (!allFilesUploaded) return;

    setIsAnalyzing(true);
    setAnalyzeStep(1);
    setAnalyzeError(null);

    try {
      // ── Step 1: Create upload record ─────────────────────────────────────
      const now = new Date().toISOString();
      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: files.sales!.name,
          fileType: "sales",
          periodStart: now,
          periodEnd: now,
        }),
      });
      const uploadData = await uploadResponse.json();
      if (!uploadData.success) throw new Error("Failed to create upload record");
      const uploadId = uploadData.upload.id;

      // ── Step 2: Parse each file independently, then merge by date ─────────
      setAnalyzeStep(2);

      // Parse sales file — requires: date, revenue
      const salesForm = new FormData();
      salesForm.append("file", files.sales!.file);
      salesForm.append("fileType", "sales");
      const salesParseRes = await fetch("/api/parse", { method: "POST", body: salesForm });
      const salesParsed = await salesParseRes.json();
      if (!salesParsed.success) throw new Error(`Sales file error: ${salesParsed.error}. Detected columns: ${salesParsed.detectedHeaders?.join(", ") ?? "none"}`);

      // Parse labor file — requires: date, labor_cost
      const laborForm = new FormData();
      laborForm.append("file", files.labor!.file);
      laborForm.append("fileType", "labor");
      const laborParseRes = await fetch("/api/parse", { method: "POST", body: laborForm });
      const laborParsed = await laborParseRes.json();
      if (!laborParsed.success) throw new Error(`Labor file error: ${laborParsed.error}. Detected columns: ${laborParsed.detectedHeaders?.join(", ") ?? "none"}`);

      // Parse expenses file — requires: date, expense_amount (soft — won't block analysis)
      const expForm = new FormData();
      expForm.append("file", files.expenses!.file);
      expForm.append("fileType", "expenses");
      const expParseRes = await fetch("/api/parse", { method: "POST", body: expForm });
      const expParsed = await expParseRes.json();
      if (!expParsed.success) {
        console.warn("Expenses parse warning (non-blocking):", expParsed.error);
      }

      // ── Merge all 3 by date ───────────────────────────────────────────────
      // Build lookup maps from labor + expense rows
      const laborByDate = new Map<string, { laborCost?: number; laborHours?: number }>();
      for (const row of (laborParsed.data ?? [])) {
        if (row.date) laborByDate.set(row.date, { laborCost: row.laborCost, laborHours: row.laborHours });
      }

      const expensesByDate = new Map<string, Array<{ expenseAmount?: number; expenseCategory?: string }>>();
      for (const row of (expParsed.data ?? [])) {
        if (row.date) {
          if (!expensesByDate.has(row.date)) expensesByDate.set(row.date, []);
          expensesByDate.get(row.date)!.push({ expenseAmount: row.expenseAmount, expenseCategory: row.expenseCategory });
        }
      }

      // Sales is the base — join labor + expenses by date
      type MergedRow = { date: string; revenue: number; laborCost: number; laborHours?: number; expenseAmount?: number; expenseCategory?: string; };
      const parsedData: MergedRow[] = [];

      for (const sale of (salesParsed.data ?? [])) {
        if (!sale.date || sale.revenue == null) continue;
        const labor = laborByDate.get(sale.date as string);
        const expenses = expensesByDate.get(sale.date as string);

        const baseRow: MergedRow = {
          date: sale.date as string,
          revenue: sale.revenue as number,
          laborCost: labor?.laborCost ?? (sale.laborCost as number | undefined) ?? 0,
          laborHours: labor?.laborHours ?? (sale.laborHours as number | undefined),
        };

        if (expenses && expenses.length > 0) {
          for (const exp of expenses) {
            parsedData.push({ ...baseRow, expenseAmount: exp.expenseAmount, expenseCategory: exp.expenseCategory });
          }
        } else {
          parsedData.push(baseRow);
        }
      }

      if (parsedData.length === 0) {
        throw new Error("No valid data rows found after merging files. Check your column headers.");
      }

      // ── Step 3: Run rules engine ─────────────────────────────────────────
      setAnalyzeStep(3);
      const rulesRes = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsedData }),
      });
      const rulesData = await rulesRes.json();
      if (!rulesData.success) throw new Error(`Rules engine error: ${rulesData.error}`);

      // ── Step 4: Generate insights ────────────────────────────────────────
      setAnalyzeStep(4);
      const insightsRes = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthScore: rulesData.healthScore,
          pauseReason: rulesData.pauseReason,
          laborPct: rulesData.laborPct,
          primeCostPct: rulesData.primeCostPct,
          totalRevenue: rulesData.totalRevenue,
          weeklySavings: rulesData.weeklySavings,
          monthlySavings: rulesData.monthlySavings,
          worstDay: rulesData.worstDay,
          worstDayRevenue: rulesData.worstDayRevenue,
          worstDayLabor: rulesData.worstDayLabor,
          worstDayLoss: rulesData.worstDayLoss,
          expenseSpikes: rulesData.expenseSpikes,
          issues: rulesData.issues,
        }),
      });
      const insightsData = await insightsRes.json();
      if (!insightsData.success) throw new Error("Failed to generate insights");

      // ── Step 5: Save analysis ─────────────────────────────────────────────
      setAnalyzeStep(5);
      const saveRes = await fetch("/api/analyses/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          healthScore: rulesData.healthScore,
          laborPct: rulesData.laborPct,
          laborTarget: rulesData.laborTarget,
          primeCostPct: rulesData.primeCostPct,
          primeCostTarget: rulesData.primeCostTarget,
          totalRevenue: rulesData.totalRevenue,
          totalLabor: rulesData.totalLabor,
          bestDay: rulesData.bestDay,
          bestDayRevenue: rulesData.bestDayRevenue,
          worstDay: rulesData.worstDay,
          worstDayRevenue: rulesData.worstDayRevenue,
          worstDayLabor: rulesData.worstDayLabor,
          worstDayLoss: rulesData.worstDayLoss,
          insight: insightsData.insight,
          action: insightsData.action,
          savings: insightsData.savings,
          severity: insightsData.severity,
          salesDays: rulesData.salesDays,
          laborDays: rulesData.laborDays,
          salesDateRange: rulesData.salesDateRange,
          laborDateRange: rulesData.laborDateRange,
          financialData: parsedData.slice(0, 500),
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(`Failed to save: ${saveData.error} — ${saveData.details}`);

      router.push(`/results?analysisId=${saveData.analysis.id}`);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalyzeError(error instanceof Error ? error.message : "An unexpected error occurred");
      setAnalyzeStep(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const exportLinks = [
    { name: "Square", href: "https://squareup.com/help/us/en/article/5280" },
    { name: "Clover", href: "https://www.clover.com/help" },
    { name: "Toast", href: "https://pos.toasttab.com/resources" },
    { name: "Excel", href: "#" },
  ];

  const analyzeSteps = [
    "Creating record",
    "Parsing files",
    "Calculating metrics",
    "Generating insights",
    "Saving analysis",
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-gray-900">
            🍽 Restaurant Intel
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {session?.user?.email}
            </span>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <HealthScoreSection
              score={latestHealthScore}
              lastAnalyzed={lastAnalyzed}
              trialDaysLeft={trialDaysLeft}
            />

            {/* File Upload Section */}
            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Upload Your Files
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <DropZone type="sales" icon="📊" label="SALES" file={files.sales}
                  onDrop={handleFileDrop} onClear={handleFileClear}
                  isDragging={isDragging} setIsDragging={setIsDragging} />
                <DropZone type="labor" icon="👥" label="LABOR" file={files.labor}
                  onDrop={handleFileDrop} onClear={handleFileClear}
                  isDragging={isDragging} setIsDragging={setIsDragging} />
                <DropZone type="expenses" icon="💸" label="EXPENSES" file={files.expenses}
                  onDrop={handleFileDrop} onClear={handleFileClear}
                  isDragging={isDragging} setIsDragging={setIsDragging} />
              </div>

              {/* CSV Template Downloads */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {([
                  { label: "Sales Template", href: "/api/templates/sales" },
                  { label: "Labor Template", href: "/api/templates/labor" },
                  { label: "Expenses Template", href: "/api/templates/expenses" },
                ] as const).map(({ label, href }) => (
                  <a
                    key={href}
                    href={href}
                    download
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg py-2 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    {label}
                  </a>
                ))}
              </div>

              {/* Export links */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">How to export from:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {exportLinks.map((link) => (
                    <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1 bg-green-50 rounded-full hover:bg-green-100 transition-colors">
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Step progress during analysis */}
              {isAnalyzing && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
                  {analyzeSteps.map((label, i) => (
                    <StepIndicator
                      key={label}
                      step={i + 1}
                      label={label}
                      active={analyzeStep === i + 1}
                      done={analyzeStep > i + 1}
                    />
                  ))}
                </div>
              )}

              {/* Error display */}
              {analyzeError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Analysis failed</p>
                  <p className="text-xs text-red-600 mt-1">{analyzeError}</p>
                </div>
              )}

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!allFilesUploaded || isAnalyzing}
                className={cn(
                  "w-full py-6 text-lg font-semibold transition-all",
                  allFilesUploaded && !isAnalyzing
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    {analyzeSteps[analyzeStep - 1] || "Analysing..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Analyse My Business
                    <span>→</span>
                  </span>
                )}
              </Button>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <PreviousReports reports={analyses} isLoading={isLoadingAnalyses} />
          </div>
        </div>
      </main>
    </div>
  );
}
