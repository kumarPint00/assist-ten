import { NextResponse } from "next/server";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

const sampleMatchAnalysis = {
  overall_match_score: 76,
  fit_category: "Good",
  role_alignment: {
    role_match: true,
    seniority_match: "Mid",
    domain_match: true,
  },
  skill_match: {
    matched_skills: [
      { skill: "python", jd_priority: "high", cv_depth: "strong" },
      { skill: "docker", jd_priority: "medium", cv_depth: "moderate" },
      { skill: "aws", jd_priority: "high", cv_depth: "weak" },
    ],
    missing_critical_skills: ["kubernetes"],
    extra_skills: ["typescript"],
  },
  experience_analysis: {
    required_experience_years: 5,
    claimed_experience_years: 4,
    experience_gap: "minor",
    relevant_project_count: 3,
  },
  strengths: ["python", "docker"],
  weaknesses: ["Missing critical skill: kubernetes", "Limited depth in aws"],
  risk_flags: [
    {
      type: "tech_mismatch",
      description: "Critical tools mentioned in the JD are not verifiable in the CV.",
    },
    {
      type: "shallow_experience",
      description: "AWS is mentioned without hands-on ownership wording.",
    },
  ],
  interview_focus_areas: [
    {
      area: "Kubernetes competency",
      reason: "JD lists the skill as critical, but the CV lacks concrete examples.",
      priority: "high",
    },
    {
      area: "AWS delivery",
      reason: "Candidate mentions AWS without leadership language.",
      priority: "medium",
    },
    {
      area: "Experience chronology",
      reason: "Claimed experience is one year shorter than the JD expectation.",
      priority: "medium",
    },
  ],
  recommended_interview_difficulty: "medium",
  confidence_level: "medium",
};

const MATCHER_SCRIPT = join(process.cwd(), "scripts", "cv_jd_match.py");

const writeTempFile = (prefix: string, contents: string) => {
  const path = join(tmpdir(), `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.txt`);
  writeFileSync(path, contents ?? "", "utf-8");
  return path;
};

const cleanupFiles = (...paths: string[]) => {
  paths.forEach((filePath) => {
    try {
      unlinkSync(filePath);
    } catch (err) {
      // best-effort cleanup
    }
  });
};

const runMatcher = (jobDescription: string, candidateCv: string) => {
  const jobPath = writeTempFile("job", jobDescription);
  const cvPath = writeTempFile("cv", candidateCv);

  try {
    const output = execFileSync("python3", [MATCHER_SCRIPT, "--job", jobPath, "--cv", cvPath], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    return JSON.parse(output);
  } finally {
    cleanupFiles(jobPath, cvPath);
  }
};

export async function GET() {
  return NextResponse.json(sampleMatchAnalysis);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_description: jobDescription, candidate_cv: candidateCv } = body;

    if (!jobDescription || !candidateCv) {
      return NextResponse.json(
        { error: "Both job_description and candidate_cv are required." },
        { status: 400 }
      );
    }

    const result = runMatcher(jobDescription, candidateCv);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Matcher endpoint failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matcher execution failed." },
      { status: 500 }
    );
  }
}
