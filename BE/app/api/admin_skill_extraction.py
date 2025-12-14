"""Admin endpoints for bulk skill extraction from documents."""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from typing import List, Dict, Optional
import uuid
import re

from app.core.dependencies import get_db, get_current_user
from app.core.storage import get_s3_service
from app.utils.text_extract import extract_text
from app.db.models import User, UploadedDocument
from app.db.models import SkillMatch
from app.models.schemas import (
    AdminBulkSkillExtractionResponse,
    DocumentSkillExtractionResponse,
    ExtractedSkill,
    SkillMatchResponse,
    MatchedSkill,
    SkillMatchRecord,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin-skill-extraction"])

# Allowed extensions
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
ALLOWED_DOC_TYPES = {"jd", "cv", "portfolio", "requirements", "specifications"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def allowed_file(filename: str) -> bool:
    """Check if file has allowed extension."""
    ext = filename.split(".")[-1].lower()
    return ext in ALLOWED_EXTENSIONS


def extract_skills_from_text_advanced(text: str, filename: str = "") -> Dict[str, tuple]:
    """
    Extract skills from text with proficiency levels and categories.
    
    Returns:
        Dict[skill_name] = (proficiency_level, category, confidence)
    """
    if not text:
        return {}
    
    text_lower = text.lower()
    extracted_skills = {}
    
    # Comprehensive technical skills dictionary
    technical_skills = {
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
    
    # Soft skills
    soft_skills = {
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
    
    # Language skills
    language_skills = {
        "english": ("advanced", "language", 0.95),
        "spanish": ("intermediate", "language", 0.90),
        "german": ("intermediate", "language", 0.90),
        "french": ("intermediate", "language", 0.90),
        "mandarin": ("intermediate", "language", 0.90),
        "hindi": ("intermediate", "language", 0.90),
    }
    
    for skill, (proficiency, category, confidence) in technical_skills.items():
        patterns = [
            rf'\b{re.escape(skill)}\b',  # Whole word match
            rf'\b{re.escape(skill)}\s+',  # Word followed by space
        ]
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                extracted_skills[skill.title()] = (proficiency, category, confidence)
                break
    
    for skill, (proficiency, category, confidence) in soft_skills.items():
        if re.search(rf'\b{re.escape(skill)}\b', text_lower, re.IGNORECASE):
            extracted_skills[skill.title()] = (proficiency, category, confidence)
    
    for skill, (proficiency, category, confidence) in language_skills.items():
        if re.search(rf'\b{re.escape(skill)}\b', text_lower, re.IGNORECASE):
            extracted_skills[skill.title()] = (proficiency, category, confidence)
    
    return extracted_skills


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
    
    Parameters:
    - files: List of documents to extract from
    - doc_type: Document type (jd, cv, portfolio, requirements, specifications)
    
    Returns:
    - Aggregated unique skills across all documents with proficiency levels
    - Per-document skill extraction results
    - Extraction summary with statistics
    
    Example:
        POST /api/v1/admin/extract-skills-bulk
        Form Data:
        - files: [jd.pdf, requirements.pdf]
        - doc_type: jd
        
        Response:
        {
            "success": true,
            "documents_processed": 2,
            "total_unique_skills": 15,
            "extracted_skills": [
                {
                    "skill_name": "Python",
                    "proficiency_level": "advanced",
                    "category": "technical",
                    "frequency": 2,
                    "confidence": 0.95
                },
                ...
            ],
            "extraction_summary": {
                "skills_by_category": {
                    "technical": 12,
                    "soft": 3
                },
                "proficiency_distribution": {
                    "advanced": 8,
                    "intermediate": 7
                }
            }
        }
    """
    # Verify admin role
    # if current_user.role != "admin":
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Only admin users can extract skills from documents"
    #     )
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file must be uploaded"
        )
    
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid doc_type. Must be one of: {', '.join(ALLOWED_DOC_TYPES)}"
        )
    
    s3_service = get_s3_service()
    document_results = []
    all_extracted_skills = {}  # Aggregate skills across documents
    skills_by_category = {}
    proficiency_distribution = {}
    
    for file in files:
        if not file.filename or not allowed_file(file.filename):
            continue
        
        file_bytes = await file.read()
        
        if len(file_bytes) > MAX_FILE_SIZE:
            continue
        
        extracted_text = None
        try:
            extracted_text = extract_text(file_bytes, file.filename)
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
            
            skills_by_category[category] = skills_by_category.get(category, 0) + 1
            proficiency_distribution[proficiency] = proficiency_distribution.get(proficiency, 0) + 1
        
        try:
            file_id = f"file_{uuid.uuid4().hex[:12]}"
            timestamp = datetime.utcnow().isoformat()
            s3_key = f"documents/{doc_type}/admin/{timestamp}/{file_id}/{file.filename}"
            
            await s3_service.upload_file(
                file_obj=file_bytes,
                object_name=s3_key,
                content_type=file.content_type or "application/octet-stream",
                metadata={
                    "file_id": file_id,
                    "doc_type": doc_type,
                    "original_filename": file.filename,
                    "uploaded_by": str(current_user.id),
                }
            )
            
            document = UploadedDocument(
                file_id=file_id,
                user_id=current_user.id,
                original_filename=file.filename,
                file_type=file.filename.split(".")[-1].lower(),
                document_category=doc_type,
                s3_key=s3_key,
                file_size=len(file_bytes),
                mime_type=file.content_type or "application/octet-stream",
                extracted_text=extracted_text,
                extraction_preview=extracted_text[:500] if extracted_text else None,
                is_encrypted=True,
                encryption_method="AES-256-GCM",
            )
            db.add(document)
            
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
    
    # Prepare response
    aggregated_skills = list(all_extracted_skills.values())
    
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
    """
    Admin endpoint to extract skills from a single document.
    
    This is a lightweight endpoint that extracts skills without requiring S3 storage.
    For development, it skips S3 upload and database storage.
    
    Parameters:
    - file: Document to extract from
    - doc_type: Document type (jd, cv, portfolio, requirements, specifications)
    
    Returns:
    - Extracted skills with proficiency levels and categories
    - Document metadata and extraction details
    """
    # Validate file
    if not file.filename or not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate doc_type
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid doc_type. Must be one of: {', '.join(ALLOWED_DOC_TYPES)}"
        )
    
    # Read file
    file_bytes = await file.read()
    
    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Extract text from document
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
    
    # Extract skills from text
    extracted_skills_dict = extract_skills_from_text_advanced(extracted_text, file.filename)

    # If requested and we have a CV, use LLMCVExtractor to extract and classify skills
    llm_skill_objects = []
    if use_llm and doc_type == "cv":
        try:
            from app.utils.llm_cv_extractor import LLMCVExtractor
            from config import get_settings
            settings = get_settings()
            provider = settings.LLM_PROVIDER
            api_key = settings.LLM_API_KEY or settings.GROQ_API_KEY
            extractor = LLMCVExtractor(api_key=api_key, provider=provider)
            llm_result = await extractor.extract_cv_data(extracted_text)
            classified = llm_result.get("classified_skills", [])
            for cls in classified:
                name = cls.get("skill_name")
                cat = cls.get("category")
                conf = cls.get("confidence", 0.0)
                if not name:
                    continue
                # Map category to proficiency level
                prof_map = {"strong": "advanced", "intermediate": "intermediate", "basic": "beginner"}
                proficiency = prof_map.get(cat, "intermediate")
                skill_obj = ExtractedSkill(
                    skill_name=name,
                    proficiency_level=proficiency,
                    category="technical" if prof_map.get(cat) in ["advanced", "intermediate"] else "soft",
                    confidence=float(conf) if conf else 0.0,
                    frequency=1
                )
                llm_skill_objects.append(skill_obj)
        except Exception as e:
            # Don't block original regex extraction on LLM failure
            print(f"LLM skill extraction failed: {e}")
    
    # Convert to ExtractedSkill objects
    document_skills = []
    skills_by_category = {}
    proficiency_distribution = {}
    
    for skill_name, (proficiency, category, confidence) in extracted_skills_dict.items():
        skill_obj = ExtractedSkill(
            skill_name=skill_name,
            proficiency_level=proficiency,
            category=category,
            confidence=confidence,
            frequency=1,
        )
        document_skills.append(skill_obj)
        
        # Track statistics
        skills_by_category[category] = skills_by_category.get(category, 0) + 1
        proficiency_distribution[proficiency] = proficiency_distribution.get(proficiency, 0) + 1
    
    # Generate a file ID for reference (without S3 storage)
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    
    # Create document result
    # If LLM produced skills, prefer those and combine
    if llm_skill_objects:
        # Merge LLM and rule-based skills, preferring LLM for proficiency
        merged_by_name = {s.skill_name: s for s in document_skills}
        for s in llm_skill_objects:
            merged_by_name[s.skill_name] = s
        document_skills = list(merged_by_name.values())

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
    """Match skills between JD and CV and compute a simple ATS compatibility score.

    - Extracts skills from both JD and CV files
    - Optionally uses LLM for CV extraction/classification
    - Computes a matching score based on overlap and proficiency
    """
    from app.models.schemas import SkillMatchResponse, MatchedSkill
    from app.utils.llm_cv_extractor import LLMCVExtractor
    from config import get_settings

    # Verify admin access
    from app.core.security import check_admin
    await check_admin(current_user)

    # Validate inputs
    if not jd.filename or not cv.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Both JD and CV files are required")

    try:
        jd_bytes = await jd.read()
        cv_bytes = await cv.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to read files: {str(e)}")

    try:
        jd_text = extract_text(jd_bytes, jd.filename)
        cv_text = extract_text(cv_bytes, cv.filename)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Text extraction failed: {str(e)}")

    # Extract skills using rule-based extraction for JD and CV
    jd_skills = extract_skills_from_text_advanced(jd_text or "", jd.filename)
    cv_skills = extract_skills_from_text_advanced(cv_text or "", cv.filename)

    # Optionally use LLM to get classified CV skills; prefer LLM results for CV
    if use_llm:
        try:
            settings = get_settings()
            provider = settings.LLM_PROVIDER
            api_key = settings.LLM_API_KEY or settings.GROQ_API_KEY
            extractor = LLMCVExtractor(api_key=api_key, provider=provider)
            # Classify both documents (JD vs CV) to help validation
            try:
                jd_class = await extractor.classify_document(jd_text or "")
            except Exception as e:
                jd_class = {"document_type": "unknown", "confidence": 0.0, "reason": str(e)}
            try:
                cv_class = await extractor.classify_document(cv_text or "")
            except Exception as e:
                cv_class = {"document_type": "unknown", "confidence": 0.0, "reason": str(e)}
            llm_res = await extractor.extract_cv_data(cv_text)
            classified = llm_res.get("classified_skills", [])
            for cls in classified:
                name = cls.get("skill_name")
                cat = cls.get("category")
                conf = float(cls.get("confidence", 0.0) or 0.0)
                # determine proficiency mapping
                prof_map = {"strong": "advanced", "intermediate": "intermediate", "basic": "beginner"}
                proficiency = prof_map.get(cat, "intermediate")
                cv_skills[name] = (proficiency, "technical" if proficiency in ["advanced", "intermediate"] else "soft", conf)
        except Exception as e:
            print(f"LLM skill classification failed: {e}")

    # Prepare warnings from classification
    warnings: List[str] = []
    classification_details = {"jd": jd_class, "cv": cv_class} if use_llm else {}
    if not use_llm:
        # simple heuristic fallback if LLM is disabled
        def guess_doc_type(t: str) -> str:
            txt = (t or "").lower()
            if re.search(r"\b(objective|curriculum vitae|resume|work experience|education|projects|achievements)\b", txt):
                return "cv"
            if re.search(r"\b(responsibilities|we are looking for|job description|we will|required skills|must have)\b", txt):
                return "jd"
            return "unknown"

        jd_doc_type = guess_doc_type(jd_text or "")
        cv_doc_type = guess_doc_type(cv_text or "")
        jd_class = {"document_type": jd_doc_type, "confidence": 0.6, "reason": "heuristic keyword match"}
        cv_class = {"document_type": cv_doc_type, "confidence": 0.6, "reason": "heuristic keyword match"}
        classification_details = {"jd": jd_class, "cv": cv_class}

    # If both texts are identical, warn and return a helpful message
    if (jd_text or "").strip() == (cv_text or "").strip():
        warnings.append("The uploaded JD and CV appear to be identical. Please verify you uploaded the correct JD and CV files.")
        # Return an early response with helpful detail rather than continue matching
        response = SkillMatchResponse(
            success=False,
            match_score=0.0,
            matched_skills=[],
            missing_skills=[],
            extra_skills=[],
            details={
                "warning": "Identical files provided",
                "classification": classification_details
            }
        )
        return response

    # If classification suggests both are CVs or both are JDs with high confidence, warn and stop
    if use_llm and jd_class.get("document_type") == "cv" and cv_class.get("document_type") == "cv" and jd_class.get("confidence", 0) >= 0.75 and cv_class.get("confidence", 0) >= 0.75:
        warnings.append("Both uploaded files look like candidate CVs, not a JD and a CV. Please upload both a JD and a CV.")
        response = SkillMatchResponse(
            success=False,
            match_score=0.0,
            matched_skills=[],
            missing_skills=[],
            extra_skills=[],
            details={
                "warning": "Both files classified as CV",
                "classification": classification_details
            }
        )
        return response

    if use_llm and jd_class.get("document_type") == "jd" and cv_class.get("document_type") == "jd" and jd_class.get("confidence", 0) >= 0.75 and cv_class.get("confidence", 0) >= 0.75:
        warnings.append("Both uploaded files look like Job Descriptions (JDs), not a JD and a CV. Please upload both a JD and a CV.")
        response = SkillMatchResponse(
            success=False,
            match_score=0.0,
            matched_skills=[],
            missing_skills=[],
            extra_skills=[],
            details={
                "warning": "Both files classified as JD",
                "classification": classification_details
            }
        )
        return response

    # Matching logic
    jd_skill_names = set([k for k in jd_skills.keys()])
    cv_skill_names = set([k for k in cv_skills.keys()])
    matched = jd_skill_names.intersection(cv_skill_names)
    missing = jd_skill_names.difference(cv_skill_names)
    extra = cv_skill_names.difference(jd_skill_names)

    # Simple scoring: weighted match / total JD skills
    # map proficiency to weight
    prof_weights = {"beginner": 0.6, "intermediate": 1.0, "advanced": 1.2, "expert": 1.3}
    total_weight = 0.0
    matched_weight = 0.0
    matched_skills_list = []

    for s in jd_skill_names:
        prof_jd = jd_skills.get(s, ("intermediate", "technical", 0.7))[0]
        total_weight += prof_weights.get(prof_jd, 1.0)
    if total_weight == 0: total_weight = 1.0

    for s in matched:
        jd_prof = jd_skills.get(s, ("intermediate", "technical", 0.7))[0]
        cv_prof = cv_skills.get(s, ("intermediate", "technical", 0.7))[0]
        cv_conf = cv_skills.get(s, (jd_prof, "technical", 0.6))[2] or 0.6
        weight = min(prof_weights.get(jd_prof, 1.0), prof_weights.get(cv_prof, 1.0))
        matched_weight += weight * (cv_conf or 0.6)
        matched_skills_list.append(MatchedSkill(skill_name=s, jd_proficiency=jd_prof, cv_proficiency=cv_prof, confidence=cv_conf))

    score = (matched_weight / total_weight) * 100
    if score > 100: score = 100.0

    response = SkillMatchResponse(
        success=True,
        match_score=round(float(score), 2),
        matched_skills=matched_skills_list,
        missing_skills=list(missing),
        extra_skills=list(extra),
        details={
            "jd_total_skills": len(jd_skill_names),
            "cv_total_skills": len(cv_skill_names),
            "matched": len(matched),
        }
    )
    # Attach classification details and warnings if any
    if use_llm:
        response.details["classification"] = classification_details
    if warnings:
        response.details["warnings"] = warnings
    # Persist documents (JD and CV) and the match record for auditing (best-effort)
    try:
        s3_service = get_s3_service()
        # Upload JD file
        jd_file_id_db = None
        if jd.filename:
            file_id = f"file_{uuid.uuid4().hex[:12]}"
            timestamp = datetime.utcnow().isoformat()
            s3_key = f"documents/jd/admin/{timestamp}/{file_id}/{jd.filename}"
            await s3_service.upload_file(file_obj=jd_bytes, object_name=s3_key, content_type=jd.content_type or 'application/octet-stream', metadata={'file_id': file_id})
            jd_doc = UploadedDocument(
                file_id=file_id,
                user_id=current_user.id,
                original_filename=jd.filename,
                file_type=jd.filename.split('.')[-1].lower(),
                document_category='jd',
                s3_key=s3_key,
                file_size=len(jd_bytes),
                mime_type=jd.content_type or 'application/octet-stream',
                extracted_text=jd_text,
                extraction_preview=(jd_text[:500] if jd_text else None),
                is_encrypted=True,
            )
            db.add(jd_doc)
            await db.flush()
            jd_file_id_db = jd_doc.id

        # Upload CV file
        cv_file_id_db = None
        if cv.filename:
            file_id = f"file_{uuid.uuid4().hex[:12]}"
            timestamp = datetime.utcnow().isoformat()
            s3_key = f"documents/cv/admin/{timestamp}/{file_id}/{cv.filename}"
            await s3_service.upload_file(file_obj=cv_bytes, object_name=s3_key, content_type=cv.content_type or 'application/octet-stream', metadata={'file_id': file_id})
            cv_doc = UploadedDocument(
                file_id=file_id,
                user_id=current_user.id,
                original_filename=cv.filename,
                file_type=cv.filename.split('.')[-1].lower(),
                document_category='cv',
                s3_key=s3_key,
                file_size=len(cv_bytes),
                mime_type=cv.content_type or 'application/octet-stream',
                extracted_text=cv_text,
                extraction_preview=(cv_text[:500] if cv_text else None),
                is_encrypted=True,
            )
            db.add(cv_doc)
            await db.flush()
            cv_file_id_db = cv_doc.id

        # Create SkillMatch record
        skill_match = SkillMatch(
            user_id=current_user.id,
            jd_file_id=jd_file_id_db,
            cv_file_id=cv_file_id_db,
            match_score=float(response.match_score),
            matched_skills=[{'skill_name': s.skill_name,'jd_proficiency': s.jd_proficiency,'cv_proficiency': s.cv_proficiency,'confidence': s.confidence} for s in response.matched_skills],
            missing_skills=response.missing_skills,
            extra_skills=response.extra_skills,
            summary=response.details,
            llm_used=use_llm,
            provider=(provider if use_llm else None),
        )
        db.add(skill_match)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Failed to persist skill match record: {e}")
    return response



@router.get("/skill-matches", response_model=List[SkillMatchRecord])
async def list_skill_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[SkillMatchRecord]:
    """List SkillMatch records for the current admin user with pagination."""
    # Check admin access via role-based check
    from app.core.security import check_admin
    await check_admin(current_user)

    result = await db.execute(select(SkillMatch).where(SkillMatch.user_id == current_user.id).offset(skip).limit(limit).order_by(SkillMatch.created_at.desc()))
    rows = result.scalars().all()
    records: List[SkillMatchRecord] = []
    for r in rows:
        matched_skills = []
        for ms in r.matched_skills or []:
            matched_skills.append(MatchedSkill(skill_name=ms.get("skill_name"), jd_proficiency=ms.get("jd_proficiency"), cv_proficiency=ms.get("cv_proficiency"), confidence=float(ms.get("confidence", 0.0))))
        rec = SkillMatchRecord(
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
        )
        records.append(rec)
    return records



@router.get("/skill-matches/{match_id}", response_model=SkillMatchRecord)
async def get_skill_match_detail(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SkillMatchRecord:
    """Retrieve details for a specific skill match performed by the current admin."""
    # Check admin access via role-based check
    from app.core.security import check_admin
    await check_admin(current_user)

    result = await db.execute(select(SkillMatch).where(SkillMatch.match_id == match_id, SkillMatch.user_id == current_user.id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SkillMatch record not found")

    matched_skills = []
    for ms in rec.matched_skills or []:
        matched_skills.append(MatchedSkill(skill_name=ms.get("skill_name"), jd_proficiency=ms.get("jd_proficiency"), cv_proficiency=ms.get("cv_proficiency"), confidence=float(ms.get("confidence", 0.0))))

    record = SkillMatchRecord(
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
    return record


