import { useState, useEffect } from 'react';
import { adminSettingsAPI } from '../API/services';

interface AdminSettings {
  notificationsEmail: boolean;
  notificationsSms: boolean;
  darkMode: boolean;
  autoSaveInterval: string;
  useLLMDefault: boolean;
  llmProvider?: string;
  llmApiKey?: string;
}

const defaultSettings: AdminSettings = {
  notificationsEmail: true,
  notificationsSms: false,
  darkMode: false,
  autoSaveInterval: "30",
  useLLMDefault: true,
  llmProvider: 'groq',
  llmApiKey: '',
};

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await adminSettingsAPI.getSettings();
        setSettings(response.settings);
      } catch (err) {
        console.error('Failed to load admin settings:', err);
        setSettings(defaultSettings);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: AdminSettings) => {
    try {
      const response = await adminSettingsAPI.updateSettings(newSettings);
      setSettings(response.settings);
    } catch (err) {
      console.error('Failed to update admin settings:', err);
      throw err;
    }
  };

  return { settings, loading, error, updateSettings };
};