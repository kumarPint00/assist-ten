'use client';
import React, { useEffect, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "../../hooks/navigation";
import "./LoginContainer.scss";
import { apiCall } from "../../API";
import { allowedUsers, candidateUsers, HTTP_POST, LOGIN } from "../../API/constants";
import Loader from "../../components/Loader";
import { isAdmin } from "../../utils/adminUsers";
import { userService } from "../../API/services";
import PrimaryButton from "../../components/ui/PrimaryButton";

const LoginContainer = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/app/dashboard");
    }
  }, []);

  useEffect(() => {
    localStorage.clear();
  }, []);

  const generateAuthToken = async () => {
    try {
      setLoading(true);
      const response = await apiCall(LOGIN, HTTP_POST, {
        email: values.email,
      });

      const { access_token } = response;

      if (access_token) {
        localStorage.setItem("authToken", access_token);
      }

      setLoading(false);
      return access_token;
    } catch (error) {
      console.error("Error generating auth token:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!values.email) return;

    if (!allowedUsers.includes(values.email)) {
      alert("Unauthorized user. Please use a valid email.");
      return;
    }

    const token = await generateAuthToken();
    // Save user email locally
    localStorage.setItem("loggedInUser", values.email);
    const candidate = candidateUsers.find((candidate) => candidate.email === values.email);
    if (candidate) {
      const query = new URLSearchParams({
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
        link: candidate.link,
      }).toString();
      navigate(`/candidate?${query}`);
      return;
    }
    // Determine if user is admin via backend
    try {
      const user = await userService.getCurrentUser();
      const role = user?.role || 'user';
      if (role === 'superadmin') {
        navigate('/admin/super');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        const candidate = candidateUsers.find((candidate) => candidate.email === values.email);
        if (candidate) {
          const query = new URLSearchParams({
            name: candidate.name,
            email: candidate.email,
            role: candidate.role,
            link: candidate.link,
          }).toString();
          navigate(`/candidate?${query}`);
          return;
        }
        navigate('/app/profile-setup');
      }
    } catch (e) {
      // Fallback to static check
      if (isAdmin(values.email)) {
        navigate("/admin/dashboard");
        return;
      }
      const candidate = candidateUsers.find((candidate) => candidate.email === values.email);
      if (candidate) {
        const query = new URLSearchParams({
          name: candidate.name,
          email: candidate.email,
          role: candidate.role,
          link: candidate.link,
        }).toString();
        navigate(`/candidate?${query}`);
        return;
      }
      navigate("/app/profile-setup");
    }
  };

  if (loading) return <Loader fullscreen message="Loading App..." />;

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
    <Box className="login-page">
      <motion.div
        className="login-card"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Typography className="title">Welcome Back</Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography className="subtitle">
            Sign in to continue your journey
          </Typography>
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
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!values.email}
            animated
            fullWidth
          >
            Sign In
          </PrimaryButton>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography className="switch">
            Don&apos;t have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign Up</span>
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default LoginContainer;