import imagekit from "../configs/imageKit.js";
import Resume from "../models/Resume.js";
import fs from "fs";

// Create Resume
// POST: /api/resumes/create
export const createResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    const newResume = await Resume.create({ userId, title });

    return res.status(201).json({
      message: "Resume created successfully",
      resume: newResume,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Delete Resume
// DELETE: /api/resumes/:resumeId
export const deleteResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    await Resume.findOneAndDelete({ userId, _id: resumeId });

    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get Resume by ID
// GET: /api/resumes/:resumeId
export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const resume = await Resume.findOne({ userId, _id: resumeId });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Public Resume
// GET: /api/resumes/public/:resumeId
export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findOne({
      public: true,
      _id: resumeId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Update Resume
// PUT: /api/resumes/update
export const updateResume = async (req, res) => {
  try {
    const userId = req.userId;

    const { resumeId, resumeData, removeBackground } = req.body;

    const image = req.file;

    // Normalize resumeData into an object safely
    let resumeDataCopy = {};
    if (resumeData) {
      if (typeof resumeData === 'string') {
        try {
          resumeDataCopy = JSON.parse(resumeData);
        } catch (err) {
          return res.status(400).json({ message: 'Invalid resumeData JSON' });
        }
      } else if (typeof structuredClone === 'function') {
        try {
          resumeDataCopy = structuredClone(resumeData);
        } catch (err) {
          // fallback to safe clone
          resumeDataCopy = JSON.parse(JSON.stringify(resumeData));
        }
      } else {
        resumeDataCopy = JSON.parse(JSON.stringify(resumeData));
      }
    }

    if (image) {
      const imageBufferData = fs.createReadStream(image.path);

      const response = await imagekit.files.upload({
        file: imageBufferData,
        fileName: "resume.png",
        folder: "user-resumes",
      });

      resumeDataCopy.personal_info.image = response.url;
    }

    const resume = await Resume.findOneAndUpdate(
      { userId, _id: resumeId },
      resumeDataCopy,
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.status(200).json({
      message: "Saved successfully",
      resume,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};