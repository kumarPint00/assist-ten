# Landing Page

This directory contains the landing page for the AI Interview Platform (Assist-Ten).
It implements the new premium landing page layout with the following components:

- `Navbar` — top navigation and CTAs
- `HeroSection` — headline, subhead, CTAs, and hero visuals
- `TrustedBySection` — brand trust strip
- `ProblemSection` — three pain points and short descriptions
- `ProductFeaturesSection` — 6 product feature cards
- `HowItWorks` — 3-step flow with visuals
- `DemoSection` — schedule demo and sandbox CTA
- `PricingPreview` — pricing tier preview
- `TestimonialsSection` — testimonial cards
- `FAQSection` — common questions and answers
- `Footer` — footer with links and social icons

Shared UI primitives and performance improvements:
- `FE/src/components/ui` contains shared MUI components (PrimaryButton, InfoCard, SectionLayout, SectionTitle, Logo, LazySection, etc.)
- Dynamic imports (code splitting) are used for heavy sections (HeroMock, Demo, Pricing, Testimonials, Features, FAQ) via `lazyImport` helper
- Consistent SectionLayout and SectionTitle for spacing & typography


Style: All components define local scss modules in the same folder. The styles are designed to follow a dark/light hybrid aesthetic.

Use the `FE/app/page.tsx` which imports `LandingPage` to render the home route.

Design notes:
- Spacing: 8px base grid, key gaps based on design
- Typography: Inter / System font fallback provides modern, readable UI
- Colors and tokens: use CSS variables defined in root or theme theme.ts
- Accessibility: Buttons, cards and sections are keyboard navigable.

To run locally:
```bash
cd FE
npm install
npm run dev
# open http://localhost:3000
```

Next steps:
- Add micro-animations via Lottie for hero and transcript mockups
- Provide real illustrations and dashboard mock assets
- Add analytics instrumentation to CTAs for future A/B testing

