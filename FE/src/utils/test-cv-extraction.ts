// This file is for manual testing of CV extraction logic
// Run in Node.js or browser console to verify extraction works

const sampleCVText = `Himaja Sai Alapati
Address: Bhadrachalam, TS, India
Phone number: 9390738043
Email address: himajaalapati23@gmail.com
LinkedIn: www.linkedin.com/in/himaja-alapati-908929238/

Profile: Innovative and detail-driven Software Developer with proven expertise in crafting high-performance, scalable applications using modern full-stack technologies.

Work Experience

03/2025 – PRESENT HYDERABAD, INDIA
Software Developer & Mentor
NxtWave
Working extensively with GenAI, n8n, Python, JavaScript, and React

08/2023 – 03/2024 HYDERABAD, INDIA
Software Developer
Vaidhyamegha Pvt Ltd

EDUCATION

08/2023 – PRESENT PALVANCHA, INDIA
Computer Science | M.Tech
KLR Institute Of Technology, JNTUH

08/2018 – 07/2022 PALWANCHA, INDIA
Computer Science | B.Tech
Anubose Institute of Technology, JNTUH

Skills
FRONTEND: Html5, CSS3, React, Tailwind CSS
BACKEND: Python, JavaScript, Rest API's, C++
DATABASE: MySQL, AWS S3
CLOUD AND DEVOPS: Docker, Git, Github, Firebase

GitHub - Alapatihimaja23
Leetcode - https://leetcode.com/Alapati2001
`;

// Manual extraction test
export function testCVExtraction(text: string) {
  const results: Record<string, any> = {};

  // Test name extraction
  const nameMatches = text.match(/^([a-zA-Z\s]+?)(?:\n|$)/m);
  results.name = nameMatches ? nameMatches[1].trim() : null;

  // Test email extraction
  const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatches = emailRegex.exec(text);
  results.email = emailMatches ? emailMatches[1] : null;

  // Test phone extraction
  const phonePatterns = [
    /(?:phone|mobile|contact)[^0-9]*([+]?[\d\s\-()]{10,})/gi,
    /([+]?[1-9]\d{1,14})/g, // E.164 format
    /(\d{10})/g, // 10 digit number
  ];
  for (const pattern of phonePatterns) {
    const phoneMatches = pattern.exec(text);
    if (phoneMatches) {
      results.phone = phoneMatches[1];
      break;
    }
  }

  // Test location extraction
  const locationPatterns = [
    /(?:address|location|based in|located in):\s*([^,\n]+(?:,\s*[^,\n]+)?)/gi,
    /\b(?:Address|Location)[^:]*:\s*([^,\n]+(?:,\s*[A-Z]{2})?)/gi,
  ];
  for (const pattern of locationPatterns) {
    const locationMatches = pattern.exec(text);
    if (locationMatches) {
      results.location = locationMatches[1].trim();
      break;
    }
  }

  // Test role extraction
  const rolePatterns = [
    /^(?!.*experience)([A-Z][a-zA-Z\s&]+?)\n[A-Z\s]+(?:\n|[A-Z])/m,
    /(?:current role|title)[^:]*:\s*([^\n]+)/gi,
  ];
  for (const pattern of rolePatterns) {
    const roleMatches = pattern.exec(text);
    if (roleMatches) {
      results.currentRole = roleMatches[1].trim();
      break;
    }
  }

  // Test company extraction
  const companyPatterns = [
    /(?:at|@|–|—|with|company)\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\n|$)/gm,
    /(?:current company|employer)[^:]*:\s*([^\n]+)/gi,
  ];
  for (const pattern of companyPatterns) {
    const companyMatches = pattern.exec(text);
    if (companyMatches) {
      results.currentCompany = companyMatches[1].trim();
      break;
    }
  }

  // Test experience extraction
  const experiencePatterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?(?:experience|work)/gi,
    /(?:experience|yrs?|years?):\s*(\d+)/gi,
  ];
  for (const pattern of experiencePatterns) {
    const experienceMatches = pattern.exec(text);
    if (experienceMatches) {
      results.experience = `${experienceMatches[1]} years`;
      break;
    }
  }

  // Test education extraction
  const educationPatterns = [
    /(?:education|degree):\s*([^.]+)/gi,
    /(?:bachelor|master|b\.s\.|m\.s\.|phd|diploma)\s+(?:in\s+)?([^\n,]+)/gi,
  ];
  for (const pattern of educationPatterns) {
    const educationMatches = pattern.exec(text);
    if (educationMatches) {
      results.education = educationMatches[1].trim();
      break;
    }
  }

  // Test social URLs
  results.linkedinUrl = /linkedin\.com\/in\/([a-zA-Z0-9\-]+)/i.test(text)
    ? text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+/)?.[0]
    : null;
  results.githubUrl = text.match(/(?:github|github\.com)?[:\s\-]*([a-zA-Z0-9\-]+)(?:\s|$|,)/)?.[1] || null;

  // Test skills extraction
  const skillsSection = text.match(/(?:Skills|SKILLS)[^]*?(?=(?:Experience|Education|$))/i)?.[0] || text;
  const commonSkills = ['Python', 'JavaScript', 'React', 'TypeScript', 'Node.js', 'Angular', 'Vue', 'Docker', 'Kubernetes', 'AWS', 'MySQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'C++', 'C#', '.NET', 'SQL', 'Git'];
  results.skills = commonSkills.filter((skill) => new RegExp(`\\b${skill}\\b`, 'i').test(skillsSection));

  return results;
}

// Run test
if (typeof (module as any) !== 'undefined' && (module as any).hot) {
  // In development environment
  console.log('CV Extraction Test Results:', testCVExtraction(sampleCVText));
}
