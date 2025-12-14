/**
 * CV Parser Utility - Extracts candidate information from CV text
 */

export interface ExtractedCVData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  experience: string | null;
  education: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  skills: string[];
}

/**
 * Extract candidate information from CV text using regex patterns and heuristics
 */
export const extractCVData = (cvText: string): ExtractedCVData => {
  const result: ExtractedCVData = {
    fullName: null,
    email: null,
    phone: null,
    location: null,
    currentRole: null,
    currentCompany: null,
    experience: null,
    education: null,
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    skills: [],
  };

  if (!cvText || cvText.trim().length === 0) {
    return result;
  }

  // Extract Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = cvText.match(emailRegex);
  if (emails && emails.length > 0) {
    result.email = emails[0]; // Take first email found
  }

  // Extract Phone Number (various formats)
  const phoneRegex = /(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|(?:\+\d{1,3}[-.\s]?)?\d{6,}/g;
  const phones = cvText.match(phoneRegex);
  if (phones && phones.length > 0) {
    // Filter out year numbers by ensuring phone has at least one digit after any formatting
    const validPhone = phones.find(p => {
      const digits = p.replace(/\D/g, '');
      return digits.length >= 7; // Valid phone should have at least 7 digits
    });
    if (validPhone) {
      result.phone = validPhone.trim();
    }
  }

  // Extract LinkedIn URL
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[a-zA-Z0-9\-/%]+/gi;
  const linkedinMatches = cvText.match(linkedinRegex);
  if (linkedinMatches && linkedinMatches.length > 0) {
    result.linkedinUrl = linkedinMatches[0];
  }

  // Extract GitHub URL
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-]+/gi;
  const githubMatches = cvText.match(githubRegex);
  if (githubMatches && githubMatches.length > 0) {
    result.githubUrl = githubMatches[0];
  }

  // Extract Portfolio URL (common patterns)
  const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9\-]+\.(?:io|com|dev|net)\b/gi;
  const portfolioMatches = cvText.match(portfolioRegex);
  if (portfolioMatches && portfolioMatches.length > 0) {
    // Filter out linkedin and github
    const portfolio = portfolioMatches.find(
      p => !p.includes('linkedin') && !p.includes('github')
    );
    if (portfolio) {
      result.portfolioUrl = portfolio;
    }
  }

  // Extract Full Name (usually in first few lines)
  const lines = cvText.split('\n').slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for capitalized words (likely a name) that's not all caps and not too long
    if (
      trimmed.length > 3 &&
      trimmed.length < 100 &&
      !trimmed.includes('@') &&
      !trimmed.includes('http') &&
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed)
    ) {
      result.fullName = trimmed;
      break;
    }
  }

  // Extract Location (look for city/country patterns)
  const locationPatterns = [
    /(?:based\s+in|location|based|located\s+in|relocating\s+to|relocation\s+to|currently\s+in)\s+([A-Z][a-zA-Z\s,]+?)(?:\.|,|;|\n|$)/gi,
    /([A-Z][a-zA-Z\s]+),\s+([A-Z]{2}|[A-Z][a-zA-Z\s]+)/g, // City, State/Country pattern
  ];

  for (const pattern of locationPatterns) {
    const locationMatches = pattern.exec(cvText);
    if (locationMatches && locationMatches[1]) {
      result.location = locationMatches[1].trim();
      break;
    }
  }

  // Extract Current Role and Company
  const rolePatterns = [
    /(?:currently|present)\s+(?:work(?:ing)?\s+as|position|role):\s*([^\n,]+)/gi,
    /(?:current\s+(?:title|role|position)|job\s+title):\s*([^\n,]+)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:at|@|–|—)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\n|,|;|$)/g,
    /(?:title|role|position):\s*([^\n,]+)/gi,
  ];

  for (const pattern of rolePatterns) {
    const matches = pattern.exec(cvText);
    if (matches) {
      if (matches.length === 2) {
        // Single capture group - likely a title
        result.currentRole = matches[1].trim().substring(0, 100);
      } else if (matches.length >= 3) {
        // Two capture groups - title and company
        result.currentRole = matches[1].trim().substring(0, 100);
        result.currentCompany = matches[2].trim().substring(0, 100);
      }
      if (result.currentRole) break;
    }
  }

  // If we couldn't find current role, look for professional experience section
  if (!result.currentRole) {
    const experienceSectionRegex = /(?:experience|professional\s+experience|work\s+history|employment)[:\s]+([^\n]+)/gi;
    const expSection = experienceSectionRegex.exec(cvText);
    if (expSection && expSection[1]) {
      const expText = expSection[1].trim();
      // Extract role from experience section
      const roleMatch = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:at|@)/i.exec(expText);
      if (roleMatch) {
        result.currentRole = roleMatch[1].trim();
      }
    }
  }

  // Extract Experience Years (more flexible patterns)
  const experiencePatterns = [
    /(\d+)\+?\s*(?:years?|yrs?|year of|yr)\s+(?:of\s+)?(?:professional\s+)?(?:experience|work)/gi,
    /(?:experience|yrs?|years?):\s*(\d+)/gi,
    /(?:total\s+)?(?:work\s+)?(?:experience|history):\s*(\d+)\s*(?:years?|yrs?)/gi,
  ];

  for (const pattern of experiencePatterns) {
    const experienceMatches = pattern.exec(cvText);
    if (experienceMatches && experienceMatches[1]) {
      result.experience = `${experienceMatches[1]} years`;
      break;
    }
  }

  // Extract Education (degree, university)
  const educationPatterns = [
    /(?:bachelor|master|b\.?[as]\.?|m\.?[as]\.?|phd|diploma|degree|b\.s\.|m\.s\.|b\.a\.|m\.a\.)(?:\s+(?:of|in))?\s+(?:in\s+)?([a-zA-Z\s]+?)(?:\s+from\s+([a-zA-Z\s]+?))?(?:\n|,|;|$)/gi,
    /(?:education|degree):[^.]*?(?:bachelor|master|b\.s\.|m\.s\.|phd|diploma)\s+(?:in\s+)?([^\n,]+)/gi,
    /([a-zA-Z\s,]+)\s+(?:from|at|university|college)\s+([a-zA-Z\s]+?)(?:\n|,|;|$)/gi,
  ];

  for (const pattern of educationPatterns) {
    const educationMatches = pattern.exec(cvText);
    if (educationMatches && educationMatches[1]) {
      const degreeName = educationMatches[1].trim();
      const universityName = educationMatches[2] ? educationMatches[2].trim() : '';
      result.education = universityName
        ? `${degreeName} from ${universityName}`
        : degreeName;
      break;
    }
  }

  // Extract Skills (look for skill section)
  const skillSectionRegex = /(?:skills|technical skills|competencies)[\s\n:]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/gi;
  const skillMatches = skillSectionRegex.exec(cvText);
  if (skillMatches) {
    const skillsText = skillMatches[1];
    // Split by common delimiters
    const skills = skillsText
      .split(/[,;•·\n|/]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50)
      .slice(0, 20); // Limit to 20 skills
    result.skills = skills;
  } else {
    // Try to extract skills from text (common programming languages, frameworks, etc.)
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby',
      'React', 'Vue', 'Angular', 'Node\\.?js', 'Express', 'Django', 'Flask', 'Spring',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git',
      'REST', 'GraphQL', 'Microservices', 'DevOps', 'Machine Learning', 'AI'
    ];
    const skillRegex = new RegExp(`\\b(${commonSkills.join('|')})\\b`, 'gi');
    const foundSkills = cvText.match(skillRegex);
    if (foundSkills) {
      result.skills = Array.from(new Set(foundSkills.map(s => s.toLowerCase()))).slice(0, 20);
    }
  }

  return result;
};

/**
 * Format extracted CV data for API submission
 */
export const formatCVDataForAPI = (extractedData: ExtractedCVData) => {
  return {
    full_name: extractedData.fullName || '',
    email: extractedData.email || '',
    phone: extractedData.phone || '',
    location: extractedData.location || '',
    current_role: extractedData.currentRole || '',
    current_company: extractedData.currentCompany || '',
    experience_years: extractedData.experience || '',
    education: extractedData.education || '',
    linkedin_url: extractedData.linkedinUrl || '',
    github_url: extractedData.githubUrl || '',
    portfolio_url: extractedData.portfolioUrl || '',
    skills: extractedData.skills,
  };
};
