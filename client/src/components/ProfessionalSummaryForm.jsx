import { Loader2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";

const ProfessionalSummaryForm = ({ data, onChange, resumeData }) => {
  const { token } = useSelector((state) => state.auth);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    try {
      setIsGenerating(true);

      // Build context from resumeData when available
      const contextParts = [];
      if (resumeData?.title) contextParts.push(`Title: ${resumeData.title}`);
      if (resumeData?.personal_info?.profession)
        contextParts.push(`Profession: ${resumeData.personal_info.profession}`);
      if (resumeData?.skills?.length)
        contextParts.push(`Skills: ${resumeData.skills.join(", ")}`);
      if (resumeData?.experience?.length) {
        const ex = resumeData.experience
          .slice(0, 3)
          .map(
            (e) => `${e.position || e.title || ""} at ${e.company || ""}`
          )
          .join("; ");
        if (ex) contextParts.push(`Experience: ${ex}`);
      }

      const context = contextParts.join(" | ") || "";
      const current = (data || "").trim();

      
      const userContent = context ? `Context: ${context}. CurrentSummary: "${current}"` : `CurrentSummary: "${current}"`;

      const response = await api.post(
        "/api/ai/enhance-pro-sum",
        { userContent, createIfEmpty: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const enhanced = response?.data?.enhancedContent ?? "";

      // If AI returned nothing useful, don't overwrite the user's text.
      if (!enhanced || enhanced.trim().length < 20) {
        console.error("AI enhancement failed or returned too-short content:", response?.data);
        toast.error("AI service unavailable — please try again later.");
        return;
      }

      // If AI returned exactly the same userContent (echo) or exactly the same summary, do not replace.
      if (enhanced.trim() === userContent.trim() || enhanced.trim() === current.trim()) {
        console.error("AI returned echoed or identical content:", enhanced);
        toast("AI did not provide a usable enhancement");
        return;
      }

      onChange(enhanced);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Professional Summary
          </h3>

          <p className="text-sm text-gray-500">Add summary for your resume here</p>
        </div>

        <button
          disabled={isGenerating}
          onClick={generateSummary}
          type="button"
          className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? "Enhancing..." : "AI Enhance"}
        </button>
      </div>

      <div className="mt-6 w-full">
        <textarea
          value={data || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={7}
          className="w-full p-3 px-4 mt-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none break-words whitespace-pre-wrap overflow-hidden"
          placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
        />

        <p className="text-xs text-gray-500 max-w-[80%] mx-auto text-center mt-2">
          Tips: Keep it concise (3–4 sentences) and focus on your most relevant
          achievements and skills.
        </p>
      </div>
    </div>
  );
};

export default ProfessionalSummaryForm;