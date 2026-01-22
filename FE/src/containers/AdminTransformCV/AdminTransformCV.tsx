'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FileCopy as FileCopyIcon,
  Refresh as RefreshIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { adminService } from '@/API/services';
import FileUpload from '@/containers/AssessmentSetupContainer/components/FileUpload';
import './AdminTransformCV.scss';

interface TransformResult {
  success: boolean;
  message: string;
  transformed_text: string;
  filtered_text?: string;
  redaction_counts?: {
    emails: number;
    phones: number;
    urls: number;
    companies: number;
  };
  extracted_skills?: string[];
  createdAt?: string;
}

interface HistoryItem {
  id: string;
  jdName: string;
  cvName: string;
  result: TransformResult;
  createdAt: string;
}

interface CVSectionItem {
  id: string;
  label: string;
  include: boolean;
}

interface CVSection {
  count: number;
  title: string;
  items: CVSectionItem[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function AdminTransformCV() {
  // File state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState<string>('');
  const [useJdPaste, setUseJdPaste] = useState(false);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Result state
  const [result, setResult] = useState<TransformResult | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [useLLM, setUseLLM] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewText, setPreviewText] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Download format state
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentDownloadText, setCurrentDownloadText] = useState<string>('');
  const [currentDownloadFilename, setCurrentDownloadFilename] = useState<string>('');

  // Section editing state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cvSections, setCvSections] = useState<Record<string, CVSection>>({});
  const [editingText, setEditingText] = useState<string>('');
  const [parsingSections, setParsingSections] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin.transformcv.history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (item: HistoryItem) => {
    const updated = [item, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('admin.transformcv.history', JSON.stringify(updated));
  };

  // Handle file selection from FileUpload component
  const handleCVFileSelect = (file: File | null) => {
    setCvFile(file);
    setError(null);
  };

  const handleJDFileSelect = (file: File | null) => {
    setJdFile(file);
    setError(null);
  };

  // Extract text from uploaded file (optional, for immediate processing)
  const handleCVTextExtracted = (text: string) => {
    console.log('[AdminTransformCV] CV text extracted:', text.length, 'characters');
    // Store if needed for preview or processing
  };

  const handleJDTextExtracted = (text: string) => {
    console.log('[AdminTransformCV] JD text extracted:', text.length, 'characters');
    // Store if needed for preview or processing
  };

  // Handle transform
  const handleTransform = async () => {
    if (!cvFile || (!jdFile && !jdText.trim())) {
      setError('Please upload CV and either upload JD file or paste JD content');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let transformResponse;
      
      if (useJdPaste && jdText.trim()) {
        // Create a text file from pasted content
        const jdBlob = new Blob([jdText], { type: 'text/plain' });
        const jdFileFromText = new File([jdBlob], 'pasted-jd.txt', { type: 'text/plain' });
        transformResponse = await adminService.transformCV(cvFile, jdFileFromText, useLLM);
      } else {
        transformResponse = await adminService.transformCV(cvFile, jdFile!, useLLM);
      }

      if (transformResponse.success) {
        setResult(transformResponse);
        setSuccess(true);
        setTabValue(0);

        // Save to history
        const historyItem: HistoryItem = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          jdName: useJdPaste ? 'Pasted JD' : jdFile?.name || 'pasted-jd.txt',
          cvName: cvFile.name,
          result: transformResponse,
          createdAt: new Date().toISOString(),
        };
        saveToHistory(historyItem);
      } else {
        setError(transformResponse.message || 'Transform failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during transformation');
      console.error('Transform error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    setCvFile(null);
    setJdFile(null);
    setJdText('');
    setResult(null);
    setError(null);
    setSuccess(false);
    setTabValue(0);
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  // Preview handler
  const handlePreview = (text: string, title: string) => {
    setPreviewText(text);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  // Download handler with format options
  const handleDownloadClick = (text: string, filename: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setCurrentDownloadText(text);
    setCurrentDownloadFilename(filename);
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadFormat = (format: 'txt' | 'pdf' | 'docx') => {
    setDownloadMenuAnchor(null);

    if (format === 'txt') {
      downloadAsText(currentDownloadText, currentDownloadFilename.replace(/\.[^/.]+$/, '') + '.txt');
    } else if (format === 'pdf') {
      downloadAsPDF(currentDownloadText, currentDownloadFilename.replace(/\.[^/.]+$/, '') + '.pdf');
    } else if (format === 'docx') {
      downloadAsDOCX(currentDownloadText, currentDownloadFilename.replace(/\.[^/.]+$/, '') + '.docx');
    }
  };

  // Download as PDF using jsPDF
  const downloadAsPDF = (text: string, filename: string) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;
      const lineHeight = 5;
      let yPosition = margin;

      // Split text into lines and fit to page
      const lines = text.split('\n');
      const fontSize = 10;
      
      doc.setFontSize(fontSize);
      doc.setFont('Arial', 'normal');

      for (const line of lines) {
        // Word wrap text to fit page width
        const wrappedLines = doc.splitTextToSize(line || ' ', maxWidth);
        
        for (const wrappedLine of wrappedLines) {
          // Check if we need a new page
          if (yPosition + lineHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }

          doc.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        }
      }

      doc.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Fallback to text
      downloadAsText(text, filename.replace('.pdf', '.txt'));
    }
  };

  // Download as DOCX using a simple method
  const downloadAsDOCX = (text: string, filename: string) => {
    try {
      // Create a simple DOCX-like structure (base64 encoded XML)
      const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${text.split('\n').map(line => `<w:p><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>`).join('\n')}
  </w:body>
</w:document>`;

      const blob = new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX generation failed:', err);
      // Fallback to text
      downloadAsText(text, filename.replace('.docx', '.txt'));
    }
  };

  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Handle edit CV sections
  const handleEditSections = async (text: string) => {
    setEditingText(text);
    setParsingSections(true);
    
    try {
      // Call backend to parse sections
      const response = await adminService.parseCVSections(text);

      if (response.data.sections) {
        const sections: Record<string, CVSection> = {};
        for (const [key, value] of Object.entries(response.data.sections)) {
          sections[key] = value as CVSection;
        }
        setCvSections(sections);
      }
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Failed to parse CV sections:', err);
      setError('Failed to parse CV sections');
    } finally {
      setParsingSections(false);
    }
  };

  // Apply section changes
  const handleApplyChanges = async () => {
    try {
      const sectionsConfig: Record<string, any> = {};
      
      for (const [key, section] of Object.entries(cvSections)) {
        const excludeItems: string[] = [];
        
        for (const item of section.items) {
          if (!item.include) {
            excludeItems.push(item.label);
          }
        }

        sectionsConfig[key] = {
          include: section.items.some(item => item.include),
          exclude_items: excludeItems
        };
      }

      const response = await adminService.rebuildCV(editingText, sectionsConfig);

      if (response.data.rebuilt_cv) {
        setEditingText(response.data.rebuilt_cv);
        setResult(prev => prev ? {
          ...prev,
          transformed_text: response.data.rebuilt_cv
        } : null);
        setEditDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to apply changes:', err);
      setError('Failed to apply changes');
    }
  };

  // Download as text
  const downloadAsText = (text: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Load from history
  const handleLoadFromHistory = (item: HistoryItem) => {
    setResult(item.result);
    setTabValue(0);
  };

  // Delete history item
  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('admin.transformcv.history', JSON.stringify(updated));
    setDeleteConfirmOpen(false);
    setDeleteItemId(null);
  };

  const getDisplayText = (text: string | undefined) => {
    if (!text) return '';
    return text.length > 1000 ? text.substring(0, 1000) + '\n\n[... truncated for preview]' : text;
  };

  return (
    <Box className="admin-transformcv">
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Main Content - Left Side */}
        <Grid item xs={12} md={8}>
          {/* Header */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Transform CV Against JD"
              subheader="Upload and transform candidate CV by matching it against the Job Description. PII will be automatically redacted."
              action={
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleClear}
                  disabled={!cvFile && !jdFile && !result}
                >
                  Clear All
                </Button>
              }
            />
          </Card>

          {/* Alerts */}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          {success && !error && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
              Transformation completed successfully!
            </Alert>
          )}

          {/* File Upload Section */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Upload Files" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {/* CV Upload */}
              <Grid item xs={12} sm={6}>
                <FileUpload
                  label="Upload CV"
                  onFileSelect={handleCVFileSelect}
                  onTextExtracted={handleCVTextExtracted}
                  isRequired={true}
                />
              </Grid>                {/* JD Upload or Paste */}
                <Grid item xs={12} sm={6}>
                  {!useJdPaste ? (
                    <FileUpload
                      label="Upload JD"
                      onFileSelect={handleJDFileSelect}
                      onTextExtracted={handleJDTextExtracted}
                      isRequired={true}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      placeholder="Paste your Job Description here..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                </Grid>

                {/* Toggle between upload and paste for JD */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setUseJdPaste(!useJdPaste);
                        setJdFile(null);
                        setJdText('');
                      }}
                    >
                      {useJdPaste ? 'Switch to Upload' : 'Or Paste JD'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* LLM Toggle */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="checkbox"
                  id="use-llm"
                  checked={useLLM}
                  onChange={(e) => setUseLLM(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="use-llm" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Use LLM for enhanced extraction and transformation
                </label>
              </Box>
            </CardContent>
          </Card>

          {/* Transform Button */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleTransform}
              disabled={!cvFile || (!jdFile && !jdText.trim()) || loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              {loading ? 'Transforming...' : 'Transform CV'}
            </Button>
          </Box>

          {/* Results Section */}
          {result && (
            <Card>
              <CardHeader
                title="Transformation Results"
                subheader={`Processed on ${new Date(result.createdAt || new Date()).toLocaleString()}`}
              />
              <Divider />
              <CardContent>
                {/* Redaction Counts */}
                {result.redaction_counts && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      PII Redacted:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {result.redaction_counts.emails > 0 && (
                        <Chip
                          label={`${result.redaction_counts.emails} Email(s)`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {result.redaction_counts.phones > 0 && (
                        <Chip
                          label={`${result.redaction_counts.phones} Phone(s)`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {result.redaction_counts.urls > 0 && (
                        <Chip
                          label={`${result.redaction_counts.urls} URL(s)`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {result.redaction_counts.companies > 0 && (
                        <Chip
                          label={`${result.redaction_counts.companies} Company(s)`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Extracted Skills */}
                {result.extracted_skills && result.extracted_skills.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Required Skills from JD:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {result.extracted_skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Tabs for Results */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Transformed & Redacted" id="tab-0" />
                    {result.filtered_text && <Tab label="JD-Filtered" id="tab-1" />}
                  </Tabs>
                </Box>

                {/* Transformed Text Tab */}
                <TabPanel value={tabValue} index={0}>
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    value={getDisplayText(result.transformed_text)}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip title="Preview full CV">
                      <Button
                        variant="outlined"
                        startIcon={<PreviewIcon />}
                        onClick={() => handlePreview(result.transformed_text, 'Transformed & Redacted CV')}
                        size="small"
                      >
                        Preview
                      </Button>
                    </Tooltip>
                    <Tooltip title="Copy to clipboard">
                      <Button
                        variant="outlined"
                        startIcon={<FileCopyIcon />}
                        onClick={() => handleCopy(result.transformed_text)}
                        size="small"
                      >
                        Copy
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit sections - remove companies, projects, skills, etc.">
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditSections(result.transformed_text)}
                        size="small"
                        disabled={parsingSections}
                      >
                        {parsingSections ? 'Parsing...' : 'Edit'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Download in multiple formats">
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={(e) =>
                          handleDownloadClick(
                            result.transformed_text,
                            `CV-Transformed-${Date.now()}.txt`,
                            e
                          )
                        }
                        size="small"
                      >
                        Download
                      </Button>
                    </Tooltip>
                  </Box>
                </TabPanel>

                {/* Filtered Text Tab */}
                <TabPanel value={tabValue} index={1}>
                  {result.filtered_text ? (
                    <>
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={getDisplayText(result.filtered_text)}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="Preview full CV">
                          <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            onClick={() => handlePreview(result.filtered_text || '', 'JD-Filtered CV')}
                            size="small"
                          >
                            Preview
                          </Button>
                        </Tooltip>
                        <Tooltip title="Copy to clipboard">
                          <Button
                            variant="outlined"
                            startIcon={<FileCopyIcon />}
                            onClick={() => handleCopy(result.filtered_text || '')}
                            size="small"
                          >
                            Copy
                          </Button>
                        </Tooltip>
                        <Tooltip title="Edit sections - remove companies, projects, skills, etc.">
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditSections(result.filtered_text || '')}
                            size="small"
                            disabled={parsingSections}
                          >
                            {parsingSections ? 'Parsing...' : 'Edit'}
                          </Button>
                        </Tooltip>
                        <Tooltip title="Download in multiple formats">
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={(e) =>
                              handleDownloadClick(
                                result.filtered_text || '',
                                `CV-Filtered-${Date.now()}.txt`,
                                e
                              )
                            }
                            size="small"
                          >
                            Download
                          </Button>
                        </Tooltip>
                      </Box>
                    </>
                  ) : (
                    <Typography color="textSecondary">No filtered text available</Typography>
                  )}
                </TabPanel>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* History - Right Side */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardHeader title="Recent Transforms" />
            <Divider />
            <CardContent sx={{ maxHeight: '600px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center">
                  No history yet. Transform a CV to get started.
                </Typography>
              ) : (
                <List dense>
                  {history.map((item) => (
                    <ListItem
                      key={item.id}
                      secondaryAction={
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => {
                              setDeleteItemId(item.id);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                      disablePadding
                    >
                      <ListItemButton
                        dense
                        onClick={() => handleLoadFromHistory(item)}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: '#f5f5f5',
                          '&:hover': { backgroundColor: '#e8e8e8' },
                        }}
                      >
                        <ListItemText
                          primary={item.cvName}
                          secondary={`vs ${item.jdName}\n${new Date(item.createdAt).toLocaleString()}`}
                          secondaryTypographyProps={{ component: 'div', variant: 'caption' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete History Item</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this history item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => deleteItemId && handleDeleteHistory(deleteItemId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Format Dialog */}
      <Dialog
        open={Boolean(downloadMenuAnchor)}
        onClose={() => setDownloadMenuAnchor(null)}
      >
        <DialogTitle>Select Download Format</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Choose the format to download your CV:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleDownloadFormat('txt')}
              sx={{ justifyContent: 'flex-start' }}
            >
              📄 TXT (Plain Text)
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleDownloadFormat('pdf')}
              sx={{ justifyContent: 'flex-start' }}
            >
              📕 PDF (Portable Document Format)
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleDownloadFormat('docx')}
              sx={{ justifyContent: 'flex-start' }}
            >
              📘 DOCX (Microsoft Word)
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadMenuAnchor(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{previewTitle}</Typography>
          <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: 1.5,
              backgroundColor: '#f5f5f5',
              padding: 2,
              borderRadius: 1,
              border: '1px solid #ddd',
            }}
          >
            {previewText}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => handleCopy(previewText)} startIcon={<FileCopyIcon />}>
            Copy All
          </Button>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Sections Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>Edit CV Sections</DialogTitle>
        <Divider />
        <DialogContent sx={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', pt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select which sections to keep. Uncheck to remove companies, projects, skills, or education.
          </Typography>

          {Object.entries(cvSections).map(([key, section]) => (
            <Box key={key} sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={section.items.length > 0 && section.items.some(item => item.include)}
                    onChange={(e) => {
                      const newSections = { ...cvSections };
                      newSections[key].items = newSections[key].items.map(item => ({
                        ...item,
                        include: e.target.checked
                      }));
                      setCvSections(newSections);
                    }}
                  />
                }
                label={
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {section.title} ({section.count} items)
                  </Typography>
                }
              />

              {section.items.length > 0 && (
                <Box sx={{ ml: 4, mt: 1, border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                  {section.items.map((item, idx) => (
                    <FormControlLabel
                      key={`${key}-${idx}`}
                      control={
                        <Checkbox
                          size="small"
                          checked={item.include}
                          onChange={(e) => {
                            const newSections = { ...cvSections };
                            newSections[key].items[idx].include = e.target.checked;
                            setCvSections(newSections);
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {item.label}
                        </Typography>
                      }
                      sx={{ display: 'block', my: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApplyChanges}
            variant="contained"
            color="primary"
          >
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

