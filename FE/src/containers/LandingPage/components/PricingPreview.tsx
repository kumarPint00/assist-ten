'use client';

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { SectionLayout } from '../../../components/ui';
import { PrimaryButton } from '../../../components/ui';
import "./PricingPreview.scss";

const tiers = [
  {
    name: "Starter",
    price: "$149/mo",
    originalPrice: "$199/mo",
    description: "Perfect for small teams",
    bullets: ["Basic templates", "25 interviews / mo", "Email support"],
    popular: false,
    color: "#64748b"
  },
  {
    name: "Pro",
    price: "$449/mo",
    originalPrice: "$599/mo",
    description: "For growing companies",
    bullets: ["Full automations", "Priority support", "Advanced analytics", "Custom integrations"],
    popular: true,
    color: "#6366f1"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored for large organizations",
    bullets: ["SLA & dedicated team", "Data residency", "White-label solution", "24/7 support"],
    popular: false,
    color: "#f59e0b"
  },
];

const PricingPreview = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  };

  return (
    <SectionLayout id={'pricing'}>
      <Box className="pricing-preview">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pricing-header"
        >
          <Typography variant="h4" className="pricing-title">
            Transparent enterprise pricing
          </Typography>
          <Typography className="pricing-subtitle">
            No hidden fees, no surprises. Choose the plan that fits your hiring needs.
          </Typography>
        </motion.div>

        <motion.div
          className="pricing-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {tiers.map((tier, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{
                scale: tier.popular ? 1.05 : 1.02,
                y: tier.popular ? -12 : -8,
                transition: { duration: 0.2 }
              }}
              className={`pricing-card-wrapper ${tier.popular ? 'popular' : ''}`}
            >
              <Box className="pricing-card">
                {tier.popular && (
                  <Box className="popular-badge">
                    <Typography className="badge-text">Most Popular</Typography>
                  </Box>
                )}

                <Box className="card-header">
                  <Typography className="tier-name">{tier.name}</Typography>
                  <Typography className="tier-description">{tier.description}</Typography>
                </Box>

                <Box className="pricing-section">
                  <Box className="price-container">
                    <Typography className="tier-price">{tier.price}</Typography>
                    {tier.originalPrice && (
                      <Typography className="original-price">{tier.originalPrice}</Typography>
                    )}
                  </Box>
                  {tier.originalPrice && (
                    <Typography className="savings">Save 25%</Typography>
                  )}
                </Box>

                <Box className="features-list">
                  <ul>
                    {tier.bullets.map((bullet, i) => (
                      <li key={i}>
                        <span className="check-icon">✓</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </Box>

                <PrimaryButton
                  variantStyle={tier.popular ? 'primary' : 'outline'}
                  className="pricing-btn"
                  fullWidth
                  animated
                >
                  {idx === 2 ? 'Talk to Sales' : 'Start free trial'}
                </PrimaryButton>
              </Box>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pricing-footer"
        >
          <Typography className="pricing-note">
            All plans include 14-day free trial. No credit card required.
          </Typography>
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default PricingPreview;
