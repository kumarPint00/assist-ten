import { Box, Typography } from "@mui/material";
import { SectionLayout, InfoCard, SectionTitle } from '../../../components/ui';
import "./ProblemSection.scss";

const items = [
  {
    title: "Inconsistent evaluation",
    desc: "Interviews vary with each interviewer — scoring, questions, and outcomes differ without standardized rubrics.",
  },
  {
    title: "Slow screening",
    desc: "Manual scheduling, individual reviews, and fragmented tools stretch hiring timelines.",
  },
  {
    title: "Low signal",
    desc: "Hard to compare candidates and find the right fit without consistent metrics.",
  },
];

const ProblemSection = () => {
  return (
    <SectionLayout id="problems">
      <Box className="problem-section">
        <SectionTitle>Interviews are inconsistent, slow, and noisy.</SectionTitle>
        <Box className="problem-grid">
          {items.map((i, idx) => (
            <InfoCard key={idx} title={i.title} description={i.desc} className="problem-card" />
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default ProblemSection;
