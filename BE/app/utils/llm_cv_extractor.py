"""
LLM-based CV Extraction using Claude/GPT/Groq
Extracts structured data from CVs using language models for better accuracy
"""

import json
import logging
from typing import Optional, Dict, Any
import httpx
from langchain_groq import ChatGroq
from app.core.logging import get_logger

logger = get_logger(__name__)

# Prompt template for CV extraction
CV_EXTRACTION_PROMPT = """You are an expert resume analyzer with deep HR and technical expertise.

Your task: Parse the provided CV/Resume and extract structured data in valid JSON format.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no code blocks, no explanations
2. Extract EXACTLY what is present - NO assumptions or inferences
3. If a field is not found in CV, use empty string ("") or empty array ([])
4. Be precise with numbers and dates
5. List primary skills (most mentioned/emphasized) before secondary
6. Assess complexity based on project scale and technology
7. Identify any red flags (gaps, inconsistencies, etc.)

CV TEXT:
{cv_text}

OUTPUT ONLY THIS JSON STRUCTURE (no other text):
{{
  "candidate_name": "",
  "email": "",
  "phone": "",
  "location": "",
  "total_experience_years": "",
  "current_role": "",
  "current_company": "",
  "education": {{"degree": "", "field": "", "institution": ""}},
  "primary_skills": [],
  "secondary_skills": [],
  "technical_skills": [],
  "soft_skills": [],
  "projects": [
    {{
      "project_name": "",
      "role": "",
      "duration": "",
      "tech_stack": [],
      "description": "",
      "responsibilities": [],
      "complexity_level": "low|medium|high",
      "impact": ""
    }}
  ],
  "work_experience": [
    {{
      "company": "",
      "role": "",
      "duration": "",
      "responsibilities": [],
      "achievements": []
    }}
  ],
  "certifications": [],
  "achievements": [],
  "domains_worked_in": [],
  "github_url": "",
  "linkedin_url": "",
  "portfolio_url": "",
  "potential_red_flags": [],
    "classified_skills": [
        {"skill_name": "", "category": "strong|intermediate|basic", "confidence": 0.0}
    ],
  "extraction_confidence": 0.0
}}"""
"# Request improved, deeper analysis: add a flag and skill detail summary\n"
CV_EXTRACTION_PROMPT = CV_EXTRACTION_PROMPT.replace('"extraction_confidence": 0.0', '"extraction_confidence": 0.0, "detected_document_type": "cv|jd|unknown", "skills_summary": {"top_skills": [], "skill_counts": {} }')

JD_EXTRACTION_PROMPT = """You are an expert job description analyzer.

Your task: Parse the provided Job Description and extract structured requirements in valid JSON format.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no code blocks, no explanations
2. Extract EXACTLY what is present - NO assumptions
3. If a field is not found, use empty string ("") or empty array ([])
4. Separate must-have from nice-to-have skills
5. Identify seniority level from description
6. List technical requirements separately from soft requirements

JOB DESCRIPTION TEXT:
{jd_text}

OUTPUT ONLY THIS JSON STRUCTURE (no other text):
{{
  "job_title": "",
  "company": "",
  "location": "",
  "job_type": "full_time|part_time|contract|remote|hybrid",
  "seniority_level": "junior|mid|senior|lead|executive",
  "min_experience_years": "",
  "max_experience_years": "",
  "salary_range": {{"min": "", "max": "", "currency": ""}},
  "must_have_skills": [],
  "nice_to_have_skills": [],
  "technical_requirements": [],
  "soft_skills_required": [],
  "responsibilities": [],
  "benefits": [],
  "education_required": "",
  "certifications_required": [],
  "domains": [],
  "industries": [],
  "team_size": "",
  "reporting_to": "",
  "growth_opportunities": [],
  "key_success_metrics": []
}}"""
"# Enhance JD prompt to also detect if the text actually appears to be a CV and request deeper skill mapping\n"
JD_EXTRACTION_PROMPT = JD_EXTRACTION_PROMPT.replace('"key_success_metrics": []', '"key_success_metrics": [], "detected_document_type": "jd|cv|unknown", "skills_mapping": {"must_have_count": 0, "nice_to_have_count": 0} ')


DOCUMENT_CLASSIFIER_PROMPT = """You are a text classifier that decides whether a given document is a CV/Resume (candidate profile) or a Job Description (JD).

RULES:
1. Output ONLY valid JSON.
2. Use labels: "cv" or "jd" or "unknown".
3. Provide confidence as a decimal between 0 and 1.
4. Provide a short reason explaining how you decided based on content features (e.g., sections present like "experience" or "responsibilities", formatting cues like "Curriculum Vitae", "Objective", bullet lists of responsibilities, hiring manager verbs, salary mention etc.).
5. If the doc is ambiguous or contains both JD and CV sections, return "unknown" with low confidence and reason.

DOCUMENT TEXT:
{doc_text}

RESPONSE JSON:
{
    "document_type": "cv|jd|unknown",
    "confidence": 0.0,
    "reason": "",
    "quick_hint": ""
}
"""


class LLMCVExtractor:
    """Extract structured data from CVs using LLM (OpenAI, Claude, Groq)"""
    
    def __init__(self, api_key: Optional[str] = None, provider: str = "openai"):
        """Initialize LLM extractor
        
        Args:
            api_key: LLM API key (OpenAI, Claude, Groq, etc.)
            provider: "openai", "anthropic", "groq", etc.
        """
        self.api_key = api_key
        self.provider = provider
        self.logger = logger
        
    async def extract_cv_data(self, cv_text: str) -> Dict[str, Any]:
        """
        Extract structured data from CV text using LLM
        
        Args:
            cv_text: Raw CV text
            
        Returns:
            Dictionary with extracted CV data
        """
        try:
            if not cv_text or len(cv_text.strip()) < 50:
                self.logger.warning("CV text too short for extraction")
                return self._empty_cv_response()
            
            prompt = CV_EXTRACTION_PROMPT.format(cv_text=cv_text[:5000])  # Limit to 5000 chars
            
            if self.provider.lower() == "openai":
                response = await self._extract_with_openai(prompt)
            elif self.provider.lower() == "anthropic":
                response = await self._extract_with_claude(prompt)
            elif self.provider.lower() == "groq":
                response = await self._extract_with_groq(prompt)
            else:
                self.logger.error(f"Unsupported provider: {self.provider}")
                return self._empty_cv_response()
            
            return response
            
        except Exception as e:
            self.logger.error(f"CV extraction error: {str(e)}")
            return self._empty_cv_response()
    
    async def extract_jd_data(self, jd_text: str) -> Dict[str, Any]:
        """
        Extract structured data from Job Description using LLM
        
        Args:
            jd_text: Raw JD text
            
        Returns:
            Dictionary with extracted JD data
        """
        try:
            if not jd_text or len(jd_text.strip()) < 50:
                self.logger.warning("JD text too short for extraction")
                return self._empty_jd_response()
            
            prompt = JD_EXTRACTION_PROMPT.format(jd_text=jd_text[:5000])  # Limit to 5000 chars
            
            if self.provider.lower() == "openai":
                response = await self._extract_with_openai(prompt)
            elif self.provider.lower() == "anthropic":
                response = await self._extract_with_claude(prompt)
            elif self.provider.lower() == "groq":
                response = await self._extract_with_groq(prompt)
            else:
                self.logger.error(f"Unsupported provider: {self.provider}")
                return self._empty_jd_response()
            
            return response
            
        except Exception as e:
            self.logger.error(f"JD extraction error: {str(e)}")
            return self._empty_jd_response()
    
    async def _extract_with_openai(self, prompt: str) -> Dict[str, Any]:
        """Extract using OpenAI API"""
        try:
            if not self.api_key:
                self.logger.error("OpenAI API key not configured")
                return {}
            
            self.logger.info("Starting OpenAI extraction with gpt-4-turbo-preview")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4-turbo-preview",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a JSON extractor. Output ONLY valid JSON, nothing else."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000
                    },
                    timeout=30.0
                )
            
            if response.status_code != 200:
                self.logger.error(f"OpenAI API error: {response.status_code}")
                return {}
            
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse JSON from response
            extracted_data = json.loads(content)
            
            # Add provider info and confidence
            extracted_data["extraction_confidence"] = 0.95
            extracted_data["provider"] = "openai"
            
            self.logger.info(f"OpenAI extraction successful, confidence: {extracted_data.get('extraction_confidence', 0)}")
            return extracted_data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON response from OpenAI: {e}")
            self.logger.error(f"OpenAI response content: {content[:500] if 'content' in locals() else 'No content'}")
            return {}
        except Exception as e:
            self.logger.error(f"OpenAI extraction error: {str(e)}")
            return {}
    
    async def _extract_with_claude(self, prompt: str) -> Dict[str, Any]:
        """Extract using Claude/Anthropic API"""
        try:
            if not self.api_key:
                self.logger.error("Claude API key not configured")
                return {}
            
            self.logger.info("Starting Claude extraction with claude-3-opus")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-opus-20240229",
                        "max_tokens": 2000,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    },
                    timeout=30.0
                )
            
            if response.status_code != 200:
                self.logger.error(f"Claude API error: {response.status_code}")
                return {}
            
            data = response.json()
            content = data.get("content", [{}])[0].get("text", "")
            
            # Parse JSON from response
            extracted_data = json.loads(content)
            
            # Add provider info and confidence
            extracted_data["extraction_confidence"] = 0.92
            extracted_data["provider"] = "anthropic"
            
            self.logger.info(f"Claude extraction successful, confidence: {extracted_data.get('extraction_confidence', 0)}")
            return extracted_data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON response from Claude: {e}")
            self.logger.error(f"Claude response content: {content[:500] if 'content' in locals() else 'No content'}")
            return {}
        except Exception as e:
            self.logger.error(f"Claude extraction error: {str(e)}")
            return {}
    
    async def _extract_with_groq(self, prompt: str) -> Dict[str, Any]:
        """Extract using Groq API (FREE tier available at https://console.groq.com)"""
        try:
            if not self.api_key:
                self.logger.error("Groq API key not configured")
                return {}
            
            self.logger.info("Starting Groq extraction with llama-3.3-70b-versatile")
            
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                api_key=self.api_key,
                timeout=30
            )
            
            response = await llm.ainvoke(prompt)
            
            # Parse JSON from response
            if not response.content:
                self.logger.error("Empty response from Groq")
                return {}
            
            extracted_data = json.loads(response.content)
            
            # Add provider info and confidence
            extracted_data["extraction_confidence"] = 0.88
            extracted_data["provider"] = "groq"
            
            self.logger.info(f"Groq extraction successful, confidence: {extracted_data.get('extraction_confidence', 0)}")
            return extracted_data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON response from Groq: {e}")
            self.logger.error(f"Groq response content: {response.content[:500] if 'response' in locals() else 'No response'}")
            return {}
        except Exception as e:
            self.logger.error(f"Groq extraction error: {str(e)}")
            return {}
    
    def _empty_cv_response(self) -> Dict[str, Any]:
        """Return empty CV response structure"""
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
            "projects": [],
            "work_experience": [],
            "certifications": [],
            "achievements": [],
            "domains_worked_in": [],
            "github_url": "",
            "linkedin_url": "",
            "portfolio_url": "",
            "potential_red_flags": [],
            "extraction_confidence": 0.0
        }
    
    def _empty_jd_response(self) -> Dict[str, Any]:
        """Return empty JD response structure"""
        return {
            "job_title": "",
            "company": "",
            "location": "",
            "job_type": "",
            "seniority_level": "",
            "min_experience_years": "",
            "max_experience_years": "",
            "salary_range": {"min": "", "max": "", "currency": ""},
            "must_have_skills": [],
            "nice_to_have_skills": [],
            "technical_requirements": [],
            "soft_skills_required": [],
            "responsibilities": [],
            "benefits": [],
            "education_required": "",
            "certifications_required": [],
            "domains": [],
            "industries": [],
            "team_size": "",
            "reporting_to": "",
            "growth_opportunities": [],
            "key_success_metrics": []
        }

    async def classify_document(self, doc_text: str) -> Dict[str, Any]:
        """Classify whether the document text is a CV or a JD and explain reasoning."""
        try:
            if not doc_text or len(doc_text.strip()) < 30:
                self.logger.warning("Document too short for classification")
                return {"document_type": "unknown", "confidence": 0.0, "reason": "Text too short"}

            prompt = DOCUMENT_CLASSIFIER_PROMPT.format(doc_text=doc_text[:6000])
            # Reuse OpenAI/Groq/Claude extraction wrappers but expect classification JSON
            if self.provider.lower() == "openai":
                resp = await self._extract_with_openai(prompt)
            elif self.provider.lower() == "anthropic":
                resp = await self._extract_with_claude(prompt)
            elif self.provider.lower() == "groq":
                resp = await self._extract_with_groq(prompt)
            else:
                self.logger.error(f"Unsupported provider: {self.provider}")
                return {"document_type": "unknown", "confidence": 0.0, "reason": "Unsupported provider"}

            # _extract_with_openai/_claude/_groq try to parse JSON but their structure may not match; coerce
            if not isinstance(resp, dict):
                # If it's string-based parse JSON
                try:
                    resp_json = json.loads(resp)
                except Exception:
                    return {"document_type": "unknown", "confidence": 0.0, "reason": "Malformed classifier response"}
            else:
                resp_json = resp

            # Normalize keys
            doc_type = resp_json.get("document_type") or resp_json.get("type") or "unknown"
            confidence = float(resp_json.get("confidence", 0.0) or 0.0)
            reason = resp_json.get("reason", "")
            quick_hint = resp_json.get("quick_hint", "")

            return {"document_type": doc_type.lower(), "confidence": confidence, "reason": reason, "quick_hint": quick_hint}
        except Exception as e:
            self.logger.error(f"Document classification error: {str(e)}")
            return {"document_type": "unknown", "confidence": 0.0, "reason": str(e)}
