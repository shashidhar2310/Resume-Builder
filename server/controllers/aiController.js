import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// Enhance Professional Summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in resume writing. Enhance the professional summary in 1-2 sentences highlighting key skills, experience, and career goals. Make it ATS friendly. Return only the text.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const enhancedContent =
      response?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ enhancedContent });
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

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Improve the job description in 1-2 sentences highlighting responsibilities and achievements using action verbs. Return only text.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const enhancedContent =
      response?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
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

    const extractedData =
      response?.choices?.[0]?.message?.content || "{}";

    const parsedData = JSON.parse(extractedData);

    const newResume = await Resume.create({
      userId,
      title,
      ...parsedData,
    });

    return res.status(200).json({ resumeId: newResume._id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};