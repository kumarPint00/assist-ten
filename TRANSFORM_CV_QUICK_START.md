# Transform CV Feature - Quick Start Guide

## What is Transform CV?

A powerful admin feature that allows you to:
1. Upload a candidate's **CV**
2. Upload a **Job Description (JD)**
3. Get back:
   - ✅ **PII-redacted CV** (emails, phones, companies removed)
   - ✅ **JD-matched CV** (only relevant sections)
   - ✅ **Required skills** from JD
   - ✅ **Redaction statistics**

## Where to Access It?

**Admin Dashboard** → **Sidebar** → **Operations** → **Transform CV**

Or directly: `https://your-domain.com/admin/transform-cv`

## How to Use It?

### Step 1: Upload Files
- Click on "Upload CV" box or drag & drop CV file
- Click on "Upload JD" box or drag & drop JD file
- Supported formats: PDF, DOCX, TXT (max 10 MB each)

### Step 2: (Optional) Enable LLM
- Check "Use LLM for enhanced extraction and transformation"
- This provides smarter skill extraction using AI

### Step 3: Transform
- Click **"Transform CV"** button
- Wait for processing (usually 2-5 seconds)
- Results will appear below

### Step 4: View Results
- **Tab 1 - Transformed & Redacted**: Full CV with PII removed
- **Tab 2 - JD-Filtered**: Only sections matching JD skills
- See redaction counts (emails, phones, companies removed)
- See all required skills extracted from JD

### Step 5: Download or Copy
- **Copy**: Copies text to clipboard
- **Download**: Downloads as .txt file
- Works for both transformed and filtered versions

## History

Your recent transforms are saved automatically:
- **Shows last 10 transforms** in sidebar
- Click any item to reload those results
- Click delete icon (trash) to remove from history
- History is stored locally on your browser

## Common Use Cases

1. **Candidate Pre-screening**
   - Transform CV against job posting
   - See if candidate has required skills
   - Get clean version for forwarding

2. **Privacy Protection**
   - Automatically redacts PII
   - Safe to share externally
   - Complies with privacy regulations

3. **Skill Matching**
   - See which of candidate's skills match JD
   - Identify gaps quickly
   - Focused CV for hiring team

4. **Data Compliance**
   - Removes personal contact info
   - Removes company references
   - Creates compliant version for analytics

## Tips & Tricks

- **Bulk Processing**: Use `use_llm=true` for more accurate skill extraction
- **Save Results**: Download transformed CVs for later reference
- **Share Safely**: Download redacted version to share with recruiters
- **Quick Reload**: History sidebar lets you quickly compare different candidates
- **Clear All**: Use "Clear All" button to start fresh

## What Gets Redacted?

- ✂️ Email addresses
- ✂️ Phone numbers  
- ✂️ URLs and websites
- ✂️ Company names
- ✂️ Labels like "Phone:", "Email:", "Current Company:"

## What Skills Are Recognized?

### Programming Languages
Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Kotlin, Swift

### Frontend
React, Vue, Angular, Next.js, Svelte, Ember

### Backend  
Django, FastAPI, Flask, Spring, Express, Nest.js, Rails, Laravel

### Databases
SQL, PostgreSQL, MySQL, MongoDB, Redis, Cassandra, DynamoDB, Elasticsearch

### Cloud & DevOps
AWS, GCP, Azure, Docker, Kubernetes, Jenkins, GitLab, GitHub, Terraform

### Testing
Pytest, Jest, Mocha, JUnit, Selenium

### APIs & Web Services
REST API, GraphQL, gRPC, SOAP

### Microservices
Kafka, RabbitMQ, Event-driven, Distributed Systems, Microservices

...and 40+ more skills!

## Troubleshooting

### Issue: File upload not working
- ✅ Check file format (must be PDF, DOCX, or TXT)
- ✅ Check file size (must be under 10 MB)
- ✅ Try refreshing the page

### Issue: No results showing
- ✅ Ensure both CV and JD are uploaded
- ✅ Click "Transform CV" button again
- ✅ Check browser console for errors (F12)

### Issue: Missing skills in results
- ✅ Skills must be in predefined dictionary
- ✅ Try enabling "Use LLM" for custom skill detection
- ✅ Spelling matters - "Kubernetes" vs "K8s"

### Issue: Text appears truncated in preview
- ✅ This is normal - full text is available for download
- ✅ Download the file to see complete content
- ✅ Preview shows first 1000 characters

## API Details (For Developers)

**Endpoint**: `POST /api/v1/admin/transform-cv`

**Request:**
```bash
curl -X POST "http://localhost/api/v1/admin/transform-cv?use_llm=false" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cv_file=@cv.pdf" \
  -F "jd_file=@jd.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Transformed CV generated",
  "transformed_text": "...",
  "filtered_text": "...",
  "redaction_counts": {
    "emails": 2,
    "phones": 1,
    "urls": 0,
    "companies": 1
  },
  "extracted_skills": ["Python", "React", "FastAPI", ...]
}
```

## Limitations

- ⏱️ Max 10 MB per file
- ⏱️ Supported formats: PDF, DOCX, TXT only
- ⏱️ History stored locally (not synced across devices)
- ⏱️ Max 10 items in history
- ⏱️ Processing time: 2-5 seconds typically

## Future Features (Roadmap)

- 🔄 Batch transform multiple CVs
- 💾 Server-side history (sync across devices)
- 📊 Analytics & reporting
- 🎨 Custom templates
- 🤖 ML-powered skill matching
- 📈 Trend analysis

## Need Help?

- 📧 Email: support@assist-ten.com
- 💬 Chat: In-app chat support
- 📚 Docs: Full documentation in TRANSFORM_CV_FEATURE.md

---

**Last Updated**: December 19, 2025
