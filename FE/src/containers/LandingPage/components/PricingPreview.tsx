import { Box, Typography } from "@mui/material";
import { SectionLayout } from '../../../components/ui';
import { PrimaryButton } from '../../../components/ui';
import "./PricingPreview.scss";

const tiers = [
  { name: "Starter", price: "$149/mo", bullets: ["Basic templates", "25 interviews / mo"] },
  { name: "Pro", price: "$449/mo", bullets: ["Full automations", "Priority support"] },
  { name: "Enterprise", price: "Custom", bullets: ["SLA & dedicated team", "Data residency"] },
];

const PricingPreview = () => {
  return (
    <SectionLayout id={'pricing'}>
      <Box className="pricing-preview">
        <Typography variant="h4" className="pricing-title">
          Transparent enterprise pricing
        </Typography>

        <Box className="pricing-grid">
          {tiers.map((t, idx) => (
            <Box className="pricing-card" key={idx}>
              <Typography className="tier-name">{t.name}</Typography>
              <Typography className="tier-price">{t.price}</Typography>
              <ul>
                {t.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <PrimaryButton variantStyle={idx === 2 ? 'outline' : 'primary'} className="pricing-btn">{idx === 2 ? 'Talk to Sales' : 'Start free trial'}</PrimaryButton>
            </Box>
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default PricingPreview;
