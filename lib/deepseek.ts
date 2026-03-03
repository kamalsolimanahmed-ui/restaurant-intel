import OpenAI from "openai";

// Initialize DeepSeek client
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export interface RestaurantAnalysisData {
  // Core metrics
  healthScore: number;
  laborPct: number | null;
  primeCostPct: number | null;
  totalRevenue: number | null;
  totalLabor: number | null;
  
  // Day analysis
  bestDay: string | null;
  bestDayRevenue: number | null;
  worstDay: string | null;
  worstDayRevenue: number | null;
  worstDayLabor: number | null;
  worstDayLoss: number | null;
  
  // Additional context
  salesDays: number | null;
  laborDays: number | null;
  salesDateRange: string | null;
  laborDateRange: string | null;
  foodCostEstimated: boolean | null;
  
  // Restaurant info
  restaurantName?: string;
  createdAt: string;
}

export async function analyzeRestaurantData(data: RestaurantAnalysisData): Promise<string> {
  try {
    // Format the data for the AI prompt
    const prompt = createAnalysisPrompt(data);
    
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert restaurant financial advisor with 20+ years of experience. You analyze restaurant financial data and provide specific, actionable recommendations to save money and improve profitability. You always include concrete dollar amounts and specific actions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || "No analysis available at this time.";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return "Unable to generate AI insights at this time. Please check your API configuration.";
  }
}

function createAnalysisPrompt(data: RestaurantAnalysisData): string {
  const {
    healthScore,
    laborPct,
    primeCostPct,
    totalRevenue,
    totalLabor,
    bestDay,
    bestDayRevenue,
    worstDay,
    worstDayRevenue,
    worstDayLabor,
    worstDayLoss,
    salesDays,
    laborDays,
    salesDateRange,
    laborDateRange,
    foodCostEstimated,
    restaurantName,
    createdAt
  } = data;

  // Calculate monthly estimates if we have daily data
  const monthlyRevenueEstimate = totalRevenue ? totalRevenue * (30 / (salesDays || 30)) : null;
  const monthlyLaborEstimate = totalLabor ? totalLabor * (30 / (laborDays || 30)) : null;
  
  // Calculate potential savings
  const laborSavingsPotential = laborPct && laborPct > 32 ? 
    `Current labor is ${laborPct.toFixed(1)}% (target: 28-32%). Reducing to 30% could save approximately $${Math.round((totalRevenue || 0) * ((laborPct - 30) / 100)).toLocaleString()} per period.` : 
    "Labor percentage is within target range.";
  
  const primeCostSavingsPotential = primeCostPct && primeCostPct > 60 ?
    `Prime cost is ${primeCostPct.toFixed(1)}% (target: under 60%). Reducing to 58% could save approximately $${Math.round((totalRevenue || 0) * ((primeCostPct - 58) / 100)).toLocaleString()} per period.` :
    "Prime cost percentage is within target range.";

  return `Analyze this restaurant financial data and provide 3 specific, actionable recommendations with dollar amounts:

RESTAURANT: ${restaurantName || "Restaurant"}
ANALYSIS DATE: ${new Date(createdAt).toLocaleDateString()}
HEALTH SCORE: ${healthScore}/100

FINANCIAL METRICS:
- Total Revenue: ${totalRevenue ? `$${totalRevenue.toLocaleString()}` : "N/A"}
- Total Labor Cost: ${totalLabor ? `$${totalLabor.toLocaleString()}` : "N/A"}
- Labor Percentage: ${laborPct ? `${laborPct.toFixed(1)}%` : "N/A"} ${laborPct && laborPct > 32 ? "(ABOVE TARGET 28-32%)" : laborPct && laborPct >= 28 ? "(WITHIN TARGET)" : "(BELOW TARGET)"}
- Prime Cost Percentage: ${primeCostPct ? `${primeCostPct.toFixed(1)}%` : "N/A"} ${primeCostPct && primeCostPct > 60 ? "(ABOVE TARGET <60%)" : "(WITHIN TARGET)"}
- Food Cost: ${foodCostEstimated ? "Estimated at 30% (needs actual expense data)" : "Based on actual expenses"}

DAY ANALYSIS:
- Best Day: ${bestDay || "N/A"} ${bestDayRevenue ? `(Avg: $${bestDayRevenue.toLocaleString()})` : ""}
- Worst Day: ${worstDay || "N/A"} ${worstDayRevenue ? `(Avg: $${worstDayRevenue.toLocaleString()})` : ""} ${worstDayLabor ? `(Labor: $${worstDayLabor.toLocaleString()})` : ""}
- Worst Day Loss: ${worstDayLoss ? `$${worstDayLoss.toLocaleString()}` : "N/A"}

DATA COVERAGE:
- Sales Data: ${salesDays || 0} days ${salesDateRange ? `(${salesDateRange})` : ""}
- Labor Data: ${laborDays || 0} days ${laborDateRange ? `(${laborDateRange})` : ""}
${salesDays && laborDays && Math.abs(salesDays - laborDays) > 2 ? "⚠️ WARNING: Date range mismatch detected - results may be inaccurate" : ""}

ESTIMATED MONTHLY FIGURES (if data available):
- Monthly Revenue: ${monthlyRevenueEstimate ? `$${Math.round(monthlyRevenueEstimate).toLocaleString()}` : "N/A"}
- Monthly Labor: ${monthlyLaborEstimate ? `$${Math.round(monthlyLaborEstimate).toLocaleString()}` : "N/A"}

POTENTIAL SAVINGS ANALYSIS:
${laborSavingsPotential}
${primeCostSavingsPotential}

INSTRUCTIONS:
Provide exactly 3 specific, actionable recommendations for this restaurant owner. Each recommendation should:
1. Be concrete and specific (e.g., "Cut Tuesday lunch shift" not "Reduce labor")
2. Include estimated dollar savings per month
3. Explain the business rationale
4. Be prioritized by impact

Format your response as a clear, concise list with numbered items.`;
}