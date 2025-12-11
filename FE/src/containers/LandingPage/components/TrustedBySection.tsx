import { Box, Typography } from "@mui/material";
import { SectionLayout, SectionTitle } from '../../../components/ui';
import "./TrustedBySection.scss";

const logos = [
  "/assets/logos/company1.svg",
  "/assets/logos/company2.svg",
  "/assets/logos/company3.svg",
  "/assets/logos/company4.svg",
  "/assets/logos/company5.svg",
];

const TrustedBySection = () => {
  return (
    <SectionLayout id={'trusted-by'}>
      <Box className="trusted-by">
        <SectionTitle>Trusted by hiring teams at scale</SectionTitle>
        <Box className="logos">
          {logos.map((l, i) => (
            <img src={l} key={i} alt={`logo-${i}`} className="trusted-logo" />
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default TrustedBySection;
