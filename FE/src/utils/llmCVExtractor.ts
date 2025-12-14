/**
 * LLM-based CV Extraction
 * Frontend utility for sending CVs to backend LLM extraction
 */

export interface CVData {
  candidate_name: string;
  email: string;
  phone: string;
  location: string;
  total_experience_years: string;
  current_role: string;
  current_company: string;
  education: {
    degree: string;
    field: string;
    institution: string;
  };
  primary_skills: string[];
  secondary_skills: string[];
  technical_skills: string[];
  soft_skills: string[];
  projects: Array<{
    project_name: string;
    role: string;
    duration: string;
    tech_stack: string[];
    description: string;
    responsibilities: string[];
    complexity_level: "low" | "medium" | "high";
    impact: string;
  }>;
  work_experience: Array<{
    company: string;
    role: string;
    duration: string;
    responsibilities: string[];
    achievements: string[];
  }>;
  certifications: string[];
  achievements: string[];
  domains_worked_in: string[];
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  potential_red_flags: string[];
  classified_skills?: Array<{ skill_name: string; category: 'strong' | 'advance' | 'intermediate' | 'basic'; confidence: number }>;
  extraction_confidence: number;
}

export interface JDData {
  job_title: string;
  company: string;
  location: string;
  job_type: "full_time" | "part_time" | "contract" | "remote" | "hybrid";
  seniority_level: "junior" | "mid" | "senior" | "lead" | "executive";
  min_experience_years: string;
  max_experience_years: string;
  salary_range: {
    min: string;
    max: string;
    currency: string;
  };
  must_have_skills: string[];
  nice_to_have_skills: string[];
  technical_requirements: string[];
  soft_skills_required: string[];
  responsibilities: string[];
  benefits: string[];
  education_required: string;
  certifications_required: string[];
  domains: string[];
  industries: string[];
  team_size: string;
  reporting_to: string;
  growth_opportunities: string[];
  key_success_metrics: string[];
}

/**
 * Extract CV data using LLM
 */
export const extractCVDataWithLLM = async (cvText: string): Promise<CVData> => {
  console.log("[🚀 LLM CV Extraction] Starting LLM-based extraction");

  if (!cvText || cvText.trim().length === 0) {
    console.error("[❌ LLM CV Extraction] Empty CV text");
    throw new Error("CV text is empty");
  }

    try {
    console.log(`[📊 LLM CV Extraction] Sending ${cvText.length} chars to LLM`);

    const response = await fetch("/api/v1/extract/cv-with-llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cv_text: cvText,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[❌ LLM CV Extraction] API error: ${response.status} - ${body}`);
      throw new Error(`LLM extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[✅ LLM CV Extraction] Received structured data:", data);

    // Defensive: ensure expected fields
    if (!data || !data.candidate_name) {
      console.warn('[⚠️ LLM CV Extraction] Unexpected response shape', data);
    }

    return data;
  } catch (error) {
    console.error("[❌ LLM CV Extraction] Error:", error);
    throw error;
  }
};

/**
 * Extract JD data using LLM
 */
export const extractJDDataWithLLM = async (jdText: string): Promise<JDData> => {
  console.log("[🚀 LLM JD Extraction] Starting LLM-based extraction");

  if (!jdText || jdText.trim().length === 0) {
    console.error("[❌ LLM JD Extraction] Empty JD text");
    throw new Error("JD text is empty");
  }

  try {
    console.log(`[📊 LLM JD Extraction] Sending ${jdText.length} chars to LLM`);

    const response = await fetch("/api/v1/extract/jd-with-llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jd_text: jdText,
      }),
    });

    if (!response.ok) {
      console.error(`[❌ LLM JD Extraction] API error: ${response.status}`);
      throw new Error(`LLM extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[✅ LLM JD Extraction] Received structured data:", data);

    return data;
  } catch (error) {
    console.error("[❌ LLM JD Extraction] Error:", error);
    throw error;
  }
};

/**
 * Compare CV skills with JD requirements
 */
export const compareSkillsWithJD = (cvData: CVData, jdData: JDData) => {
  const cvSkills = [
    ...cvData.primary_skills,
    ...cvData.secondary_skills,
    ...cvData.technical_skills,
  ];

  const mustHaveMatches = jdData.must_have_skills.filter((skill) =>
    cvSkills.some((cvSkill) =>
      cvSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const niceToHaveMatches = jdData.nice_to_have_skills.filter((skill) =>
    cvSkills.some((cvSkill) =>
      cvSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const matchPercentage =
    jdData.must_have_skills.length > 0
      ? (mustHaveMatches.length / jdData.must_have_skills.length) * 100
      : 0;

  console.log("[📊 Skill Match Analysis]", {
    mustHaveMatches: mustHaveMatches.length,
    mustHaveTotal: jdData.must_have_skills.length,
    niceToHaveMatches: niceToHaveMatches.length,
    matchPercentage: matchPercentage.toFixed(2) + "%",
  });

  return {
    mustHaveMatches,
    niceToHaveMatches,
    matchPercentage,
    missingMustHaveSkills: jdData.must_have_skills.filter(
      (skill) => !mustHaveMatches.includes(skill)
    ),
  };
};

/**
 * Calculate candidate suitability score
 */
export const calculateSuitabilityScore = (
  cvData: CVData,
  jdData: JDData
): number => {
  let score = 0;
  let maxScore = 0;

  // Experience match
  if (jdData.min_experience_years && cvData.total_experience_years) {
    maxScore += 30;
    const minExp = parseInt(jdData.min_experience_years);
    const cvExp = parseInt(cvData.total_experience_years);
    if (cvExp >= minExp) {
      score += 30;
    } else {
      score += (cvExp / minExp) * 30;
    }
  }

  // Skills match
  const skillComparison = compareSkillsWithJD(cvData, jdData);
  maxScore += 40;
  score += (skillComparison.matchPercentage / 100) * 40;

  // Education match
  if (jdData.education_required && cvData.education.degree) {
    maxScore += 20;
    const educationMatch = cvData.education.degree
      .toLowerCase()
      .includes(jdData.education_required.toLowerCase());
    if (educationMatch) {
      score += 20;
    } else {
      score += 10; // Partial credit
    }
  }

  // Role relevance
  if (cvData.current_role && jdData.job_title) {
    maxScore += 10;
    const roleMatch = cvData.current_role
      .toLowerCase()
      .includes(jdData.job_title.toLowerCase());
    if (roleMatch) {
      score += 10;
    }
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
};
