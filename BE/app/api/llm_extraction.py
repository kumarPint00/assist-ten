"""
LLM-based CV and JD extraction API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.core.dependencies import get_db, optional_user
from app.db.models import User, ExtractionLog
from app.utils.llm_cv_extractor import LLMCVExtractor
from app.utils.ollama_extractor import OllamaExtractor
from app.core.logging import get_logger
from config import get_settings

logger = get_logger(__name__)

# Initialize LLM extractor from settings
settings = get_settings()
llm_provider = settings.LLM_PROVIDER
llm_api_key = settings.LLM_API_KEY
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
ollama_model = os.getenv("OLLAMA_MODEL", "mistral")

if not llm_api_key and llm_provider in ["openai", "anthropic", "groq"]:
    logger.warning(f"{llm_provider.upper()}_API_KEY not configured. LLM extraction will not work.")

def get_extractor(provider: str = None):
    """Factory function to get appropriate extractor based on provider"""
    provider = provider or llm_provider
    
    if provider.lower() == "ollama":
        return OllamaExtractor(base_url=ollama_base_url, model=ollama_model)
    else:
        # Use LLMCVExtractor for OpenAI, Claude, Groq
        api_key = llm_api_key
        if provider.lower() == "groq":
            api_key = os.getenv("GROQ_API_KEY", llm_api_key)
        return LLMCVExtractor(api_key=api_key, provider=provider)

# Request/Response schemas
class CVExtractionRequest(BaseModel):
    """Request to extract CV data with LLM"""
    cv_text: str = Field(..., description="Raw CV text to extract")
    user_id: Optional[str] = None

class JDExtractionRequest(BaseModel):
    """Request to extract JD data with LLM"""
    jd_text: str = Field(..., description="Raw JD text to extract")
    user_id: Optional[str] = None

class CVExtractionResponse(BaseModel):
    """Response with extracted CV data"""
    candidate_name: str
    email: str
    phone: str
    location: str
    total_experience_years: str
    current_role: str
    current_company: str
    education: Dict[str, str]
    primary_skills: List[str]
    secondary_skills: List[str]
    technical_skills: List[str]
    soft_skills: List[str]
    projects: List[Dict[str, Any]]
    work_experience: List[Dict[str, Any]]
    certifications: List[str]
    achievements: List[str]
    domains_worked_in: List[str]
    github_url: str
    linkedin_url: str
    portfolio_url: str
    potential_red_flags: List[str]
    extraction_confidence: float

class JDExtractionResponse(BaseModel):
    """Response with extracted JD data"""
    job_title: str
    company: str
    location: str
    job_type: str
    seniority_level: str
    min_experience_years: str
    max_experience_years: str
    salary_range: Dict[str, str]
    must_have_skills: List[str]
    nice_to_have_skills: List[str]
    technical_requirements: List[str]
    soft_skills_required: List[str]
    responsibilities: List[str]
    benefits: List[str]
    education_required: str
    certifications_required: List[str]
    domains: List[str]
    industries: List[str]

router = APIRouter(prefix="/api/v1/extract", tags=["extraction"])

@router.post("/cv-with-llm", response_model=CVExtractionResponse)
async def extract_cv_with_llm(
    request: CVExtractionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_user),
) -> Dict[str, Any]:
    """
    Extract structured CV data using LLM (Claude/GPT-4)
    
    This endpoint uses a language model to extract structured data from CV text.
    More accurate than regex-based extraction for complex CVs.
    
    Returns:
    - Candidate information (name, email, phone, location)
    - Education details
    - Work experience and projects
    - Skills (primary, secondary, technical, soft)
    - Certifications and achievements
    - Profile URLs (LinkedIn, GitHub, Portfolio)
    - Potential red flags
    - Extraction confidence score
    """
    try:
        if not llm_api_key:
            logger.error("LLM API key not configured")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM extraction service not configured"
            )
        
        if len(request.cv_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CV text too short for extraction"
            )
        
        logger.info(f"[LLM Extraction] Starting CV extraction ({len(request.cv_text)} chars)")
        
        # Extract with LLM
        extractor = get_extractor()
        extracted_data = await extractor.extract_cv_data(request.cv_text)
        
        if not extracted_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Failed to extract CV data"
            )
        
        logger.info(f"[LLM Extraction] Successfully extracted CV data")
        
        # Log extraction (optional)
        try:
            extraction_log = ExtractionLog(
                user_id=request.user_id or current_user.user_id if current_user else None,
                extraction_type="cv_llm",
                input_length=len(request.cv_text),
                output_data=extracted_data,
                confidence_score=extracted_data.get("extraction_confidence", 0),
                status="success"
            )
            db.add(extraction_log)
            await db.commit()
        except Exception as log_error:
            logger.warning(f"Failed to log extraction: {log_error}")
        
        return extracted_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CV extraction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CV extraction failed: {str(e)}"
        )

@router.post("/jd-with-llm", response_model=JDExtractionResponse)
async def extract_jd_with_llm(
    request: JDExtractionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_user),
) -> Dict[str, Any]:
    """
    Extract structured JD data using LLM (Claude/GPT-4)
    
    This endpoint uses a language model to extract structured requirements from JD text.
    Accurately identifies must-have vs nice-to-have skills.
    
    Returns:
    - Job details (title, company, location, type)
    - Seniority level and experience requirements
    - Skill requirements (must-have and nice-to-have)
    - Responsibilities and key metrics
    - Benefits and growth opportunities
    - Education and certification requirements
    - Salary range (if available)
    """
    try:
        if not llm_api_key:
            logger.error("LLM API key not configured")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM extraction service not configured"
            )
        
        if len(request.jd_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JD text too short for extraction"
            )
        
        logger.info(f"[LLM Extraction] Starting JD extraction ({len(request.jd_text)} chars)")
        
        # Extract with LLM
        extractor = get_extractor()
        extracted_data = await extractor.extract_jd_data(request.jd_text)
        
        if not extracted_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Failed to extract JD data"
            )
        
        logger.info(f"[LLM Extraction] Successfully extracted JD data")
        
        # Log extraction (optional)
        try:
            extraction_log = ExtractionLog(
                user_id=request.user_id or current_user.user_id if current_user else None,
                extraction_type="jd_llm",
                input_length=len(request.jd_text),
                output_data=extracted_data,
                confidence_score=1.0,
                status="success"
            )
            db.add(extraction_log)
            await db.commit()
        except Exception as log_error:
            logger.warning(f"Failed to log extraction: {log_error}")
        
        return extracted_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JD extraction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"JD extraction failed: {str(e)}"
        )

@router.post("/compare-cv-jd")
async def compare_cv_with_jd(
    cv_data: Dict[str, Any],
    jd_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_user),
) -> Dict[str, Any]:
    """
    Compare extracted CV data with JD requirements
    
    Returns:
    - Matching scores
    - Missing skills
    - Experience gap analysis
    - Suitability score
    """
    try:
        cv_skills = (
            cv_data.get("primary_skills", []) +
            cv_data.get("secondary_skills", []) +
            cv_data.get("technical_skills", [])
        )
        
        jd_must_have = jd_data.get("must_have_skills", [])
        jd_nice_to_have = jd_data.get("nice_to_have_skills", [])
        
        # Find matching skills
        must_have_matches = [
            skill for skill in jd_must_have
            if any(cv_skill.lower() in skill.lower() or skill.lower() in cv_skill.lower()
                   for cv_skill in cv_skills)
        ]
        
        nice_to_have_matches = [
            skill for skill in jd_nice_to_have
            if any(cv_skill.lower() in skill.lower() or skill.lower() in cv_skill.lower()
                   for cv_skill in cv_skills)
        ]
        
        must_have_percentage = (
            (len(must_have_matches) / len(jd_must_have) * 100)
            if jd_must_have else 0
        )
        
        nice_to_have_percentage = (
            (len(nice_to_have_matches) / len(jd_nice_to_have) * 100)
            if jd_nice_to_have else 0
        )
        
        # Experience match
        cv_exp = int(cv_data.get("total_experience_years", "0")) if cv_data.get("total_experience_years") else 0
        jd_min_exp = int(jd_data.get("min_experience_years", "0")) if jd_data.get("min_experience_years") else 0
        experience_match = cv_exp >= jd_min_exp
        
        return {
            "candidate_name": cv_data.get("candidate_name"),
            "job_title": jd_data.get("job_title"),
            "skill_match": {
                "must_have_matches": must_have_matches,
                "must_have_percentage": must_have_percentage,
                "nice_to_have_matches": nice_to_have_matches,
                "nice_to_have_percentage": nice_to_have_percentage,
                "missing_must_have": [s for s in jd_must_have if s not in must_have_matches]
            },
            "experience_match": {
                "candidate_experience": f"{cv_exp} years",
                "required_experience": f"{jd_min_exp} years",
                "match": experience_match
            },
            "overall_suitability_score": (
                (must_have_percentage * 0.6 + nice_to_have_percentage * 0.2 + (100 if experience_match else 0) * 0.2) / 100 * 100
            )
        }
        
    except Exception as e:
        logger.error(f"Comparison error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(e)}"
        )
