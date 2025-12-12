'use client';

import { Box, Typography, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import { SectionLayout, InfoCard, SectionTitle } from '../../../components/ui';
import "./TestimonialsSection.scss";

const testimonials = [
  {
    name: "Anika Rao",
    title: "Head of Talent, Foreground",
    quote: "We cut our screening time in half and improved interview quality across the board. The automated scoring eliminated bias and made decisions faster.",
    avatar: "AR",
    rating: 5,
    company: "Foreground",
    color: "#6366f1"
  },
  {
    name: "Jordan Smith",
    title: "Hiring Manager, Orion Labs",
    quote: "Scorecards changed how we decide. Less bias, more consensus. Our time-to-hire dropped 40% while quality improved significantly.",
    avatar: "JS",
    rating: 5,
    company: "Orion Labs",
    color: "#f59e0b"
  },
  {
    name: "Mateo Cruz",
    title: "Security & Compliance, Atlas",
    quote: "The audit trail helped us meet compliance requirements — quickly and safely. Enterprise-grade security with user-friendly design.",
    avatar: "MC",
    rating: 5,
    company: "Atlas",
    color: "#10b981"
  },
];

const TestimonialsSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
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
    <SectionLayout id={'testimonials'}>
      <Box className="testimonials-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <SectionTitle>Trusted insights from modern hiring teams</SectionTitle>
        </motion.div>

        <motion.div
          className="testimonial-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{
                scale: 1.03,
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="testimonial-card-wrapper"
            >
              <Box className="testimonial-card">
                <Box className="testimonial-header">
                  <Avatar className="testimonial-avatar" style={{ backgroundColor: testimonial.color }}>
                    {testimonial.avatar}
                  </Avatar>
                  <Box className="testimonial-info">
                    <Typography className="testimonial-name">{testimonial.name}</Typography>
                    <Typography className="testimonial-title">{testimonial.title}</Typography>
                    <Typography className="testimonial-company">{testimonial.company}</Typography>
                  </Box>
                </Box>

                <Box className="rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </Box>

                <Typography className="testimonial-quote">
                  &ldquo;{testimonial.quote}&rdquo;
                </Typography>
              </Box>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="testimonials-stats"
        >
          <Box className="stats-grid">
            <Box className="stat">
              <Typography className="stat-number">4.9/5</Typography>
              <Typography className="stat-label">Average Rating</Typography>
            </Box>
            <Box className="stat">
              <Typography className="stat-number">98%</Typography>
              <Typography className="stat-label">Would Recommend</Typography>
            </Box>
            <Box className="stat">
              <Typography className="stat-number">500+</Typography>
              <Typography className="stat-label">Happy Customers</Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default TestimonialsSection;
