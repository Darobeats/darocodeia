import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Portfolio from "@/components/landing/Portfolio";
import Features from "@/components/landing/Features";
import Integrations from "@/components/landing/Integrations";
import Workflow from "@/components/landing/Workflow";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Portfolio />
        <Features />
        <Integrations />
        <Workflow />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;