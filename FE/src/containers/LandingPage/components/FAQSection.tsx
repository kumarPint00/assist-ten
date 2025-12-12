'use client';

import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { motion } from "framer-motion";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SectionLayout, SectionTitle } from '../../../components/ui';
import "./FAQSection.scss";

const faqs = [
  {
    q: "Are interview scores unbiased?",
    a: "We use rubric-based scoring, bias checks, and anonymized screens to reduce human bias. Our results are auditable and re-reviewable.",
    icon: "⚖️"
  },
  {
    q: "Which ATS platforms do you integrate with?",
    a: "We support Greenhouse, Lever, Workday, and provide webhooks and an API for custom integrations.",
    icon: "🔗"
  },
  {
    q: "How secure is the candidate data?",
    a: "We secure data with encryption in transit & at rest, SSO (SAML), RBAC, and audit logs. Compliance docs available on request.",
    icon: "🔒"
  },
  {
    q: "Can I customize the interview questions?",
    a: "Yes, you can create custom question sets, modify existing templates, and set up automated scoring rubrics tailored to your needs.",
    icon: "✏️"
  },
  {
    q: "What kind of analytics do you provide?",
    a: "We offer comprehensive dashboards with hiring metrics, candidate insights, team performance analytics, and customizable reports.",
    icon: "📊"
  },
];

const FAQSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <SectionLayout id={'faq'}>
      <Box className="faq-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <SectionTitle>Questions the team usually asks</SectionTitle>
        </motion.div>

        <motion.div
          className="faq-container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {faqs.map((faq, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Accordion className="faq-accordion">
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon className="expand-icon" />}
                  className="faq-summary"
                >
                  <Box className="faq-question">
                    <span className="faq-icon">{faq.icon}</span>
                    <Typography className="faq-question-text">{faq.q}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails className="faq-details">
                  <Typography className="faq-answer">{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="faq-cta"
        >
          <Typography className="faq-cta-text">
            Still have questions? <a href="#contact" className="faq-cta-link">Get in touch</a>
          </Typography>
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default FAQSection;
