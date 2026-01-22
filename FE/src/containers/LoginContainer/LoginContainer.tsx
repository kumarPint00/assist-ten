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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && values.email) {
      handleSubmit();
    }
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
    if (values.email === "recruiter@assist10.com") {
      navigate("/recruiter");
      return;
    }
    // Determine if user is admin via backend
    try {
      const user = await userService.getCurrentUser();
      const role = user?.role || 'user';

      if (role === 'superadmin') {
        navigate('/admin/super');
        return;
      }

      // Developer convenience: if this is the known superadmin email but the
      // server has not set the role, surface a helpful alert and redirect.
      if (values.email === 'superadmin@assist10.com') {
        alert('Note: your account is not marked as superadmin on the server. If you need full access, run the backend seed script to create a superadmin (see BE/scripts/seed_db.py). Redirecting to SuperAdmin panel.');
        navigate('/admin/super');
        return;
      }

      if (role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }

      if (role === 'recruiter') {
        navigate('/recruiter');
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

      navigate('/app/profile-setup');

    } catch (e) {
      // Fallback to static checks when server call fails
      if (isAdmin(values.email)) {
        navigate('/admin/dashboard');
        return;
      }

      if (values.email === 'superadmin@assist10.com') {
        alert('Note: unable to confirm superadmin role from server. Redirecting to SuperAdmin panel (you may need to seed the backend user).');
        navigate('/admin/super');
        return;
      }

      if (values.email === 'recruiter@assist10.com') {
        navigate('/recruiter');
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

      navigate('/app/profile-setup');
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
            onKeyPress={handleKeyPress}
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