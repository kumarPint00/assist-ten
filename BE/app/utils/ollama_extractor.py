"""
Ollama-based CV and JD extraction (COMPLETELY FREE, local models).
No API keys needed, runs entirely on your machine.
"""

import httpx
import json
import logging
from typing import Dict, Any, Optional
import re

logger = logging.getLogger(__name__)


class OllamaExtractor:
    """
    Extract CV and JD data using Ollama (free local LLM models).

    Setup:
    1. Install Ollama: https://ollama.ai
    2. Download models: ollama pull mistral (or llama2, neural-chat)
    3. Start server: ollama serve (runs on localhost:11434)

    Models available:
    - mistral (fast, 7B params) - Recommended
    - llama2 (13B, very capable)
    - neural-chat (balanced)
    - orca-mini (smallest, 3B)
    """

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "mistral"):
        """
        Initialize Ollama extractor

        Args:
            base_url: Ollama server URL (default: http://localhost:11434)
            model: Model name (mistral, llama2, neural-chat, etc.)
        """
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.timeout = 60  # Ollama can be slower than API providers

    async def extract_cv_data(self, cv_text: str) -> Dict[str, Any]:
        """Extract CV data using Ollama"""
        try:
            prompt = self._get_cv_prompt(cv_text[:3000])  # Limit text length

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.3,
                        "num_predict": 1500  # Limit response length
                    }
                )

            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code}")
                return self._empty_cv_response()

            result = response.json()
            content = result.get("response", "")

            # Parse JSON from response
            try:
                extracted = json.loads(content)
                extracted["extraction_confidence"] = 0.82
                extracted["provider"] = f"ollama-{self.model}"
                return extracted
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from Ollama, using regex fallback")
                return self._regex_cv_extract(cv_text)

        except Exception as e:
            logger.error(f"Ollama CV extraction error: {e}")
            return self._regex_cv_extract(cv_text)

    async def extract_jd_data(self, jd_text: str) -> Dict[str, Any]:
        """Extract JD data using Ollama"""
        try:
            prompt = self._get_jd_prompt(jd_text[:3000])

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.3,
                        "num_predict": 1500
                    }
                )

            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code}")
                return self._empty_jd_response()

            result = response.json()
            content = result.get("response", "")

            try:
                extracted = json.loads(content)
                extracted["extraction_confidence"] = 0.80
                extracted["provider"] = f"ollama-{self.model}"
                return extracted
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from Ollama, using regex fallback")
                return self._regex_jd_extract(jd_text)

        except Exception as e:
            logger.error(f"Ollama JD extraction error: {e}")
            return self._regex_jd_extract(jd_text)

    def _get_cv_prompt(self, cv_text: str) -> str:
        """Get CV extraction prompt for Ollama"""
        return f"""You are an expert resume analyzer. Extract structured data from this CV and return ONLY valid JSON:

{{
  "candidate_name": "full name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "city, state",
  "total_experience_years": "X",
  "current_role": "job title",
  "current_company": "company name",
  "education": {{"degree": "BS", "field": "Computer Science", "institution": "MIT"}},
  "primary_skills": ["Python", "JavaScript"],
  "secondary_skills": ["Docker", "AWS"],
  "technical_skills": ["System Design"],
  "soft_skills": ["Leadership"],
  "certifications": ["AWS Solutions Architect"],
  "achievements": ["Led team of 5"],
  "extraction_confidence": 0.9
}}

CV Text:
{cv_text}

Return ONLY the JSON object, no other text."""

    def _get_jd_prompt(self, jd_text: str) -> str:
        """Get JD extraction prompt for Ollama"""
        return f"""You are an expert job description analyzer. Extract structured data from this JD and return ONLY valid JSON:

{{
  "job_title": "Senior Engineer",
  "company": "TechCorp",
  "location": "San Francisco",
  "job_type": "Full-time",
  "seniority_level": "Senior",
  "min_experience_years": "5",
  "max_experience_years": "10",
  "salary_range": {{"min": "150000", "max": "200000"}},
  "must_have_skills": ["Python", "AWS"],
  "nice_to_have_skills": ["Go", "Kubernetes"],
  "technical_requirements": ["System Design"],
  "soft_skills_required": ["Communication"],
  "extraction_confidence": 0.9
}}

Job Description:
{jd_text}

Return ONLY the JSON object, no other text."""

    def _regex_cv_extract(self, text: str) -> Dict[str, Any]:
        """Regex fallback for CV extraction"""
        data = {
            "candidate_name": self._extract_pattern(text, r'(?:name|contact)[:\s]+([A-Za-z\s]+)', 0) or "",
            "email": self._extract_pattern(text, r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', 0) or "",
            "phone": self._extract_pattern(text, r'(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})', 0) or "",
            "location": self._extract_pattern(text, r'(?:location|city)[:\s]+([A-Za-z\s,]+)', 0) or "",
            "total_experience_years": self._extract_pattern(text, r'(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?experience', 0) or "0",
            "current_role": self._extract_pattern(text, r'(?:current\s+)?(?:role|position|title)[:\s]+([A-Za-z\s]+)', 0) or "",
            "current_company": self._extract_pattern(text, r'(?:at|company)[:\s]+([A-Za-z\s&.,]+)', 0) or "",
            "primary_skills": re.findall(r'\b(?:Python|Java|JavaScript|C\+\+|Go|Rust|SQL|AWS|Azure|Docker|Kubernetes|React|Node|js|TypeScript)\b', text),
            "secondary_skills": [],
            "technical_skills": [],
            "soft_skills": [],
            "certifications": [],
            "achievements": [],
            "education": {"degree": "", "field": "", "institution": ""},
            "extraction_confidence": 0.65,
            "provider": "ollama-regex-fallback"
        }
        return data

    def _regex_jd_extract(self, text: str) -> Dict[str, Any]:
        """Regex fallback for JD extraction"""
        data = {
            "job_title": self._extract_pattern(text, r'(?:job\s+)?title[:\s]+([A-Za-z\s]+)', 0) or "",
            "company": self._extract_pattern(text, r'company[:\s]+([A-Za-z\s&.,]+)', 0) or "",
            "location": self._extract_pattern(text, r'location[:\s]+([A-Za-z\s,]+)', 0) or "",
            "job_type": self._extract_pattern(text, r'(?:type|employment)[:\s]+([\w\s]+)', 0) or "Full-time",
            "seniority_level": self._extract_pattern(text, r'(?:level|seniority)[:\s]+([\w\s]+)', 0) or "",
            "min_experience_years": self._extract_pattern(text, r'(\d+)(?:\s*-\s*\d+)?\s+years?', 0) or "0",
            "max_experience_years": "",
            "salary_range": {"min": "", "max": ""},
            "must_have_skills": re.findall(r'\b(?:Python|Java|AWS|Docker|Kubernetes|React|Node|js|TypeScript)\b', text),
            "nice_to_have_skills": [],
            "technical_requirements": [],
            "soft_skills_required": [],
            "extraction_confidence": 0.60,
            "provider": "ollama-regex-fallback"
        }
        return data

    def _extract_pattern(self, text: str, pattern: str, group: int = 0) -> Optional[str]:
        """Helper to extract pattern from text"""
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(group).strip() if match else None

    def _empty_cv_response(self) -> Dict[str, Any]:
        """Return empty CV response"""
        return {
            "candidate_name": "",
            "email": "",
            "phone": "",
            "location": "",
            "total_experience_years": "",
            "current_role": "",
            "current_company": "",
            "education": {"degree": "", "field": "", "institution": ""},
            "primary_skills": [],
            "secondary_skills": [],
            "technical_skills": [],
            "soft_skills": [],
            "certifications": [],
            "achievements": [],
            "extraction_confidence": 0.0,
            "provider": f"ollama-{self.model}"
        }

    def _empty_jd_response(self) -> Dict[str, Any]:
        """Return empty JD response"""
        return {
            "job_title": "",
            "company": "",
            "location": "",
            "job_type": "",
            "seniority_level": "",
            "min_experience_years": "",
            "max_experience_years": "",
            "salary_range": {"min": "", "max": ""},
            "must_have_skills": [],
            "nice_to_have_skills": [],
            "technical_requirements": [],
            "soft_skills_required": [],
            "extraction_confidence": 0.0,
            "provider": f"ollama-{self.model}"
        }