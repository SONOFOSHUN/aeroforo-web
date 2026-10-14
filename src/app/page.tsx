import { AirProvider } from "@/hooks/useAirData";
import { Hero } from "@/components/Hero";
import { Footer, HowItWorks, Levels, Team } from "@/components/InfoSections";
import { LiveMonitor } from "@/components/LiveMonitor";
import { Navbar } from "@/components/Navbar";
import { StationsMap } from "@/components/StationsMap";

export default function Home() {
  return (
    <AirProvider>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LiveMonitor />
        <StationsMap />
        <Levels />
        <HowItWorks />
        <Team />
      </main>
      <Footer />
    </AirProvider>
  );
}
