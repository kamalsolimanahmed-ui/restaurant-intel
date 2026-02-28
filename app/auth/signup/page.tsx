"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Country configuration with currency and date format
const COUNTRY_CONFIG = {
  US: { currency: "USD", currencySymbol: "$", dateFormat: "MM/DD" },
  UK: { currency: "GBP", currencySymbol: "£", dateFormat: "DD/MM" },
  ES: { currency: "EUR", currencySymbol: "€", dateFormat: "DD/MM" },
  FR: { currency: "EUR", currencySymbol: "€", dateFormat: "DD/MM" },
  Other: { currency: "USD", currencySymbol: "$", dateFormat: "MM/DD" },
} as const;

type CountryCode = keyof typeof COUNTRY_CONFIG;

// Zod validation schema
const signupSchema = z.object({
  restaurantName: z
    .string()
    .min(2, "Restaurant name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.enum(["US", "UK", "ES", "FR", "Other"]),
  phone: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSettings, setAutoSettings] = useState<{
    currency: string;
    currencySymbol: string;
    dateFormat: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      country: "US",
      phone: "",
    },
  });

  const selectedCountry = watch("country");

  const handleCountryChange = (value: CountryCode) => {
    setValue("country", value);
    const config = COUNTRY_CONFIG[value];
    setAutoSettings(config);
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create account via API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          restaurantName: data.restaurantName,
          country: data.country,
          currency: COUNTRY_CONFIG[data.country].currency,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create account");
      }

      // Auto-login after signup
      try {
        await signIn(data.email, data.password);
      } catch (e) {
        throw new Error("Account created but auto-login failed. Please log in manually.");
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold text-gray-900">
            🍽 Restaurant Intel
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Start your free trial
            </h1>
            <p className="text-gray-600">
              14 days free. No credit card required.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-xl border border-gray-200 p-8 space-y-5"
          >
            {/* Restaurant Name */}
            <div>
              <Label htmlFor="restaurantName" className="text-sm font-medium text-gray-700">
                Restaurant Name
              </Label>
              <Input
                id="restaurantName"
                type="text"
                placeholder="Your Restaurant"
                className={`mt-1.5 ${errors.restaurantName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                {...register("restaurantName")}
              />
              {errors.restaurantName && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.restaurantName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@restaurant.com"
                className={`mt-1.5 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Country Dropdown */}
            <div>
              <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                Country
              </Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value: CountryCode) => handleCountryChange(value)}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {/* Auto-settings display */}
              {(autoSettings || selectedCountry) && (
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-600">
                    Currency:{" "}
                    <span className="font-medium text-gray-900">
                      {autoSettings?.currency || COUNTRY_CONFIG[selectedCountry].currency}{" "}
                      {autoSettings?.currencySymbol || COUNTRY_CONFIG[selectedCountry].currencySymbol}
                    </span>
                  </span>
                  <span className="text-gray-600">
                    Date:{" "}
                    <span className="font-medium text-gray-900">
                      {autoSettings?.dateFormat || COUNTRY_CONFIG[selectedCountry].dateFormat}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="mt-1.5"
                {...register("phone")}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 h-auto text-base transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <span>→</span>
                </span>
              )}
            </Button>

            {/* Subtext */}
            <p className="text-center text-sm text-gray-500">
              14-day free trial then $15/month
            </p>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-green-600 hover:text-green-700 font-medium hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
