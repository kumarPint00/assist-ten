import re
from typing import Tuple


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\-().\s]{6,}\d)")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
COMPANY_RE = re.compile(r"\b([A-Z][A-Za-z0-9&\.-]{1,}\s+(?:Inc|LLC|Ltd|Corporation|Corp|Company|Co\.?))\b")


def redact_pii(text: str) -> Tuple[str, dict]:
    """Redact common PII from the provided text while preserving formatting.

    Returns (redacted_text, counts) where counts is a dict with how many items redacted.
    Preserves original indentation, line breaks, and document structure.
    """
    if not text:
        return text, {"emails": 0, "phones": 0, "urls": 0, "companies": 0}

    emails = EMAIL_RE.findall(text)
    phones = PHONE_RE.findall(text)
    urls = URL_RE.findall(text)
    companies = COMPANY_RE.findall(text)

    redacted = text
    
    # Replace emails - preserve line structure
    if emails:
        redacted = EMAIL_RE.sub("[REDACTED_EMAIL]", redacted)
    
    # Replace phones - preserve line structure
    if phones:
        redacted = PHONE_RE.sub("[REDACTED_PHONE]", redacted)
    
    # Replace URLs - preserve line structure
    if urls:
        redacted = URL_RE.sub("[REDACTED_URL]", redacted)
    
    # Replace company explicit mentions - preserve line structure
    if companies:
        redacted = COMPANY_RE.sub("[REDACTED_COMPANY]", redacted)

    # Mask labels while preserving indentation
    # Phone: xxx -> Phone: [REDACTED]
    redacted = re.sub(r"(?i)(phone\s*[:\-])\s*\S.*?(?=\n|$)", r"\1 [REDACTED]", redacted)
    
    # Email: xxx -> Email: [REDACTED]
    redacted = re.sub(r"(?i)(email\s*[:\-])\s*\S.*?(?=\n|$)", r"\1 [REDACTED]", redacted)
    
    # Current company: xxx -> Current Company: [REDACTED]
    redacted = re.sub(r"(?i)(current\s+company\s*[:\-])\s*.+?(?=\n|$)", r"\1 [REDACTED]", redacted)
    
    # LinkedIn: xxx -> LinkedIn: [REDACTED_URL]
    redacted = re.sub(r"(?i)(linkedin\s*[:\-])\s*.*?(?=\n|$)", r"\1 [REDACTED_URL]", redacted)
    
    # GitHub/Portfolio/Website URLs
    redacted = re.sub(r"(?i)(github|portfolio|website)\s*[:\-]\s*.*?(?=\n|$)", r"\1: [REDACTED_URL]", redacted)

    counts = {
        "emails": len(emails),
        "phones": len(phones),
        "urls": len(urls),
        "companies": len(companies),
    }
    return redacted, counts
