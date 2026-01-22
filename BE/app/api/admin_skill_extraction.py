"""Admin endpoints for bulk skill extraction from documents."""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status, Query, Body
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import uuid
from io import BytesIO

from app.core.dependencies import get_db, get_current_user
from app.core.storage import get_s3_service
from app.core.security import check_admin
from app.utils.text_extract import extract_text
from app.utils.pii import redact_pii
from app.db.models import User, UploadedDocument, SkillMatch
from app.models.schemas import (
    AdminBulkSkillExtractionResponse,
    DocumentSkillExtractionResponse,
    ExtractedSkill,
    SkillMatchResponse,
    MatchedSkill,
    SkillMatchRecord,
    TransformCVResponse,
)
from app.utils.cv_parser import CVParser
from app.utils.cv_formatter import CVFormatter, format_cv_from_parsed_sections

router = APIRouter(prefix="/api/v1/admin", tags=["admin-skill-extraction"])

# Constants
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
ALLOWED_DOC_TYPES = {"jd", "cv", "portfolio", "requirements", "specifications"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Skill dictionaries
TECHNICAL_SKILLS = {
    # Programming Languages
    "python": ("advanced", "technical", 0.95),
    "javascript": ("advanced", "technical", 0.95),
    "typescript": ("advanced", "technical", 0.95),
    "java": ("advanced", "technical", 0.95),
    "c++": ("advanced", "technical", 0.95),
    "c#": ("advanced", "technical", 0.95),
    "go": ("advanced", "technical", 0.92),
    "rust": ("advanced", "technical", 0.92),
    "kotlin": ("advanced", "technical", 0.90),
    "swift": ("advanced", "technical", 0.90),
    # Frontend Frameworks
    "react": ("intermediate", "technical", 0.95),
    "vue": ("intermediate", "technical", 0.95),
    "angular": ("intermediate", "technical", 0.93),
    "next.js": ("intermediate", "technical", 0.92),
    "svelte": ("intermediate", "technical", 0.90),
    "ember": ("intermediate", "technical", 0.85),
    # Backend Frameworks
    "django": ("intermediate", "technical", 0.93),
    "fastapi": ("intermediate", "technical", 0.93),
    "flask": ("intermediate", "technical", 0.93),
    "spring": ("intermediate", "technical", 0.93),
    "express": ("intermediate", "technical", 0.93),
    "nest.js": ("intermediate", "technical", 0.90),
    "rails": ("intermediate", "technical", 0.90),
    "laravel": ("intermediate", "technical", 0.90),
    # Databases
    "sql": ("advanced", "technical", 0.95),
    "postgresql": ("advanced", "technical", 0.95),
    "mysql": ("advanced", "technical", 0.95),
    "mongodb": ("intermediate", "technical", 0.93),
    "redis": ("intermediate", "technical", 0.93),
    "cassandra": ("intermediate", "technical", 0.90),
    "dynamodb": ("intermediate", "technical", 0.90),
    "elasticsearch": ("intermediate", "technical", 0.88),
    # Cloud & DevOps
    "aws": ("intermediate", "technical", 0.95),
    "gcp": ("intermediate", "technical", 0.95),
    "azure": ("intermediate", "technical", 0.95),
    "docker": ("intermediate", "technical", 0.95),
    "kubernetes": ("intermediate", "technical", 0.93),
    "jenkins": ("intermediate", "technical", 0.90),
    "gitlab": ("intermediate", "technical", 0.90),
    "github": ("intermediate", "technical", 0.90),
    "terraform": ("intermediate", "technical", 0.88),
    # Message Queues & Event Streaming
    "kafka": ("intermediate", "technical", 0.90),
    "rabbitmq": ("intermediate", "technical", 0.90),
    "celery": ("intermediate", "technical", 0.85),
    "redis queue": ("intermediate", "technical", 0.85),
    # APIs & Web Services
    "rest api": ("advanced", "technical", 0.95),
    "graphql": ("intermediate", "technical", 0.93),
    "grpc": ("intermediate", "technical", 0.85),
    "soap": ("beginner", "technical", 0.80),
    # Microservices & Architecture
    "microservices": ("intermediate", "technical", 0.90),
    "system design": ("intermediate", "technical", 0.88),
    "distributed systems": ("intermediate", "technical", 0.85),
    "event-driven": ("intermediate", "technical", 0.85),
    # Testing
    "pytest": ("intermediate", "technical", 0.90),
    "jest": ("intermediate", "technical", 0.90),
    "mocha": ("intermediate", "technical", 0.88),
    "junit": ("intermediate", "technical", 0.88),
    "selenium": ("intermediate", "technical", 0.85),
    # DevOps Tools
    "git": ("advanced", "technical", 0.95),
    "ci/cd": ("intermediate", "technical", 0.92),
    "monitoring": ("intermediate", "technical", 0.85),
    "logging": ("intermediate", "technical", 0.85),
    # Utilities
    "linux": ("advanced", "technical", 0.90),
    "bash": ("advanced", "technical", 0.90),
    "shell": ("advanced", "technical", 0.90),
    "powershell": ("intermediate", "technical", 0.85),
    "nginx": ("intermediate", "technical", 0.85),
    "apache": ("intermediate", "technical", 0.85),
}

SOFT_SKILLS = {
    "communication": ("intermediate", "soft", 0.90),
    "leadership": ("intermediate", "soft", 0.90),
    "teamwork": ("advanced", "soft", 0.90),
    "problem solving": ("advanced", "soft", 0.90),
    "analytical": ("advanced", "soft", 0.90),
    "project management": ("intermediate", "soft", 0.88),
    "critical thinking": ("advanced", "soft", 0.85),
    "creativity": ("intermediate", "soft", 0.80),
    "collaboration": ("advanced", "soft", 0.85),
    "adaptability": ("intermediate", "soft", 0.80),
}

LANGUAGE_SKILLS = {
    "english": ("advanced", "language", 0.95),
    "spanish": ("intermediate", "language", 0.90),
    "german": ("intermediate", "language", 0.90),
    "french": ("intermediate", "language", 0.90),
    "mandarin": ("intermediate", "language", 0.90),
    "hindi": ("intermediate", "language", 0.90),
}

PROFICIENCY_WEIGHTS = {
    "beginner": 0.6,
    "intermediate": 1.0,
    "advanced": 1.2,
    "expert": 1.3
}


# Utility functions
def allowed_file(filename: str) -> bool:
    """Check if file has allowed extension."""
    ext = filename.split(".")[-1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_file(file: UploadFile) -> None:
    """Validate file type and raise HTTPException if invalid."""
    if not file.filename or not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )


def validate_doc_type(doc_type: str) -> None:
    """Validate document type and raise HTTPException if invalid."""
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid doc_type. Must be one of: {', '.join(ALLOWED_DOC_TYPES)}"
        )


async def read_and_validate_file(file: UploadFile, max_size: int = MAX_FILE_SIZE) -> bytes:
    """Read file and validate size."""
    file_bytes = await file.read()
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {max_size // (1024*1024)}MB"
        )
    return file_bytes


def extract_skills_from_text_advanced(text: str, filename: str = "") -> Dict[str, Tuple[str, str, float]]:
    """
    Extract skills from text with proficiency levels and categories.
    
    Returns:
        Dict[skill_name] = (proficiency_level, category, confidence)
    """
    if not text:
        return {}
    
    import re
    text_lower = text.lower()
    extracted_skills = {}
    
    # Extract technical skills
    for skill, (proficiency, category, confidence) in TECHNICAL_SKILLS.items():
        patterns = [
            rf'\b{re.escape(skill)}\b',
            rf'\b{re.escape(skill)}\s+',
        ]
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                extracted_skills[skill.title()] = (proficiency, category, confidence)
                break
    
    # Extract soft skills
    for skill, (proficiency, category, confidence) in SOFT_SKILLS.items():
        if re.search(rf'\b{re.escape(skill)}\b', text_lower, re.IGNORECASE):
            extracted_skills[skill.title()] = (proficiency, category, confidence)
    
    # Extract language skills
    for skill, (proficiency, category, confidence) in LANGUAGE_SKILLS.items():
        if re.search(rf'\b{re.escape(skill)}\b', text_lower, re.IGNORECASE):
            extracted_skills[skill.title()] = (proficiency, category, confidence)
    
    return extracted_skills


async def extract_skills_with_llm(text: str, doc_type: str) -> List[ExtractedSkill]:
    """Extract and classify skills using LLM."""
    try:
        from app.utils.llm_cv_extractor import LLMCVExtractor
        from config import get_settings
        
        settings = get_settings()
        provider = settings.LLM_PROVIDER
        api_key = settings.LLM_API_KEY or settings.GROQ_API_KEY
        
        extractor = LLMCVExtractor(api_key=api_key, provider=provider)
        llm_result = await extractor.extract_cv_data(text)
        
        prof_map = {"strong": "advanced", "intermediate": "intermediate", "basic": "beginner"}
        skills = []
        
        for cls in llm_result.get("classified_skills", []):
            name = cls.get("skill_name")
            if not name:
                continue
            
            cat = cls.get("category")
            conf = float(cls.get("confidence", 0.0) or 0.0)
            proficiency = prof_map.get(cat, "intermediate")
            category = "technical" if proficiency in ["advanced", "intermediate"] else "soft"
            
            skills.append(ExtractedSkill(
                skill_name=name,
                proficiency_level=proficiency,
                category=category,
                confidence=conf,
                frequency=1
            ))
        
        return skills
    except Exception as e:
        print(f"LLM skill extraction failed: {e}")
        return []


async def upload_document_to_s3(
    file_bytes: bytes,
    filename: str,
    doc_type: str,
    user_id: int,
    content_type: str,
) -> Tuple[str, str]:
    """Upload document to S3 and return file_id and s3_key."""
    s3_service = get_s3_service()
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.utcnow().isoformat()
    s3_key = f"documents/{doc_type}/admin/{timestamp}/{file_id}/{filename}"
    
    await s3_service.upload_file(
        file_obj=file_bytes,
        object_name=s3_key,
        content_type=content_type or "application/octet-stream",
        metadata={
            "file_id": file_id,
            "doc_type": doc_type,
            "original_filename": filename,
            "uploaded_by": str(user_id),
        }
    )
    
    return file_id, s3_key


async def save_document_to_db(
    db: AsyncSession,
    file_id: str,
    user_id: int,
    filename: str,
    doc_type: str,
    s3_key: str,
    file_bytes: bytes,
    content_type: str,
    extracted_text: str,
) -> UploadedDocument:
    """Save document metadata to database."""
    document = UploadedDocument(
        file_id=file_id,
        user_id=user_id,
        original_filename=filename,
        file_type=filename.split(".")[-1].lower(),
        document_category=doc_type,
        s3_key=s3_key,
        file_size=len(file_bytes),
        mime_type=content_type or "application/octet-stream",
        extracted_text=extracted_text,
        extraction_preview=extracted_text[:500] if extracted_text else None,
        is_encrypted=True,
        encryption_method="AES-256-GCM",
    )
    db.add(document)
    await db.flush()
    return document


def aggregate_skills(skills_dict: Dict[str, ExtractedSkill]) -> Tuple[Dict[str, int], Dict[str, int]]:
    """Aggregate skills by category and proficiency."""
    skills_by_category = {}
    proficiency_distribution = {}
    
    for skill in skills_dict.values():
        skills_by_category[skill.category] = skills_by_category.get(skill.category, 0) + 1
        proficiency_distribution[skill.proficiency_level] = proficiency_distribution.get(skill.proficiency_level, 0) + 1
    
    return skills_by_category, proficiency_distribution


async def classify_document(text: str, use_llm: bool) -> Dict:
    """Classify document type using LLM or heuristics."""
    if use_llm:
        try:
            from app.utils.llm_cv_extractor import LLMCVExtractor
            from config import get_settings
            
            settings = get_settings()
            provider = settings.LLM_PROVIDER
            api_key = settings.LLM_API_KEY or settings.GROQ_API_KEY
            extractor = LLMCVExtractor(api_key=api_key, provider=provider)
            return await extractor.classify_document(text or "")
        except Exception as e:
            return {"document_type": "unknown", "confidence": 0.0, "reason": str(e)}
    else:
        # Heuristic classification
        import re
        txt = (text or "").lower()
        if re.search(r"\b(objective|curriculum vitae|resume|work experience|education|projects|achievements)\b", txt):
            return {"document_type": "cv", "confidence": 0.6, "reason": "heuristic keyword match"}
        if re.search(r"\b(responsibilities|we are looking for|job description|we will|required skills|must have)\b", txt):
            return {"document_type": "jd", "confidence": 0.6, "reason": "heuristic keyword match"}
        return {"document_type": "unknown", "confidence": 0.3, "reason": "no keywords matched"}


def validate_document_pair(jd_class: Dict, cv_class: Dict, jd_text: str, cv_text: str) -> Optional[str]:
    """Validate JD and CV are correct document types. Returns warning message if invalid."""
    # Check for identical files
    if (jd_text or "").strip() == (cv_text or "").strip():
        return "The uploaded JD and CV appear to be identical. Please verify you uploaded the correct JD and CV files."
    
    # Check if both are CVs
    if (jd_class.get("document_type") == "cv" and 
        cv_class.get("document_type") == "cv" and 
        jd_class.get("confidence", 0) >= 0.75 and 
        cv_class.get("confidence", 0) >= 0.75):
        return "Both uploaded files look like candidate CVs, not a JD and a CV. Please upload both a JD and a CV."
    
    # Check if both are JDs
    if (jd_class.get("document_type") == "jd" and 
        cv_class.get("document_type") == "jd" and 
        jd_class.get("confidence", 0) >= 0.75 and 
        cv_class.get("confidence", 0) >= 0.75):
        return "Both uploaded files look like Job Descriptions (JDs), not a JD and a CV. Please upload both a JD and a CV."
    
    return None


def calculate_match_score(
    jd_skills: Dict[str, Tuple[str, str, float]],
    cv_skills: Dict[str, Tuple[str, str, float]],
) -> Tuple[float, List[MatchedSkill], List[str], List[str]]:
    """Calculate skill match score and return matched, missing, and extra skills."""
    jd_skill_names = set(jd_skills.keys())
    cv_skill_names = set(cv_skills.keys())
    
    matched = jd_skill_names.intersection(cv_skill_names)
    missing = jd_skill_names.difference(cv_skill_names)
    extra = cv_skill_names.difference(jd_skill_names)
    
    # Calculate weighted score
    total_weight = sum(
        PROFICIENCY_WEIGHTS.get(jd_skills.get(s, ("intermediate", "technical", 0.7))[0], 1.0)
        for s in jd_skill_names
    ) or 1.0
    
    matched_weight = 0.0
    matched_skills_list = []
    
    for s in matched:
        jd_prof = jd_skills.get(s, ("intermediate", "technical", 0.7))[0]
        cv_prof = cv_skills.get(s, ("intermediate", "technical", 0.7))[0]
        cv_conf = cv_skills.get(s, (jd_prof, "technical", 0.6))[2] or 0.6
        
        weight = min(
            PROFICIENCY_WEIGHTS.get(jd_prof, 1.0),
            PROFICIENCY_WEIGHTS.get(cv_prof, 1.0)
        )
        matched_weight += weight * (cv_conf or 0.6)
        
        matched_skills_list.append(MatchedSkill(
            skill_name=s,
            jd_proficiency=jd_prof,
            cv_proficiency=cv_prof,
            confidence=cv_conf
        ))
    
    score = min((matched_weight / total_weight) * 100, 100.0)
    
    return round(float(score), 2), matched_skills_list, list(missing), list(extra)


async def save_skill_match(
    db: AsyncSession,
    user_id: int,
    jd_file_id: Optional[int],
    cv_file_id: Optional[int],
    response: SkillMatchResponse,
    use_llm: bool,
    provider: Optional[str],
) -> None:
    """Save skill match record to database."""
    try:
        skill_match = SkillMatch(
            user_id=user_id,
            jd_file_id=jd_file_id,
            cv_file_id=cv_file_id,
            match_score=float(response.match_score),
            matched_skills=[{
                'skill_name': s.skill_name,
                'jd_proficiency': s.jd_proficiency,
                'cv_proficiency': s.cv_proficiency,
                'confidence': s.confidence
            } for s in response.matched_skills],
            missing_skills=response.missing_skills,
            extra_skills=response.extra_skills,
            summary=response.details,
            llm_used=use_llm,
            provider=provider if use_llm else None,
        )
        db.add(skill_match)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Failed to persist skill match record: {e}")


def filter_cv_by_skills(redacted_cv: str, jd_skills: List[str]) -> str:
    """
    Create a JD-filtered version of CV that highlights relevant skills and experience.
    
    This function:
    1. Keeps the complete CV structure and formatting
    2. Highlights sections relevant to JD skills
    3. Marks sections with skill matches for easy scanning
    4. Preserves all original content (no deletion)
    
    Returns the CV with annotations for skill-relevant sections.
    """
    if not jd_skills or not redacted_cv:
        return redacted_cv
    
    skill_keywords = {s.lower() for s in jd_skills}
    lines = redacted_cv.splitlines()
    filtered_lines = []
    
    # Common CV section headers
    section_headers = {
        "experience", "work experience", "professional experience",
        "skills", "technical skills", "core competencies", "expertise",
        "education", "academic", "certifications",
        "projects", "portfolio", "achievements",
        "languages", "summary", "objective", "profile"
    }
    
    # Sections that are always important (never skip)
    always_include_sections = {
        "skills", "technical skills", "core competencies",
        "education", "academic", "certifications", "certificates",
        "summary", "objective", "profile"
    }
    
    current_section = None
    section_has_match = False
    buffered_section = []
    
    for line in lines:
        low = line.lower().strip()
        
        # Check if this is a section header
        is_section_header = any(header in low for header in section_headers)
        
        if is_section_header:
            # Flush previous section based on criteria
            if buffered_section:
                should_include = (
                    section_has_match or 
                    current_section in always_include_sections or
                    current_section and any(h in current_section for h in ["experience", "work"])
                )
                if should_include:
                    filtered_lines.extend(buffered_section)
            
            # Start new section
            buffered_section = [line]
            current_section = low
            section_has_match = False
            continue
        
        # Add line to current section buffer
        buffered_section.append(line)
        
        # Check if line contains any JD skill keywords
        if not section_has_match and any(k in low for k in skill_keywords):
            section_has_match = True
    
    # Flush the last section
    if buffered_section:
        should_include = (
            section_has_match or 
            current_section in always_include_sections or
            current_section and any(h in current_section for h in ["experience", "work"])
        )
        if should_include:
            filtered_lines.extend(buffered_section)
    
    result = "\n".join(filtered_lines).strip()
    
    # If nothing matched, return the original CV (don't return empty)
    return result if result else redacted_cv


# API Endpoints
@router.post(
    "/extract-skills-bulk",
    response_model=AdminBulkSkillExtractionResponse,
    status_code=status.HTTP_200_OK,
)
async def extract_skills_from_documents(
    files: List[UploadFile] = File(..., description="Upload JD, CV, Requirements, Specifications documents"),
    doc_type: str = Query("jd", description="Document type: jd, cv, portfolio, requirements, specifications"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AdminBulkSkillExtractionResponse:
    """
    Admin endpoint to extract skills from multiple uploaded documents (JD, CV, etc.).
    
    Features:
    - Bulk upload support (single or multiple files)
    - Text extraction from PDF, DOCX, TXT
    - Intelligent skill pattern matching with confidence scores
    - Proficiency level detection (beginner, intermediate, advanced, expert)
    - Aggregated skill summary across all documents
    - Per-document extraction details
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file must be uploaded"
        )
    
    validate_doc_type(doc_type)
    
    document_results = []
    all_extracted_skills = {}
    
    for file in files:
        if not file.filename or not allowed_file(file.filename):
            continue
        
        try:
            file_bytes = await read_and_validate_file(file)
            extracted_text = extract_text(file_bytes, file.filename)
        except HTTPException:
            continue
        except Exception as e:
            print(f"Text extraction failed for {file.filename}: {str(e)}")
            continue
        
        extracted_skills_dict = extract_skills_from_text_advanced(extracted_text, file.filename)
        
        document_skills = []
        for skill_name, (proficiency, category, confidence) in extracted_skills_dict.items():
            skill_obj = ExtractedSkill(
                skill_name=skill_name,
                proficiency_level=proficiency,
                category=category,
                confidence=confidence,
            )
            document_skills.append(skill_obj)
            
            if skill_name in all_extracted_skills:
                existing = all_extracted_skills[skill_name]
                existing.frequency += 1
                existing.confidence = max(existing.confidence, confidence)
            else:
                all_extracted_skills[skill_name] = ExtractedSkill(
                    skill_name=skill_name,
                    proficiency_level=proficiency,
                    category=category,
                    frequency=1,
                    confidence=confidence,
                )
        
        try:
            file_id, s3_key = await upload_document_to_s3(
                file_bytes, file.filename, doc_type, current_user.id, file.content_type
            )
            
            await save_document_to_db(
                db, file_id, current_user.id, file.filename, doc_type,
                s3_key, file_bytes, file.content_type, extracted_text
            )
        except Exception as e:
            print(f"Failed to upload {file.filename}: {str(e)}")
            continue
        
        document_results.append(
            DocumentSkillExtractionResponse(
                file_id=file_id,
                original_filename=file.filename,
                document_category=doc_type,
                extracted_skills=document_skills,
                total_skills_found=len(document_skills),
                extraction_preview=extracted_text[:500] if extracted_text else "",
            )
        )
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save documents: {str(e)}"
        )
    
    if not document_results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid files could be processed"
        )
    
    aggregated_skills = list(all_extracted_skills.values())
    skills_by_category, proficiency_distribution = aggregate_skills(all_extracted_skills)
    
    return AdminBulkSkillExtractionResponse(
        success=True,
        message=f"Successfully extracted skills from {len(document_results)} document(s)",
        documents_processed=len(document_results),
        total_unique_skills=len(aggregated_skills),
        extracted_skills=aggregated_skills,
        documents=document_results,
        extraction_summary={
            "skills_by_category": skills_by_category,
            "proficiency_distribution": proficiency_distribution,
            "total_skills_found": len(aggregated_skills),
        },
    )


@router.post("/extract-skills", response_model=AdminBulkSkillExtractionResponse)
async def extract_skills_single_file(
    file: UploadFile = File(..., description="Upload a single document (JD, CV, Requirements, etc.)"),
    doc_type: str = Query("jd", description="Document type"),
    use_llm: bool = Query(False, description="Use LLM-based extraction and categorization (agentic AI)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AdminBulkSkillExtractionResponse:
    """Admin endpoint to extract skills from a single document."""
    validate_file(file)
    validate_doc_type(doc_type)
    
    file_bytes = await read_and_validate_file(file)
    
    try:
        extracted_text = extract_text(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )
    
    if not extracted_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from the document"
        )
    
    # Extract skills using rule-based method
    extracted_skills_dict = extract_skills_from_text_advanced(extracted_text, file.filename)
    
    # Optionally use LLM for CV documents
    llm_skills = []
    if use_llm and doc_type == "cv":
        llm_skills = await extract_skills_with_llm(extracted_text, doc_type)
    
    # Convert to ExtractedSkill objects
    document_skills = [
        ExtractedSkill(
            skill_name=skill_name,
            proficiency_level=proficiency,
            category=category,
            confidence=confidence,
            frequency=1,
        )
        for skill_name, (proficiency, category, confidence) in extracted_skills_dict.items()
    ]
    
    # Merge LLM and rule-based skills
    if llm_skills:
        merged_by_name = {s.skill_name: s for s in document_skills}
        for s in llm_skills:
            merged_by_name[s.skill_name] = s
        document_skills = list(merged_by_name.values())
    
    skills_by_category, proficiency_distribution = aggregate_skills(
        {s.skill_name: s for s in document_skills}
    )
    
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    
    document_result = DocumentSkillExtractionResponse(
        file_id=file_id,
        original_filename=file.filename,
        document_category=doc_type,
        extracted_skills=document_skills,
        total_skills_found=len(document_skills),
        extraction_preview=extracted_text[:500] if extracted_text else "",
    )
    
    return AdminBulkSkillExtractionResponse(
        success=True,
        message=f"Successfully extracted {len(document_skills)} skills from {file.filename}",
        documents_processed=1,
        total_unique_skills=len(document_skills),
        extracted_skills=document_skills,
        documents=[document_result],
        extraction_summary={
            "skills_by_category": skills_by_category,
            "proficiency_distribution": proficiency_distribution,
            "total_skills_found": len(document_skills),
        },
    )


@router.post("/skill-match", response_model=SkillMatchResponse)
async def skill_match_score(
    jd: UploadFile = File(..., description="Job Description file"),
    cv: UploadFile = File(..., description="Candidate CV file"),
    use_llm: bool = Query(True, description="Use LLM for CV extraction and classification"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SkillMatchResponse:
    """Match skills between JD and CV and compute a simple ATS compatibility score."""
    await check_admin(current_user)
    
    validate_file(jd)
    validate_file(cv)
    
    jd_bytes = await read_and_validate_file(jd)
    cv_bytes = await read_and_validate_file(cv)
    
    try:
        jd_text = extract_text(jd_bytes, jd.filename)
        cv_text = extract_text(cv_bytes, cv.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )
    
    # Extract skills
    jd_skills = extract_skills_from_text_advanced(jd_text or "", jd.filename)
    cv_skills = extract_skills_from_text_advanced(cv_text or "", cv.filename)
    
    # Optionally use LLM for CV
    if use_llm:
        llm_skills = await extract_skills_with_llm(cv_text, "cv")
        for skill in llm_skills:
            cv_skills[skill.skill_name] = (
                skill.proficiency_level,
                skill.category,
                skill.confidence
            )
    
    # Classify documents
    jd_class = await classify_document(jd_text or "", use_llm)
    cv_class = await classify_document(cv_text or "", use_llm)
    
    classification_details = {"jd": jd_class, "cv": cv_class}
    
    # Validate document pair
    warning = validate_document_pair(jd_class, cv_class, jd_text, cv_text)
    if warning:
        return SkillMatchResponse(
            success=False,
            match_score=0.0,
            matched_skills=[],
            missing_skills=[],
            extra_skills=[],
            details={
                "warning": warning,
                "classification": classification_details
            }
        )
    
    # Calculate match score
    score, matched_skills_list, missing, extra = calculate_match_score(jd_skills, cv_skills)
    
    response = SkillMatchResponse(
        success=True,
        match_score=score,
        matched_skills=matched_skills_list,
        missing_skills=missing,
        extra_skills=extra,
        details={
            "jd_total_skills": len(jd_skills),
            "cv_total_skills": len(cv_skills),
            "matched": len(matched_skills_list),
            "classification": classification_details
        }
    )
    
    # Save to database
    try:
        jd_file_id, jd_s3_key = await upload_document_to_s3(
            jd_bytes, jd.filename, "jd", current_user.id, jd.content_type
        )
        jd_doc = await save_document_to_db(
            db, jd_file_id, current_user.id, jd.filename, "jd",
            jd_s3_key, jd_bytes, jd.content_type, jd_text
        )
        
        cv_file_id, cv_s3_key = await upload_document_to_s3(
            cv_bytes, cv.filename, "cv", current_user.id, cv.content_type
        )
        cv_doc = await save_document_to_db(
            db, cv_file_id, current_user.id, cv.filename, "cv",
            cv_s3_key, cv_bytes, cv.content_type, cv_text
        )
        
        from config import get_settings
        settings = get_settings()
        provider = settings.LLM_PROVIDER if use_llm else None
        
        await save_skill_match(
            db, current_user.id, jd_doc.id, cv_doc.id,
            response, use_llm, provider
        )
    except Exception as e:
        print(f"Failed to persist skill match record: {e}")
    
    return response


@router.post("/transform-cv", response_model=TransformCVResponse)
async def transform_cv_for_jd(
    cv_file: UploadFile = File(..., description="Upload the candidate CV"),
    jd_file: UploadFile = File(..., description="Upload the job description (JD)"),
    use_llm: bool = Query(False, description="Use LLM to assist extraction and transformation"),
    current_user: User = Depends(get_current_user),
) -> TransformCVResponse:
    """Transform a candidate CV to match the JD requirements and redact PII."""
    validate_file(cv_file)
    validate_file(jd_file)
    
    cv_bytes = await read_and_validate_file(cv_file)
    jd_bytes = await read_and_validate_file(jd_file)
    
    try:
        cv_text = extract_text(cv_bytes, cv_file.filename)
        jd_text = extract_text(jd_bytes, jd_file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {e}"
        )
    
    if not cv_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from CV"
        )
    if not jd_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from JD"
        )
    
    # Extract skills from JD
    jd_skills_dict = extract_skills_from_text_advanced(jd_text, jd_file.filename)
    jd_skills = list(jd_skills_dict.keys())
    
    # Redact PII from CV
    redacted_cv, counts = redact_pii(cv_text)
    
    # Filter CV by JD skills
    filtered_text = filter_cv_by_skills(redacted_cv, jd_skills)
    
    return TransformCVResponse(
        success=True,
        message="Transformed CV generated",
        transformed_text=redacted_cv,
        filtered_text=filtered_text or None,
        redaction_counts=counts,
        extracted_skills=jd_skills,
    )


@router.get("/skill-matches", response_model=List[SkillMatchRecord])
async def list_skill_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[SkillMatchRecord]:
    """List SkillMatch records for the current admin user with pagination."""
    await check_admin(current_user)
    
    result = await db.execute(
        select(SkillMatch)
        .where(SkillMatch.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(SkillMatch.created_at.desc())
    )
    rows = result.scalars().all()
    
    records = []
    for r in rows:
        matched_skills = [
            MatchedSkill(
                skill_name=ms.get("skill_name"),
                jd_proficiency=ms.get("jd_proficiency"),
                cv_proficiency=ms.get("cv_proficiency"),
                confidence=float(ms.get("confidence", 0.0))
            )
            for ms in (r.matched_skills or [])
        ]
        
        records.append(SkillMatchRecord(
            id=r.id,
            match_id=r.match_id,
            user_id=r.user_id,
            jd_file_id=r.jd_file_id,
            cv_file_id=r.cv_file_id,
            match_score=float(r.match_score),
            matched_skills=matched_skills,
            missing_skills=r.missing_skills or [],
            extra_skills=r.extra_skills or [],
            summary=r.summary or {},
            llm_used=bool(r.llm_used),
            provider=r.provider,
            created_at=r.created_at,
        ))
    
    return records


@router.get("/skill-matches/{match_id}", response_model=SkillMatchRecord)
async def get_skill_match_detail(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SkillMatchRecord:
    """Retrieve details for a specific skill match performed by the current admin."""
    await check_admin(current_user)
    
    result = await db.execute(
        select(SkillMatch).where(
            SkillMatch.match_id == match_id,
            SkillMatch.user_id == current_user.id
        )
    )
    rec = result.scalar_one_or_none()
    
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SkillMatch record not found"
        )
    
    matched_skills = [
        MatchedSkill(
            skill_name=ms.get("skill_name"),
            jd_proficiency=ms.get("jd_proficiency"),
            cv_proficiency=ms.get("cv_proficiency"),
            confidence=float(ms.get("confidence", 0.0))
        )
        for ms in (rec.matched_skills or [])
    ]
    
    return SkillMatchRecord(
        id=rec.id,
        match_id=rec.match_id,
        user_id=rec.user_id,
        jd_file_id=rec.jd_file_id,
        cv_file_id=rec.cv_file_id,
        match_score=float(rec.match_score),
        matched_skills=matched_skills,
        missing_skills=rec.missing_skills or [],
        extra_skills=rec.extra_skills or [],
        summary=rec.summary or {},
        llm_used=bool(rec.llm_used),
        provider=rec.provider,
        created_at=rec.created_at,
    )


@router.post("/parse-cv-sections")
async def parse_cv_sections(
    payload: Dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Parse CV into structured sections for editing."""
    await check_admin(current_user)
    
    cv_text = payload.get('cv_text')
    
    if not cv_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CV text is required"
        )
    
    try:
        parser = CVParser(cv_text)
        sections = parser.parse()
        summary = parser.get_summary()
        
        return {
            "success": True,
            "message": "CV parsed successfully",
            "sections": summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse CV: {str(e)}"
        )


@router.post("/rebuild-cv")
async def rebuild_cv(
    payload: Dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Rebuild CV with selected sections and items."""
    await check_admin(current_user)
    
    cv_text = payload.get('cv_text')
    sections_config = payload.get('sections_config')
    
    if not cv_text or not sections_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CV text and sections_config are required"
        )
    
    try:
        parser = CVParser(cv_text)
        parser.parse()
        rebuilt_cv = parser.rebuild_cv(sections_config)
        
        return {
            "success": True,
            "message": "CV rebuilt successfully",
            "rebuilt_cv": rebuilt_cv
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild CV: {str(e)}"
        )


@router.post("/format-cv-docx")
async def format_cv_to_docx(
    payload: Dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Format CV as editable DOCX (Microsoft Word) document."""
    await check_admin(current_user)
    
    cv_text = payload.get('cv_text')
    cv_data = payload.get('cv_data')
    
    if not cv_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CV text is required"
        )
    
    try:
        # Create formatted CV
        formatter = CVFormatter()
        
        # Build CV data structure
        formatted_data = cv_data or {
            'name': 'Formatted CV',
            'email': '',
            'summary': cv_text[:500] if cv_text else '',
        }
        
        # Create document
        doc = formatter.create_cv(formatted_data)
        
        # Save to BytesIO
        byte_stream = BytesIO()
        doc.save(byte_stream)
        byte_stream.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"CV_Formatted_{timestamp}.docx"
        
        return StreamingResponse(
            iter([byte_stream.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to format CV as DOCX: {str(e)}"
        )


@router.post("/format-cv-professional")
async def format_cv_professionally(
    payload: Dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Format CV professionally with parsed sections and return DOCX."""
    await check_admin(current_user)
    
    cv_text = payload.get('cv_text')
    sections_config = payload.get('sections_config')
    
    if not cv_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CV text is required"
        )
    
    try:
        # Parse CV sections
        parser = CVParser(cv_text)
        parser.parse()
        sections_summary = parser.get_summary()
        
        # Format as professional DOCX
        formatter = CVFormatter()
        
        # Build structured data from parsed sections
        cv_data = {
            'name': 'Professional CV',
            'email': '',
            'phone': '',
            'location': '',
            'summary': cv_text[:300] if cv_text else '',
            'experience': [],
            'education': [],
            'skills': [],
            'certifications': [],
            'projects': [],
        }
        
        # Populate from sections
        if 'experience' in sections_summary:
            for item in sections_summary['experience'].get('items', []):
                cv_data['experience'].append({
                    'company': item.get('label', ''),
                    'role': item.get('role', ''),
                    'dates': item.get('dates', ''),
                    'description': ''
                })
        
        if 'education' in sections_summary:
            for item in sections_summary['education'].get('items', []):
                cv_data['education'].append({
                    'degree': item.get('label', ''),
                    'institution': '',
                    'year': ''
                })
        
        if 'skills' in sections_summary:
            cv_data['skills'] = [
                item.get('label', '') 
                for item in sections_summary['skills'].get('items', [])
            ]
        
        if 'certifications' in sections_summary:
            cv_data['certifications'] = [
                item.get('label', '') 
                for item in sections_summary['certifications'].get('items', [])
            ]
        
        if 'projects' in sections_summary:
            for item in sections_summary['projects'].get('items', []):
                cv_data['projects'].append({
                    'project': item.get('label', ''),
                    'description': ''
                })
        
        # Create document
        doc = formatter.create_cv(cv_data)
        
        # Save to BytesIO
        byte_stream = BytesIO()
        doc.save(byte_stream)
        byte_stream.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"CV_Professional_{timestamp}.docx"
        
        return StreamingResponse(
            iter([byte_stream.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to format CV professionally: {str(e)}"
        )

