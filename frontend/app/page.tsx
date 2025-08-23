import Navigation from "./components/Navigation"
import Hero from "./components/Hero"
import Features from "./components/Features"
import Footer from "./components/Footer"
import HowItWorks from "./components/HowItWorks"


export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="pt-16 lg:pt-20 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
        <Hero />
        <Features />
        <HowItWorks/>
        <Footer />
      </div>
    </main>
  )
}
