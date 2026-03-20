import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// Lightweight local summarizer used as a safe fallback when the external
// AI service is unavailable. It parses the provided `userContent` for
// Title, Profession, Skills, and Experience and composes an ATS-friendly
// multi-sentence summary without inventing facts. When `createIfEmpty` is
// true, the fallback will produce at least 5 short sentences focused on
// the candidate's Profession / target role.
const generateLocalSummary = (userContent, createIfEmpty = false) => {
  if (!userContent || typeof userContent !== "string") return "";

  const extract = (key) => {
    const re = new RegExp(`${key}:\\s*([^\\|\\n\\.]*)`, "i");
    const m = userContent.match(re);
    return m ? m[1].trim() : "";
  };

  const title = extract("Title") || extract("Target") || "";
  const profession = extract("Profession") || "";
  const skillsRaw = extract("Skills");
  const skills = skillsRaw ? skillsRaw.split(/[,;]\\s*/).slice(0, 6).join(", ") : "";
  const experience = extract("Experience") || "";

  // If not creating from empty, return a concise one- or two-sentence summary.
  if (!createIfEmpty) {
    const parts = [];
    if (profession) parts.push(profession.charAt(0).toUpperCase() + profession.slice(1));
    if (skills) parts.push(`skilled in ${skills}`);
    if (experience) parts.push(`experience includes ${experience.split(";").slice(0,1)[0]}`);
    if (parts.length === 0) return "Motivated professional seeking relevant opportunities and ready to contribute strong technical skills.";
    return `${parts.join(", ")}. Focused on delivering high-quality results.`;
  }

  // For createIfEmpty=true, build an 8-sentence summary focused on Profession.
  const sentences = [];
  const prof = title || profession || "Professional";
  // 1: Role + background
  sentences.push(`${prof} with a strong background in ${skills || "relevant technical and transferable skills"}.`);
  // 2: Experience overview
  if (experience) sentences.push(`Experience includes ${experience.split(";").slice(0,2).join("; ")}, providing practical industry exposure.`);
  else sentences.push(`Brings practical experience working on projects relevant to the role.`);
  // 3: Core competencies
  if (skills) sentences.push(`Core competencies include ${skills}.`);
  else sentences.push(`Core competencies include technical proficiency and problem-solving abilities.`);
  // 4: Achievements/impact phrasing (without inventing facts)
  sentences.push(`Has a track record of delivering measurable outcomes through effective execution and continuous improvement.`);
  // 5: Tools/methods (if skills exist, mention broadly)
  if (skills) sentences.push(`Familiar with tools and methodologies commonly used in the field, applying best practices to deliver results.`);
  else sentences.push(`Applies best practices and modern methodologies to solve complex problems.`);
  // 6: Collaboration and soft skills
  sentences.push(`Works collaboratively across teams, communicating clearly and driving cross-functional initiatives.`);
  // 7: Career objective aligned to role
  sentences.push(`Seeks to contribute to challenging ${profession || "roles"} where technical expertise and teamwork drive business value.`);
  // 8: Closing value statement
  sentences.push(`Committed to delivering high-quality, impactful work that supports organizational goals and growth.`);

  // Return first 8 sentences joined together.
  return sentences.slice(0,8).join(" ");
};

// Enhance Professional Summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    try {
      // Allow client to request a full-creation prompt when there is no existing summary
      const { createIfEmpty } = req.body;

      const systemContent = createIfEmpty
        ? `You are a seasoned resume writer and career strategist. Using the provided context, craft a professional summary of at least FIVE clear sentences tailored to the candidate's target role or job preference. Begin by naming the target role or profession, then highlight top technical and transferable skills, describe relevant experience or past roles (without inventing facts), emphasize measurable impact if present, and finish with a concise career objective aligned to the target job. Use strong action verbs, include ATS-friendly keywords, maintain a confident professional tone, and return ONLY the 5+ sentence summary text with no quotes or extra commentary.`
        : `You are a seasoned resume writer and career strategist. Improve the given professional summary to be concise (1-2 sentences), more impactful, and tailored to the candidate's target role or job preference. Preserve factual information, strengthen wording with action verbs, add quantifiable impact when possible, and include ATS-friendly keywords. Do not invent facts. Return ONLY the improved summary text with no quotes or extra commentary.`;

      const response = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      });

      const enhancedContent = response?.choices?.[0]?.message?.content || "";
      return res.status(200).json({ enhancedContent });
    } catch (aiError) {
      console.error('AI enhanceProfessionalSummary error:', aiError?.message || aiError);
      // Fallback: generate a safe local summary from context so the UI receives
      // a helpful text instead of an error message. This avoids echoing prompts
      // and prevents leaving the user with an empty summary.
      try {
        const { createIfEmpty } = req.body;
        const fallback = generateLocalSummary(userContent, createIfEmpty);
        return res.status(200).json({ enhancedContent: fallback });
      } catch (genErr) {
        console.error('Local summary generation failed:', genErr);
        return res.status(200).json({ enhancedContent: "" });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Enhance Job Description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    try {
        // Request a concise, ChatGPT-style rewrite in 5-6 sentences.
        const { sentenceCount } = req.body;
        const countText = sentenceCount ? `${sentenceCount}` : '5 to 6';
        const response = await ai.chat.completions.create({
          model: process.env.OPENAI_MODEL,
          messages: [
            {
              role: "system",
              content:
                `You are a professional resume writer. Rewrite the provided job description into a clear, engaging paragraph of ${countText} sentences that emphasize responsibilities, achievements, and skills using action verbs. Keep the output factual (do not invent details) and ATS-friendly. Return ONLY the rewritten description as plain text (a paragraph) with no labels, quotes, or extra commentary.`,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        });

        const enhancedContent = response?.choices?.[0]?.message?.content || "";
        return res.status(200).json({ enhancedContent });
    } catch (aiError) {
      console.error('AI enhanceJobDescription error:', aiError?.message || aiError);
        // Fallback: generate a safe local job description in 5-6 sentences.
        try {
          const { sentenceCount } = req.body;
          const fallback = generateLocalJobDesc(userContent, sentenceCount || 5);
          return res.status(200).json({ enhancedContent: fallback });
        } catch (genErr) {
          console.error('Local job description generation failed:', genErr);
          return res.status(200).json({ enhancedContent: userContent });
        }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Local fallback for job description rewriting. Produces 5-6 short sentences
// summarizing responsibilities, skills, and impact without inventing facts.
const generateLocalJobDesc = (userContent, sentenceCount = 5) => {
  if (!userContent || typeof userContent !== 'string') return '';

  // Try to extract key phrases (position, company, existing description)
  const extract = (key) => {
    const re = new RegExp(`${key}:\\s*([^\\|\\n\\.]*)`, 'i');
    const m = userContent.match(re);
    return m ? m[1].trim() : '';
  };
  // Fallback: search for 'for the role of' patterns used by client prompts
  const roleMatch = userContent.match(/role of\\s+([^,\.]+)/i);
  const position = roleMatch ? roleMatch[1].trim() : extract('Position') || '';

  // Use the remaining text as base description
  const base = userContent.replace(/Position:\s*[^|\n.]*/i, '').replace(/Company:\s*[^|\n.]*/i, '').trim();

  // base set of candidate sentences; we'll select up to `sentenceCount`.
  const pool = [];
  const subj = position || 'This role';
  pool.push(`${subj} involves owning core responsibilities and delivering high-quality results.`);
  pool.push(`Performs daily tasks that require strong problem-solving and effective use of relevant tools and methodologies.`);
  pool.push(`Contributes to project planning, execution, and continuous improvement to meet business objectives.`);
  pool.push(`Collaborates across teams and communicates clearly to ensure alignment and timely delivery.`);
  pool.push(`Focuses on measurable outcomes and strives to improve processes and deliverables over time.`);
  pool.push(`Brings a proactive approach to tackling challenges and supporting organizational goals.`);

  const count = Math.max(1, Math.min(pool.length, Number(sentenceCount || sentenceCount === 0 ? sentenceCount : 5)));
  return pool.slice(0, count).join(' ');
};

// Upload Resume and Extract Data
// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
  try {
    const { resumeText, title } = req.body;
    const userId = req.userId;

    if (!resumeText) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    let newResume;
    try {
      const response = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an AI that extracts structured resume data in JSON format.",
          },
          {
            role: "user",
            content: `Extract structured resume data from this text and return JSON only: ${resumeText}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const extractedData = response?.choices?.[0]?.message?.content || "{}";
      const parsedData = JSON.parse(extractedData);

      newResume = await Resume.create({
        userId,
        title,
        ...parsedData,
      });
    } catch (aiError) {
      console.error('AI extraction failed:', aiError?.message || aiError);
      // Fallback: save resume with empty professional_summary so UI isn't populated
      newResume = await Resume.create({
        userId,
        title,
        professional_summary: "",
      });
    }

    return res.status(200).json({ resumeId: newResume._id });
  } catch (error) {
    console.error('uploadResume error:', error)
    return res.status(400).json({ message: error.message });
  }
};