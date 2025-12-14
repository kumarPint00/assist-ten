import { extractCVData } from '../cvParser';

// Sample CV text from a real candidate
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
Working extensively with GenAI, n8n, Python, JavaScript, and React to develop, integrate, and optimize scalable applications.

08/2023 – 03/2024 HYDERABAD, INDIA
Software Developer
Vaidhyamegha Pvt Ltd
Project: Business Intelligence Migration Platform
Tech Stack: React, Python, AWS Services, Power BI, Tableau

EDUCATION

08/2023 – PRESENT PALVANCHA, INDIA
Computer Science | M.Tech
KLR Institute Of Technology, JNTUH
CPI: 7.5

08/2018 – 07/2022 PALWANCHA, INDIA
Computer Science | B.Tech
Anubose Institute of Technology, JNTUH
CPI: 7.7

Skills
FRONTEND
Html5, CSS3, React, Tailwind CSS

BACKEND
Python, JavaScript, Rest API's, C++

DATABASE
MySQL, AWS S3

CLOUD AND DEVOPS
Docker, Git, Github, Firebase

CODING PROFILES
GeeksForGeeks - himaja2001
GitHub - Alapatihimaja23
Leetcode - https://leetcode.com/Alapati2001 (Solved 100+ Problems)

SPEAKING LANGUAGES
Telugu (Native Proficiency)
English (Working Proficiency)
Hindi (Limited Working Proficiency)`;

describe('cvParser - extractCVData', () => {
  const extracted = extractCVData(sampleCVText);

  console.log('Extracted CV Data:', extracted);

  test('should extract full name', () => {
    expect(extracted.fullName).toBeTruthy();
    expect(extracted.fullName?.toLowerCase()).toContain('himaja');
  });

  test('should extract email', () => {
    expect(extracted.email).toBe('himajaalapati23@gmail.com');
  });

  test('should extract phone number', () => {
    expect(extracted.phone).toBeTruthy();
    expect(extracted.phone).toMatch(/9390738043|+919390738043/);
  });

  test('should extract location', () => {
    expect(extracted.location).toBeTruthy();
    expect(extracted.location?.toLowerCase()).toContain('bhadrachalam');
  });

  test('should extract current role', () => {
    expect(extracted.currentRole).toBeTruthy();
    expect(extracted.currentRole?.toLowerCase()).toContain('software developer');
  });

  test('should extract current company', () => {
    expect(extracted.currentCompany).toBeTruthy();
    expect(extracted.currentCompany?.toLowerCase()).toContain('nxtwave');
  });

  test('should extract experience years', () => {
    expect(extracted.experience).toBeTruthy();
    expect(extracted.experience).toMatch(/\d+\s*years?/);
  });

  test('should extract education', () => {
    expect(extracted.education).toBeTruthy();
    expect(extracted.education?.toLowerCase()).toContain('m.tech');
  });

  test('should extract LinkedIn URL', () => {
    expect(extracted.linkedinUrl).toBeTruthy();
    expect(extracted.linkedinUrl).toContain('linkedin.com');
  });

  test('should extract GitHub URL', () => {
    expect(extracted.githubUrl).toBeTruthy();
    expect(extracted.githubUrl?.toLowerCase()).toContain('alapatihimaja23');
  });

  test('should extract skills', () => {
    expect(extracted.skills).toBeTruthy();
    expect(extracted.skills!.length).toBeGreaterThan(0);
    expect(extracted.skills).toContain('React');
    expect(extracted.skills).toContain('Python');
  });
});
