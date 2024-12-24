import React, { useState } from "react";
import { getSummary, getAdvice } from "../utils/api";
import "../styles/Insights.css";

interface InsightsProps {
  userId: string;
  goal: string;
  setGoal: React.Dispatch<React.SetStateAction<string>>;
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
  advice: string;
  setAdvice: React.Dispatch<React.SetStateAction<string>>;
  loading: { summary: boolean; advice: boolean };
  setLoading: React.Dispatch<
    React.SetStateAction<{ summary: boolean; advice: boolean }>
  >;
  error: { summary: string; advice: string };
  setError: React.Dispatch<
    React.SetStateAction<{ summary: string; advice: string }>
  >;
}

const HOST = "http://localhost:3232";

const Insights: React.FC<InsightsProps> = ({
  userId,
  goal,
  setGoal,
  summary,
  setSummary,
  advice,
  setAdvice,
  loading,
  setLoading,
  error,
  setError,
}) => {
  // const [goal, setGoal] = useState("");
  // const [summary, setSummary] = useState("");
  // const [advice, setAdvice] = useState("");
  // const [loading, setLoading] = useState({ summary: false, advice: false });
  // const [error, setError] = useState({ summary: "", advice: "" });

  const handleGenerateSummary = async () => {
    setLoading((prev) => ({ ...prev, summary: true }));
    setError((prev) => ({ ...prev, summary: "" }));
    try {
      const data = await getSummary(userId);

      if (data.response_type === "success") {
        setSummary(data.summary);
      } else {
        setError((prev) => ({
          ...prev,
          summary: data.error || "Failed to generate summary",
        }));
      }
    } catch (err) {
      console.error("Error generating summary:", err);
      setError((prev) => ({ ...prev, summary: "Failed to generate summary" }));
    }
    setLoading((prev) => ({ ...prev, summary: false }));
  };

  const handleGetAdvice = async () => {
    if (!goal.trim()) {
      setError((prev) => ({ ...prev, advice: "Please enter a goal" }));
      return;
    }

    setLoading((prev) => ({ ...prev, advice: true }));
    setError((prev) => ({ ...prev, advice: "" }));
    try {
      const data = await getAdvice(userId, goal);

      if (data.response_type === "success") {
        setAdvice(data.advice);
      } else {
        setError((prev) => ({
          ...prev,
          advice: data.error || "Failed to get advice",
        }));
      }
    } catch (err) {
      console.error("Error getting advice:", err);
      setError((prev) => ({ ...prev, advice: "Failed to get advice" }));
    }
    setLoading((prev) => ({ ...prev, advice: false }));
  };

  return (
    <div className="container">
      {/* Left side: Summarize Spending Section */}
      <div className="left-column">
        <h2 className="section-title">🌱 Summarize Spending 🌱</h2>
        <p className="section-description">
          Get a detailed overview of your spending patterns and trends.
        </p>
        <button
          onClick={handleGenerateSummary}
          disabled={loading.summary}
          className="button"
          style={{ opacity: loading.summary ? 0.7 : 1 }}
        >
          {loading.summary ? "Generating..." : "Generate Summary"}
        </button>

        {error.summary && <p className="error-message">{error.summary}</p>}

        {summary && (
          <div className="summary">
            <p>{summary}</p>
          </div>
        )}
      </div>

      {/* Right side: Get Personalized Advice Section */}
      <div className="right-column">
        <h2 className="section-title">🌱 Get Personalized Advice 🌱</h2>
        <p className="section-description">
          Enter your financial goals and priorities below. Note that a more
          specific description will yield a more specific response.
        </p>
        <div>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Save $5000 for a vacation in 6 months"
            className="input-field"
          />
          <button
            onClick={handleGetAdvice}
            disabled={loading.advice}
            className="button"
            style={{ opacity: loading.advice ? 0.7 : 1 }}
          >
            {loading.advice ? "Getting Advice..." : "Get Advice"}
          </button>

          {error.advice && <p className="error-message">{error.advice}</p>}

          {advice && (
            <div className="advice">
              <p>{advice}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;
