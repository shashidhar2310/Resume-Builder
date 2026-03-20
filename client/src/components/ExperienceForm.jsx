import { Plus, Briefcase, Trash2, Sparkles, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";

const ExperienceForm = ({ data, onChange, resumeData }) => {

  const { token } = useSelector(state => state.auth)
  const [generatingIndex, setGeneratingIndex] = useState(-1)

  const addExperience = () => {
    const newExperience = {
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      description: "",
      is_current: false
    };

    onChange([...data, newExperience]);
  };

  const removeExperience = (index) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

   const generateDescription = async (index) => {
    setGeneratingIndex(index)
    const experience = data[index]
    // Build a natural-language prompt including the user's target profession when available.
    const target = resumeData?.personal_info?.profession || resumeData?.title || "the target role";
    const prompt = `Rewrite the following job description to align with the target role: ${target}. Improve clarity, emphasize responsibilities, skills, and measurable impact, and output a single paragraph of 5-6 sentences. Original description: ${experience.description || ""}`

    try {
    // Request exactly 5 sentences based on the professional summary and description
    const res = await api.post('/api/ai/enhance-job-desc', { userContent: prompt, sentenceCount: 5 }, { headers: { Authorization: `Bearer ${token}` } })
     const enhanced = res?.data?.enhancedContent || ""
     if (!enhanced || enhanced.trim().length < 10) {
       toast.error('AI enhancement returned no usable content')
     } else {
       updateExperience(index, "description", enhanced)
     }
    } catch (error) {
     toast.error(error?.response?.data?.message || error.message)
    } finally {
     setGeneratingIndex(-1)
    }
   }


  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Professional Experience
          </h3>
          <p className="text-sm text-gray-500">
            Add your job experience here
          </p>
        </div>

        <button
          onClick={addExperience}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          <Plus className="size-4" />
          Add Experience
        </button>
      </div>

      {/* Empty State */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No work experience added yet.</p>
          <p className="text-sm">Click "Add Experience" to get started.</p>
        </div>
      ) : (

        <div className="space-y-4">
          {data.map((experience, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >

              {/* Title */}
              <div className="flex justify-between items-start">
                <h4 className="font-medium">
                  Experience #{index + 1}
                </h4>

                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeExperience(index)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Inputs */}
              <div className="grid md:grid-cols-2 gap-3">

                <input
                  type="text"
                  placeholder="Company Name"
                  value={experience.company || ""}
                  onChange={(e) =>
                    updateExperience(index, "company", e.target.value)
                  }
                  className="px-3 py-2 text-sm border rounded-lg"
                />

                <input
                  type="text"
                  placeholder="Job Title"
                  value={experience.position || ""}
                  onChange={(e) =>
                    updateExperience(index, "position", e.target.value)
                  }
                  className="px-3 py-2 text-sm border rounded-lg"
                />

                <input
                  type="month"
                  value={experience.start_date || ""}
                  onChange={(e) =>
                    updateExperience(index, "start_date", e.target.value)
                  }
                  className="px-3 py-2 text-sm border rounded-lg"
                />

                <input
                  type="month"
                  disabled={experience.is_current}
                  value={experience.end_date || ""}
                  onChange={(e) =>
                    updateExperience(index, "end_date", e.target.value)
                  }
                  className="px-3 py-2 text-sm border rounded-lg disabled:bg-gray-100"
                />

              </div>

              {/* Current Job Checkbox */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={experience.is_current || false}
                  onChange={(e) =>
                    updateExperience(index, "is_current", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-sm text-gray-700">
                  I am currently working here
                </span>
              </label>

              {/* Description */}
              <div className="space-y-2">

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Job Description
                  </label>

                  <button onClick={()=> generateDescription(index)} disabled={generatingIndex === index || !experience.position || !experience.company} className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-all disabled:opacity-50">
                    {generatingIndex === index ? (
                      <Loader2 className="w-3 h-3 animate-spin"/>
                    ): (
                      <Sparkles className="w-3 h-3" />
                    )}
                    
                    Enhance with AI
                  </button>
                </div>

                <textarea
                  value={experience.description || ""}
                  onChange={(e) =>
                    updateExperience(index, "description", e.target.value)
                  }
                  rows={4}
                  className="w-full text-sm px-3 py-2 border rounded-lg resize-none"
                  placeholder="Describe your key responsibilities and achievements..."
                />

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceForm;