import { Box } from "@mui/material";
import { SectionTitle, SectionLayout, InfoCard } from '../../../components/ui';
import "./ProductFeaturesSection.scss";

const features = [
  {
    title: "Automated Interview Engine",
    desc: "Structured, customizable interviews that run on-demand or live to keep screening consistent and fast.",
  },
  {
    title: "Consistent Scoring & Review",
    desc: "Rubrics and automated scoring reduce subjectivity; reviewers re-score with a single tweak.",
  },
  {
    title: "Real-Time AI Assistance",
    desc: "AI suggests follow-ups, clarifies answers, and provides candidate insights for better decisions.",
  },
  {
    title: "Integrations & Workflow Sync",
    desc: "One-click sync with ATS, calendar, and communication tools — updates arrive where your team works.",
  },
  {
    title: "Proctoring & Identity Verification",
    desc: "Automated proctoring and identity checks for remote interviews with clear privacy and audit trails.",
  },
  {
    title: "Enterprise Security & Controls",
    desc: "SSO, RBAC, audit logging, and regional data residency options to meet compliance requirements.",
  },
];

const ProductFeaturesSection = () => {
  return (
    <SectionLayout id="features">
      <Box className="product-features">
        <SectionTitle>What a modern interview platform should do</SectionTitle>

        <Box className="features-grid">
          {features.map((f, idx) => (
            <InfoCard key={idx} title={f.title} description={f.desc} className="feature-card" />
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default ProductFeaturesSection;
