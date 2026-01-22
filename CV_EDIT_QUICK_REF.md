# Quick Reference - CV Edit Features

## What's New?

### 1. PDF Download ✨ 
**Before**: PDF always downloaded as TXT
**Now**: Proper PDF with jsPDF - formatting, page breaks, margins

### 2. Edit CV Sections 
**New Button**: "Edit" on both tabs
**Function**: Remove companies, skills, projects, education

---

## How to Use - 3 Steps

### Step 1: Click "Edit" Button
- On "Transformed & Redacted" tab OR
- On "JD-Filtered" tab

### Step 2: Select/Deselect Items
```
Experience
  ☑ Software Engineer at Google       (checked = keep)
  ☑ Developer at Microsoft            (checked = keep)
  ☐ Intern at TechCo                  (unchecked = remove)

Skills
  ☑ Python
  ☑ JavaScript
  ☐ Java                              (remove if unchecked)
  ☑ React

Education
  ☑ Bachelor's - MIT - 2015
  ☐ Diploma - HighSchool - 2011       (remove if unchecked)
```

### Step 3: Click "Apply Changes"
- CV rebuilds without excluded items
- Returns to main view with updated content

---

## Download Options

| Format | Use Case | Status |
|--------|----------|--------|
| **PDF** | Professional documents, printing | ✅ NEW - Proper formatting |
| **DOCX** | Microsoft Word, editing | ✅ Works - Basic format |
| **TXT** | Plain text, fallback | ✅ Always works |

---

## Features Included

✅ **Section-level control**: Enable/disable entire section
✅ **Item-level control**: Remove specific companies, skills, etc.
✅ **Preview**: See what you're deleting before applying
✅ **Automatic parsing**: Identifies all CV sections
✅ **Smart extraction**: Recognizes companies, degrees, skills
✅ **Granular control**: Remove ANY item

---

## Supported Sections for Editing

1. **Experience** - Remove companies and roles
2. **Education** - Remove degrees and institutions
3. **Skills** - Remove specific skills
4. **Projects** - Remove projects
5. **Certifications** - Remove certificates
6. **Languages** - Remove languages

---

## Example: Remove Sensitive Companies

**Scenario**: Admin wants to remove past employers before sharing CV

1. Upload CV → Transform → Click "Edit"
2. In "Experience" section:
   - Uncheck "Software Engineer at Company-A"
   - Uncheck "Developer at Company-B"
   - Keep "Manager at Company-C"
3. Click "Apply Changes"
4. Those companies removed from CV
5. Download as PDF ✅

---

## API Endpoints (for developers)

### Parse CV Sections
```bash
POST /api/v1/admin/parse-cv-sections
Body: { "cv_text": "..." }
Returns: Structured sections with items
```

### Rebuild CV
```bash
POST /api/v1/admin/rebuild-cv
Body: {
  "cv_text": "...",
  "sections_config": {
    "experience": {"include": true, "exclude_items": ["Google"]},
    ...
  }
}
Returns: { "rebuilt_cv": "..." }
```

---

## Troubleshooting

**Q: Edit button is disabled?**
A: Wait for CV to finish parsing. Loading indicator shows progress.

**Q: Dialog won't open?**
A: CV might not have recognized sections. Try different CV format.

**Q: Changes not applying?**
A: Check browser console for errors. Try with fewer exclusions.

**Q: PDF not generating?**
A: Falls back to TXT automatically. Check browser compatibility.

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

---

## Files Modified

- `AdminTransformCV.tsx` - Frontend component
- `services.ts` - API service methods
- `admin_skill_extraction.py` - Backend API
- `cv_parser.py` - NEW - CV parsing logic

---

## Status

🟢 Production Ready - All features tested and working

---

Last Updated: December 19, 2025
