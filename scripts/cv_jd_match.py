"""Simple CV ↔ JD matching engine for the Assist Ten platform."""
import argparse
import json
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple

SKILL_ALIASES: Dict[str, List[str]] = {
    "python": ["python"],
    "java": ["java"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "reactjs", "react.js"],
    "node": ["node", "nodejs", "node.js"],
    "golang": ["go lang", "golang", "go"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "google cloud platform"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "sql": ["sql", "postgres", "mysql", "postgresql", "mssql"],
    "nosql": ["nosql", "mongodb", "cassandra", "dynamodb"],
    "data engineering": ["data pipeline", "etl", "data engineering"],
    "ml": ["machine learning", "ml", "predictive modeling"],
    "devops": ["devops", "site reliability"],
    "security": ["security", "infosec", "application security"],
    "testing": ["testing", "qa", "quality assurance", "automated tests"],
    "ai": ["artificial intelligence", "ai"],
    "leadership": ["leadership", "managed", "led team"],
}

PRIORITY_TRIGGERS_HIGH = [
    "must",
    "required",
    "essential",
    "needs to",
    "core",
    "strong",
    "proven",
]
PRIORITY_TRIGGERS_LOW = ["nice to have", "bonus", "preferred"]
STRONG_DEPTH_INDICATORS = ["led", "architected", "owned", "designed", "implemented", "built"]
WEAK_DEPTH_INDICATORS = ["familiar", "exposure", "some experience", "learning", "introductory"]
ROLE_KEYWORDS = ["engineer", "developer", "architect", "manager", "analyst", "specialist"]
DOMAIN_KEYWORDS = [
    "finance",
    "healthcare",
    "edtech",
    "retail",
    "ai",
    "security",
    "data",
    "cloud",
    "infrastructure",
]


@dataclass
class SkillMatch:
    skill: str
    jd_priority: str
    cv_depth: str


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def find_priority(text: str, alias: str) -> str:
    index = text.find(alias)
    if index == -1:
        return "medium"
    window_start = max(0, index - 80)
    window = text[window_start:index]
    if any(trigger in window for trigger in PRIORITY_TRIGGERS_HIGH):
        return "high"
    if any(trigger in window for trigger in PRIORITY_TRIGGERS_LOW):
        return "low"
    return "medium"


def assess_depth(text: str, alias: str) -> str:
    index = text.find(alias)
    if index == -1:
        return "weak"
    window_start = max(0, index - 80)
    window_end = min(len(text), index + len(alias) + 80)
    window = text[window_start:window_end]
    if any(indicator in window for indicator in STRONG_DEPTH_INDICATORS):
        return "strong"
    if any(indicator in window for indicator in WEAK_DEPTH_INDICATORS):
        return "weak"
    return "moderate"


def extract_skills(text: str, aliases: Dict[str, List[str]]) -> Dict[str, Set[str]]:
    normalized = normalize(text)
    detected: Dict[str, Set[str]] = {}
    for skill, words in aliases.items():
        for word in words:
            if word in normalized:
                detected.setdefault(skill, set()).add(word)
    return detected


def extract_experience_years(text: str) -> Optional[float]:
    normalized = normalize(text)
    matches = re.findall(r"(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years|yrs|yrs\.|year)", normalized)
    if not matches:
        return None
    try:
        values = [float(match) for match in matches]
        return max(values)
    except ValueError:
        return None


def detect_role_match(jd_text: str, cv_text: str) -> bool:
    normalized_jd = normalize(jd_text)
    normalized_cv = normalize(cv_text)
    return any(keyword in normalized_jd and keyword in normalized_cv for keyword in ROLE_KEYWORDS)


def infer_seniority(text: str) -> str:
    normalized = normalize(text)
    if "principal" in normalized or "staff" in normalized or "lead" in normalized:
        return "Senior"
    if "senior" in normalized or "sr." in normalized:
        return "Senior"
    if "mid" in normalized:
        return "Mid"
    if "junior" in normalized or "jr." in normalized:
        return "Junior"
    return "Mid"


def domain_overlap(jd_text: str, cv_text: str) -> bool:
    normalized_jd = normalize(jd_text)
    normalized_cv = normalize(cv_text)
    return any(domain in normalized_jd and domain in normalized_cv for domain in DOMAIN_KEYWORDS)


def count_projects(text: str) -> int:
    normalized = normalize(text)
    return normalized.count("project")


def build_skill_matches(
    jd_text: str, cv_text: str
) -> Tuple[List[SkillMatch], List[str], List[str], Dict[str, str]]:
    jd_skills = extract_skills(jd_text, SKILL_ALIASES)
    cv_skills = extract_skills(cv_text, SKILL_ALIASES)
    matched: List[SkillMatch] = []
    missing: List[str] = []
    extra: List[str] = []
    skill_priority: Dict[str, str] = {}

    for skill in jd_skills:
        priority = "medium"
        for alias in jd_skills[skill]:
            priority = find_priority(jd_text, alias)
            if priority == "high":
                break
        skill_priority[skill] = priority
        if skill in cv_skills:
            depth = assess_depth(cv_text, next(iter(cv_skills[skill])))
            matched.append(SkillMatch(skill=skill, jd_priority=priority, cv_depth=depth))
        elif priority == "high":
            missing.append(skill)

    for skill, _aliases in cv_skills.items():
        if skill not in jd_skills:
            extra.append(skill)

    return matched, missing, extra, skill_priority


def make_strengths(matched_skills: List[SkillMatch]) -> List[str]:
    return [match.skill for match in matched_skills if match.cv_depth == "strong"]


def make_weaknesses(missing_skills: List[str], matched_skills: List[SkillMatch]) -> List[str]:
    weaknesses = [f"Missing critical skill: {skill}" for skill in missing_skills]
    weaknesses.extend([f"Limited depth in {match.skill}" for match in matched_skills if match.cv_depth == "weak"])
    return weaknesses


def build_risk_flags(
    missing_skills: List[str], matched_skills: List[SkillMatch], experience_gap: str, domain_matched: bool
) -> List[Dict[str, str]]:
    risks: List[Dict[str, str]] = []
    if missing_skills:
        risks.append(
            {
                "type": "tech_mismatch",
                "description": "Critical tools mentioned in the JD are not verifiable in the CV.",
            }
        )
    if any(match.cv_depth == "weak" for match in matched_skills):
        risks.append(
            {
                "type": "shallow_experience",
                "description": "Several matched skills are described without hands-on ownership language.",
            }
        )
    if experience_gap == "major":
        risks.append(
            {
                "type": "shallow_experience",
                "description": "Claimed experience does not meet the JD expectation by multiple years.",
            }
        )
    if not domain_matched:
        risks.append(
            {
                "type": "tech_mismatch",
                "description": "Domain or industry experience in the JD is absent or unclear in the CV.",
            }
        )
    return risks


def build_focus_areas(
    missing_skills: List[str], matched_skills: List[SkillMatch], experience_gap: str, domain_matched: bool
) -> List[Dict[str, str]]:
    areas: List[Dict[str, str]] = []
    for skill in missing_skills:
        areas.append(
            {
                "area": f"{skill} competency",
                "reason": f"JD lists {skill} as critical, but the CV lacks concrete examples.",
                "priority": "high",
            }
        )
    for match in matched_skills:
        if match.cv_depth == "weak":
            areas.append(
                {
                    "area": match.skill,
                    "reason": "Candidate mentions the skill but without clear delivery or leadership cues.",
                    "priority": "medium",
                }
            )
    if experience_gap != "none":
        areas.append(
            {
                "area": "Experience chronology",
                "reason": "There is a visible gap between the years expected and those declared in the CV.",
                "priority": "medium" if experience_gap == "minor" else "high",
            }
        )
    if not domain_matched:
        areas.append(
            {
                "area": "Domain exposure",
                "reason": "The JD and CV do not share an obvious domain context, so probe practical relevance.",
                "priority": "medium",
            }
        )
    return areas


def calculate_match_score(
    matched_skills: List[SkillMatch], missing_skills: List[str], jd_experience: float, cv_experience: float
) -> int:
    base = 30
    required_skills = max(len([match for match in matched_skills if match.jd_priority == "high"] + missing_skills), 1)
    matched_high = len([match for match in matched_skills if match.jd_priority == "high"])
    skill_score = int((matched_high / required_skills) * 40)
    experience_ratio = 1.0
    if jd_experience and cv_experience:
        experience_ratio = min(cv_experience / jd_experience, 1.0)
    exp_score = int(experience_ratio * 30)
    score = min(100, base + skill_score + exp_score)
    return score


def classify_fit(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 50:
        return "Partial"
    return "Weak"


def classify_experience_gap(jd_years: Optional[float], cv_years: Optional[float]) -> str:
    if not jd_years or not cv_years:
        return "none"
    delta = jd_years - cv_years
    if delta <= 0:
        return "none"
    if delta <= 2:
        return "minor"
    return "major"


def difficulty_from_score(score: int) -> str:
    if score >= 80:
        return "hard"
    if score >= 55:
        return "medium"
    return "easy"


def confidence_level_from_data(matched_count: int, jd_years: Optional[float], cv_years: Optional[float]) -> str:
    if matched_count >= 3 and jd_years and cv_years:
        return "high"
    if matched_count >= 1 or jd_years or cv_years:
        return "medium"
    return "low"


def match_cv_to_jd(job_description: str, candidate_cv: str) -> Dict:
    jd_text = job_description or ""
    cv_text = candidate_cv or ""
    matched_skills, missing_skills, extra_skills, priorities = build_skill_matches(jd_text, cv_text)
    jd_years = extract_experience_years(jd_text) or 0
    cv_years = extract_experience_years(cv_text) or 0
    experience_gap = classify_experience_gap(jd_years, cv_years)
    score = calculate_match_score(matched_skills, missing_skills, jd_years, cv_years)
    fit = classify_fit(score)
    role_match = detect_role_match(jd_text, cv_text)
    domain_matched = domain_overlap(jd_text, cv_text)
    seniority = infer_seniority(jd_text)
    strengths = make_strengths(matched_skills)
    weaknesses = make_weaknesses(missing_skills, matched_skills)
    risk_flags = build_risk_flags(missing_skills, matched_skills, experience_gap, domain_matched)
    focus_areas = build_focus_areas(missing_skills, matched_skills, experience_gap, domain_matched)
    difficulty = difficulty_from_score(score)
    confidence = confidence_level_from_data(len(matched_skills), jd_years, cv_years)

    skill_entries = [
        {
            "skill": match.skill,
            "jd_priority": match.jd_priority,
            "cv_depth": match.cv_depth,
        }
        for match in matched_skills
    ]

    return {
        "overall_match_score": score,
        "fit_category": fit,
        "role_alignment": {
            "role_match": role_match,
            "seniority_match": seniority,
            "domain_match": domain_matched,
        },
        "skill_match": {
            "matched_skills": skill_entries,
            "missing_critical_skills": missing_skills,
            "extra_skills": extra_skills,
        },
        "experience_analysis": {
            "required_experience_years": jd_years,
            "claimed_experience_years": cv_years,
            "experience_gap": experience_gap,
            "relevant_project_count": count_projects(cv_text),
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "risk_flags": risk_flags,
        "interview_focus_areas": focus_areas,
        "recommended_interview_difficulty": difficulty,
        "confidence_level": confidence,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Match a candidate CV to a job description.")
    parser.add_argument("--job", required=True, help="Path to a text file containing the job description.")
    parser.add_argument("--cv", required=True, help="Path to a text file containing the candidate CV.")
    args = parser.parse_args()

    with open(args.job, "r", encoding="utf-8") as jd_file, open(
        args.cv, "r", encoding="utf-8"
    ) as cv_file:
        jd_text = jd_file.read()
        cv_text = cv_file.read()

    result = match_cv_to_jd(jd_text, cv_text)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
