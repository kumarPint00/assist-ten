"use client";
import React, { useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "../../hooks/navigation";
import "./SignUpContainer.scss";
import PrimaryButton from "../../components/ui/PrimaryButton";

const SignUpContainer = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!values.email || !values.password) return;
    navigate("/app/profile-setup");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
    }
  };

  return (
    <Box className="signup-page">
      <motion.div
        className="signup-card"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Typography className="title">Create Account</Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography className="subtitle">Join the universe</Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="Name"
            name="name"
            variant="outlined"
            fullWidth
            value={values.name}
            onChange={handleChange}
            className="input"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#6366f1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                },
              },
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="Email"
            name="email"
            variant="outlined"
            fullWidth
            value={values.email}
            onChange={handleChange}
            className="input"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#6366f1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                },
              },
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="Password"
            name="password"
            type="password"
            variant="outlined"
            fullWidth
            value={values.password}
            onChange={handleChange}
            className="input"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#6366f1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                },
              },
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!values.email || !values.password}
            animated
            fullWidth
          >
            Sign Up
          </PrimaryButton>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography className="switch">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign In</span>
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default SignUpContainer;
