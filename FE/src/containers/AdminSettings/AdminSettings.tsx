"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAdminSettings } from "../../hooks/useAdminSettings";

type AdminSettingsState = {
  notificationsEmail: boolean;
  notificationsSms: boolean;
  darkMode: boolean;
  autoSaveInterval: string;
  useLLMDefault: boolean;
  llmProvider?: string;
  llmApiKey?: string;
};

const TIMEZONES = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Kolkata"];
const NOTIFICATION_CHANNELS = [
  { key: "email", label: "Email summaries" },
  { key: "slack", label: "Slack updates" },
  { key: "dashboard", label: "In-app alerts" },
];

const PageShell = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: theme.palette.grey[100],
  padding: theme.spacing(5, 3),
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
}));

const SectionContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(0),
}));

const SettingSwitchRow = ({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
    <Box>
      <Typography variant="subtitle1">{label}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Box>
    <Switch checked={checked} onChange={onChange} />
  </Box>
);

const SectionFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

const AdminSettings: React.FC = () => {
  const { settings, loading, updateSettings } = useAdminSettings();
  const [localSettings, setLocalSettings] = useState<AdminSettingsState | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyProfile, setCompanyProfile] = React.useState({
    name: "Assist Ten Labs",
    timezone: "UTC",
    notifyEmail: "admin@assist-ten.com",
  });
  const [notificationPrefs, setNotificationPrefs] = React.useState<Record<string, boolean>>({
    email: true,
    slack: false,
    dashboard: true,
  });
  const [interviewSettings, setInterviewSettings] = React.useState("standard");
  const [retainPeriod, setRetainPeriod] = React.useState("1_year");

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (loading || !localSettings) {
    return (
      <PageShell>
        <Typography variant="h6">Loading settings...</Typography>
      </PageShell>
    );
  }

  const handleToggle = (key: keyof AdminSettingsState) => {
    setLocalSettings((prev) =>
      prev
        ? {
            ...prev,
            [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
          }
        : prev
    );
  };

  const handleChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => (prev ? ({ ...prev, [name]: value }) : prev));
  };

  const toggleNotification = (key: string) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    try {
      await updateSettings(localSettings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Admin controls
          </Typography>
          <Typography variant="h4">Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage notification, extraction, company, and retention defaults using consistent theme components.
          </Typography>
        </Box>
        <SectionFooter>
          <Button color="inherit" onClick={() => window.location.reload()}>
            Reset
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </SectionFooter>
      </Box>

      <Grid container spacing={3} marginTop={1}>
        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Notifications" description="Toggle alerts for admins" />
            <Divider />
            <SectionContent>
              <SettingSwitchRow
                label="Email notifications"
                helper="Stay updated with inbox digests"
                checked={localSettings.notificationsEmail}
                onChange={() => handleToggle("notificationsEmail")}
              />
              <SettingSwitchRow
                label="SMS notifications"
                helper="For critical alerts only"
                checked={localSettings.notificationsSms}
                onChange={() => handleToggle("notificationsSms")}
              />
              <Divider />
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                  Notification channels
                </FormLabel>
                <FormGroup>
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <FormControlLabel
                      key={channel.key}
                      control={
                        <Switch
                          checked={notificationPrefs[channel.key]}
                          onChange={() => toggleNotification(channel.key)}
                        />
                      }
                      label={channel.label}
                    />
                  ))}
                </FormGroup>
                <FormHelperText>Scoped to the company level; no platform-level hooks are touched.</FormHelperText>
              </FormControl>
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="AI extraction" subheader="What inference tools prefer" />
            <Divider />
            <SectionContent>
              <SettingSwitchRow
                label="Enable LLM by default"
                helper="Fallback to the configured provider"
                checked={localSettings.useLLMDefault}
                onChange={() => {
                  setLocalSettings((prev) =>
                    prev ? { ...prev, useLLMDefault: !prev.useLLMDefault } : prev
                  );
                  localStorage.setItem("admin.useLLM", JSON.stringify(!localSettings.useLLMDefault));
                }}
              />
              <FormControl fullWidth>
                <InputLabel id="llm-provider-label">LLM provider</InputLabel>
                <Select
                  labelId="llm-provider-label"
                  label="LLM provider"
                  name="llmProvider"
                  value={localSettings.llmProvider}
                  onChange={(event) =>
                    setLocalSettings((prev) => (prev ? { ...prev, llmProvider: event.target.value } : prev))
                  }
                >
                  <MenuItem value="groq">Groq (free)</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="ollama">Ollama (local)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="LLM API key"
                placeholder="Enter API key (optional)"
                variant="outlined"
                size="small"
                name="llmApiKey"
                value={localSettings.llmApiKey}
                onChange={(event) =>
                  setLocalSettings((prev) => (prev ? { ...prev, llmApiKey: event.target.value } : prev))
                }
                helperText="Stored locally for quick experiments"
              />
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Appearance" />
            <Divider />
            <SectionContent>
              <SettingSwitchRow
                label="Dark mode"
                helper="Theme follows admin preference"
                checked={localSettings.darkMode}
                onChange={() => handleToggle("darkMode")}
              />
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="General" />
            <Divider />
            <SectionContent>
              <FormControl fullWidth>
                <InputLabel id="autosave-interval">Auto-save interval (seconds)</InputLabel>
                <Select
                  labelId="autosave-interval"
                  label="Auto-save interval (seconds)"
                  name="autoSaveInterval"
                  value={localSettings.autoSaveInterval}
                  onChange={handleChange}
                >
                  <MenuItem value="15">Every 15 seconds</MenuItem>
                  <MenuItem value="30">Every 30 seconds</MenuItem>
                  <MenuItem value="60">Every 60 seconds</MenuItem>
                  <MenuItem value="manual">Manual only</MenuItem>
                </Select>
              </FormControl>
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Company profile" description="Company-only metadata" />
            <Divider />
            <SectionContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Company name"
                    fullWidth
                    size="small"
                    value={companyProfile.name}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, name: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="timezone-label">Timezone</InputLabel>
                    <Select
                      labelId="timezone-label"
                      label="Timezone"
                      value={companyProfile.timezone}
                      onChange={(event) => setCompanyProfile({ ...companyProfile, timezone: event.target.value })}
                    >
                      {TIMEZONES.map((tz) => (
                        <MenuItem key={tz} value={tz}>
                          {tz}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Notification email"
                    fullWidth
                    size="small"
                    type="email"
                    value={companyProfile.notifyEmail}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, notifyEmail: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    height="100%"
                    borderRadius={2}
                    border={`1px dashed #cbd5e1`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="text.secondary"
                    sx={{ minHeight: 56 }}
                  >
                    Company logo
                  </Box>
                </Grid>
              </Grid>
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Notification preferences" />
            <Divider />
            <SectionContent>
              <FormControl component="fieldset">
                <FormGroup>
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <FormControlLabel
                      key={`pref-${channel.key}`}
                      control={
                        <Switch
                          checked={notificationPrefs[channel.key]}
                          onChange={() => toggleNotification(channel.key)}
                        />
                      }
                      label={channel.label}
                    />
                  ))}
                </FormGroup>
                <FormHelperText>These stay within the company boundary; platform-level hooks remain untouched.</FormHelperText>
              </FormControl>
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Interview defaults" />
            <Divider />
            <SectionContent>
              <FormControl component="fieldset">
                <FormLabel component="legend">Default interview flow</FormLabel>
                <RadioGroup
                  value={interviewSettings}
                  onChange={(event) => setInterviewSettings(event.target.value)}
                >
                  <FormControlLabel
                    value="standard"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1">Standard workflow</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Auto-assign to recruiters with shared scorecards
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="shared"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1">Shared interviews</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Permit multiple interviewers with joined notes
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </SectionContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard>
            <CardHeader title="Data retention preferences" />
            <Divider />
            <SectionContent>
              <FormControl fullWidth>
                <InputLabel id="retention-label">Retention period</InputLabel>
                <Select
                  labelId="retention-label"
                  label="Retention period"
                  value={retainPeriod}
                  onChange={(event) => setRetainPeriod(event.target.value)}
                >
                  <MenuItem value="6_months">6 months</MenuItem>
                  <MenuItem value="1_year">1 year</MenuItem>
                  <MenuItem value="2_years">2 years</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                Interview transcripts and recordings are archived or removed after the selected period for this
                company only.
              </Typography>
            </SectionContent>
          </SectionCard>
        </Grid>
      </Grid>
    </PageShell>
  );
};

export default AdminSettings;
