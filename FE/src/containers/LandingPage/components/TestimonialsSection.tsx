import { Box, Typography, Avatar } from "@mui/material";
import { SectionLayout, InfoCard, SectionTitle } from '../../../components/ui';
import "./TestimonialsSection.scss";

const testimonials = [
  {
    name: "Anika Rao",
    title: "Head of Talent, Foreground",
    quote: "We cut our screening time in half and improved interview quality across the board.",
  },
  {
    name: "Jordan Smith",
    title: "Hiring Manager, Orion Labs",
    quote: "Scorecards changed how we decide. Less bias, more consensus.",
  },
  {
    name: "Mateo Cruz",
    title: "Security & Compliance, Atlas",
    quote: "The audit trail helped us meet compliance requirements — quickly and safely.",
  },
];

const TestimonialsSection = () => {
  return (
    <SectionLayout id={'testimonials'}>
      <Box className="testimonials-section">
        <SectionTitle>Trusted insights from modern hiring teams</SectionTitle>

        <Box className="testimonial-grid">
          {testimonials.map((t, idx) => (
            <InfoCard key={idx} title={t.name} description={`"${t.quote}" — ${t.title}`} className="testimonial-card" />
          ))}
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default TestimonialsSection;
