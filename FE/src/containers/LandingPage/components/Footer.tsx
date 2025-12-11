import { Box, Typography, IconButton } from "@mui/material";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import GitHubIcon from "@mui/icons-material/GitHub";
import "./Footer.scss";
import { Logo } from '../../../components/ui';

const Footer = () => {
  return (
    <Box className="footer">
      <Box className="footer-content">
        <Box className="footer-brand">
          <Logo />
        </Box>

        <Typography className="footer-description">
          Secure interviewing and consistent hiring decisions for modern teams.
        </Typography>

        <Box className="footer-socials">
          <IconButton className="social-btn">
            <TwitterIcon />
          </IconButton>
          <IconButton className="social-btn">
            <InstagramIcon />
          </IconButton>
          <IconButton className="social-btn">
            <GitHubIcon />
          </IconButton>
        </Box>
      </Box>

      <Box className="footer-divider" />

        <Typography className="footer-copy">
        © {new Date().getFullYear()} Assist-Ten. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
