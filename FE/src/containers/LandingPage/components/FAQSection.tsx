import { Box, Typography } from "@mui/material";
import { SectionLayout, InfoCard } from '../../../components/ui';
import "./FAQSection.scss";

const faqs = [
  {
    q: "Are interview scores unbiased?",
    a: "We use rubric-based scoring, bias checks, and anonymized screens to reduce human bias. Our results are auditable and re-reviewable.",
  },
  {
    q: "Which ATS platforms do you integrate with?",
    a: "We support Greenhouse, Lever, Workday, and provide webhooks and an API for custom integrations.",
  },
  {
    q: "How secure is the candidate data?",
    a: "We secure data with encryption in transit & at rest, SSO (SAML), RBAC, and audit logs. Compliance docs available on request.",
  },
];

const FAQSection = () => {
  return (
    <SectionLayout id={'faq'}>
      <Box className="faq-section">
        <Typography variant="h4" className="faq-title">Questions the team usually asks</Typography>
        <Box className="faq-grid">
          {faqs.map((f, idx) => (
            <InfoCard key={idx} title={f.q} description={f.a} className="faq-card" />
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default FAQSection;
