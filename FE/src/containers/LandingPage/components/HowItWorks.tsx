import { Box, Typography } from "@mui/material";
import { SectionLayout, InfoCard, SectionTitle } from '../../../components/ui';
import "./HowItWorks.scss";

const steps = [
  {
    title: "Build a template",
    desc: "Choose a role-based template or create one with your rubrics and required competencies.",
  },
  {
    title: "Run interviews",
    desc: "Launch automated or live interviews — link them to stages in your hiring pipeline.",
  },
  {
    title: "Decide with confidence",
    desc: "Scorecards, reviewer notes, and AI insights create transparent decisions and faster offers.",
  },
];

const HowItWorks = () => {
  return (
    <SectionLayout id={'how-it-works'}>
      <Box className="how-it-works">
        <SectionTitle>From posting to offer, in three steps.</SectionTitle>

        <Box className="how-steps">
          {steps.map((s, idx) => (
            <InfoCard key={idx} title={`${idx + 1}. ${s.title}`} description={s.desc} className="how-step" />
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default HowItWorks;
