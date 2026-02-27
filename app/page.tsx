import { Header } from "@/components/shared/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { POSLogos } from "@/components/landing/POSLogos";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <POSLogos />
      <Testimonials />
      <Footer />
    </main>
  );
}
