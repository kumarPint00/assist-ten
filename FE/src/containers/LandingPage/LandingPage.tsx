import Navbar from "./components/Navbar";
import { lazyImport } from '../../components/ui';

const HeroSection = lazyImport(() => import("./components/HeroSection"));
const TrustedBySection = lazyImport(() => import("./components/TrustedBySection"));
const ProblemSection = lazyImport(() => import("./components/ProblemSection"));
const HowItWorks = lazyImport(() => import("./components/HowItWorks"));
const DemoSection = lazyImport(() => import("./components/DemoSection"));
const PricingPreview = lazyImport(() => import("./components/PricingPreview"));
const Testimonials = lazyImport(() => import("./components/TestimonialsSection"));
const FeaturesSectionLazy = lazyImport(() => import("./components/ProductFeaturesSection"));
const FAQSectionLazy = lazyImport(() => import("./components/FAQSection"));
import Footer from "./components/Footer";
import FloatingActionButton from "./components/FloatingActionButton";
import "./LandingPage.scss";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <div id="hero">
        <HeroSection />
      </div>
      {/* <div id="featured">
        <FeaturedSection />
      </div> */}
      <div id="trusted-by">
        <TrustedBySection />
      </div>

      <div id="problems">
        <ProblemSection />
      </div>

      <div id="features">
        <FeaturesSectionLazy />
      </div>

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="demo">
        <DemoSection />
      </div>

      <div id="pricing">
        <PricingPreview />
      </div>

      <div id="testimonials">
        <Testimonials />
      </div>

      <div id="faq">
        <FAQSectionLazy />
      </div>
      <Footer />
      <FloatingActionButton />
    </div>
  );
};

export default LandingPage;
