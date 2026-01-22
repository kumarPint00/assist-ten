# Transform CV Feature Documentation

## Overview
The Transform CV feature allows admin users to upload a candidate CV and a Job Description (JD), then receive:
- **PII-redacted CV** - Automatically removes personal information (emails, phone numbers, URLs, company names)
- **JD-filtered CV** - Extracts only the sections of the CV that match required skills from the JD
- **Extracted Skills** - Lists all technical skills required by the JD
- **Redaction Statistics** - Shows how many PII items were redacted

## Architecture

### Backend Implementation

#### API Endpoint: `POST /api/v1/admin/transform-cv`
**Location:** `BE/app/api/admin_skill_extraction.py` (lines 811-856)

**Parameters:**
- `cv_file` (File) - Candidate's CV (PDF, DOCX, or TXT)
- `jd_file` (File) - Job Description (PDF, DOCX, or TXT)
- `use_llm` (Query, bool) - Optional: Enable LLM-enhanced extraction

**Response:**
```json
{
  "success": true,
  "message": "Transformed CV generated",
  "transformed_text": "... redacted CV text ...",
  "filtered_text": "... skills-matched CV sections ...",
  "redaction_counts": {
    "emails": 2,
    "phones": 1,
    "urls": 0,
    "companies": 0
  },
  "extracted_skills": ["Python", "React", "FastAPI", ...]
}
```

**Security:**
- Requires admin authentication via `get_current_user`
- Uses `extract_text()` from `app.utils.text_extract`
- Uses `redact_pii()` from `app.utils.pii`
- Extracts skills using `extract_skills_from_text_advanced()`

### Frontend Implementation

#### Component: `AdminTransformCV`
**Location:** `FE/src/containers/AdminTransformCV/AdminTransformCV.tsx`

**Features:**
- Drag-and-drop file upload (CV and JD)
- LLM toggle option
- Tab-based result display (Transformed vs. Filtered)
- Redaction statistics display
- Extracted skills display as chips
- Copy-to-clipboard functionality
- Download as `.txt` files
- Local history (max 10 recent transforms)
- History sidebar with click-to-load and delete

**State Management:**
- Uses React hooks (useState, useEffect, useRef)
- localStorage for history persistence (`key: "admin.transformcv.history"`)
- Follows tech stack standard: TypeScript, MUI, no external state managers for this component

#### Route
**Location:** `FE/app/admin/transform-cv/page.tsx`
- Route: `/admin/transform-cv`
- Page wrapper that imports and renders the AdminTransformCV component

#### Styling
**Location:** `FE/src/containers/AdminTransformCV/AdminTransformCV.scss`
- Responsive 2-column layout (main content + history sidebar)
- Stacks on screens < 900px width
- Material Design alignment with MUI components
- Custom file upload UI with hover effects

### Navigation
**Updated:** `FE/src/containers/AdminLayout/components/AdminSidebar.tsx`
- Added "Transform CV" link under "Operations" section
- Route: `/admin/transform-cv`

### Service Integration
**File:** `FE/src/API/services.ts` (already implemented)

```typescript
transformCV: async (cv: File, jd: File, useLLM: boolean = false): Promise<any> => {
  const fd = new FormData();
  fd.append("cv_file", cv);
  fd.append("jd_file", jd);
  const response = await apiClient.post(
    `/admin/transform-cv?use_llm=${useLLM ? "true" : "false"}`, 
    fd, 
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}
```

## User Flow

1. **Admin User** navigates to `/admin/transform-cv` from sidebar
2. **Upload Files**
   - Selects CV file (PDF, DOCX, or TXT)
   - Selects JD file (PDF, DOCX, or TXT)
   - Optionally enables LLM for enhanced extraction
3. **Transform**
   - Clicks "Transform CV" button
   - Frontend calls `adminService.transformCV()`
   - Backend processes files and returns results
4. **View Results**
   - Tab 1: "Transformed & Redacted" - Shows full CV with PII redacted
   - Tab 2: "JD-Filtered" - Shows only JD-relevant sections
   - Redaction stats show how many emails, phones, etc. were redacted
   - Extracted skills displayed as tags
5. **Actions**
   - Copy transformed text to clipboard
   - Download as `.txt` file
   - Load previous transforms from history sidebar

## Technical Details

### PII Redaction (`BE/app/utils/pii.py`)
- **Emails**: Regex-based detection and replacement with `[REDACTED_EMAIL]`
- **Phones**: Pattern-based detection with `[REDACTED_PHONE]`
- **URLs**: HTTP/HTTPS and www detection with `[REDACTED_URL]`
- **Companies**: Name pattern recognition with `[REDACTED_COMPANY]`
- **Labels**: Contextual masking for "Phone:", "Email:", "Current Company:" patterns

### Skill Extraction
- Uses `extract_skills_from_text_advanced()` from `admin_skill_extraction.py`
- Detects technical skills from a predefined dictionary
- Supports 100+ skills across multiple categories:
  - Programming languages
  - Frontend/Backend frameworks
  - Databases
  - Cloud & DevOps
  - Testing tools
  - APIs & Web Services
  - Microservices & Architecture

### File Upload Constraints
- **Allowed extensions**: PDF, DOCX, TXT
- **Max file size**: 10 MB per file
- **Supported formats**: Handled by `extract_text()` utility

## Database Models

Currently uses `UploadedDocument` model for file storage:
```python
class UploadedDocument(Base, TimestampMixin):
    id: Mapped[int]
    document_type: Mapped[str]  # "jd", "cv", "portfolio", etc.
    s3_key: Mapped[str]
    file_name: Mapped[str]
    file_size: Mapped[int]
    extracted_text: Mapped[Optional[str]]
    # ... other fields
```

**Note:** For server-side persistence of transform history, a future `CVTransform` model is recommended:
```python
class CVTransform(Base, TimestampMixin):
    id: Mapped[int]
    user_id: Mapped[int]  # Admin user
    jd_file_id: Mapped[Optional[int]]
    cv_file_id: Mapped[Optional[int]]
    result_json: Mapped[dict]  # Stores full TransformCVResponse
    created_at: Mapped[datetime]
```

## API Response Schema

**Location:** `BE/app/models/schemas.py` (lines 248-257)

```python
class TransformCVResponse(BaseModel):
    success: bool
    message: str
    transformed_text: str
    filtered_text: Optional[str] = None
    redaction_counts: Optional[Dict[str, int]] = None
    extracted_skills: Optional[List[str]] = None
```

## File Structure

```
FE/
├── app/admin/transform-cv/
│   └── page.tsx (Route page)
└── src/containers/AdminTransformCV/
    ├── AdminTransformCV.tsx (Main component)
    └── AdminTransformCV.scss (Styles)

BE/
├── app/api/admin_skill_extraction.py (Endpoint)
├── app/utils/pii.py (PII redaction)
├── app/utils/text_extract.py (Text extraction)
└── app/models/schemas.py (Response models)
```

## Future Enhancements

1. **Server-side persistence** - Store transform history in database
2. **Batch transformations** - Process multiple CVs against one JD
3. **Custom skill dictionaries** - Allow admins to define org-specific skills
4. **Transform templates** - Save and reuse transformation configurations
5. **Analytics** - Track which skills are most commonly required
6. **Comparison view** - Side-by-side CV vs. JD comparison
7. **Ratings** - Allow admins to rate transformation quality for ML training

## Testing

### Manual Testing Steps
1. Navigate to `/admin/transform-cv`
2. Upload a sample CV file
3. Upload a sample JD file
4. Click "Transform CV"
5. Verify results display correctly
6. Test copy and download functionality
7. Verify history saves and loads
8. Test delete from history
9. Toggle LLM option and verify enhanced extraction

### Required Test Files
- Sample CV (PDF/DOCX/TXT with personal info)
- Sample JD (PDF/DOCX/TXT with skill requirements)

## Dependencies

- **Frontend**: React, MUI, TypeScript, SCSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic, python-docx, pdfplumber, regex
- **Services**: S3 for file storage (optional), LLM (optional, with `use_llm=true`)

## Environment Variables

- `S3_BUCKET` - S3 bucket for document storage
- `USE_LLM` - Enable LLM features (optional)
- `LLM_API_KEY` - LLM API key if using LLM extraction

## Error Handling

| Error | Status Code | Description |
|-------|------------|-------------|
| Invalid file type | 400 | File is not PDF, DOCX, or TXT |
| File too large | 413 | File exceeds 10 MB limit |
| Text extraction failed | 500 | Could not extract text from file |
| No text in CV | 422 | CV file appears to be empty or unreadable |
| No text in JD | 422 | JD file appears to be empty or unreadable |
| Unauthorized | 401 | User not authenticated |
| Forbidden | 403 | User does not have admin role |

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes
- CV/JD processing typically takes 2-5 seconds
- PII redaction is performed on extracted text
- Skill extraction is regex-based (very fast)
- No database writes for default flow (only localStorage)
- Scalable for batch operations once implemented
