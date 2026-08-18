import LandingNavbar from "../components/landing/LandingNavbar";
import Hero from "../components/landing/Hero";
import FeatureSection from "../components/landing/FeatureSection";
import SocialProof from "../components/landing/SocialProof";
import LandingFooter from "../components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col transition-colors duration-150">
      <LandingNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <Hero />
      </main>

      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-14 border-t border-base-200">
        <FeatureSection />
        <div className="mt-14">
          <SocialProof />
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
