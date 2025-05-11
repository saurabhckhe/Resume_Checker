import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import { matchKeywords } from "../utils/matchKeywords";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

const jobRoles = {
  "---Choose Role---":[],
  "Frontend Developer": ["html", "css", "javascript", "react.js"],
  "Backend Developer": ["node.js", "express", "mongodb", "sql"],
  "Full Stack Developer": ["react.js", "node.js", "express", "sql", "java"],
};

export default function ResumeSkillChecker() {
  const [fileName, setFileName] = useState("");
  const [pdfData, setPdfData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [customSkills, setCustomSkills] = useState("");
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const typedarray = new Uint8Array(reader.result);
      setPdfData(typedarray);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleScan = async () => {
    if (!pdfData) return;

    const skillsArray = customSkills.trim()
      ? customSkills.split(",").map((s) => s.trim().toLowerCase())
      : jobRoles[selectedRole];

    if (!skillsArray || skillsArray.length === 0) {
      alert("Please enter at least one skill or select a job role.");
      return;
    }

    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      text += strings.join(" ");
    }

    const result = matchKeywords(text, skillsArray);
    setMatchResult(result);
  };

  const handleClear = () => {
    setFileName("");
    setPdfData(null);
    setMatchResult(null);
    setSelectedRole("");
    setCustomSkills("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🎯 Resume Skill Checker
        </h1>

        {/* Job Role Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Job Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.keys(jobRoles).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Skills Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or Enter Custom skills (comma-separated):
          </label>
          <input
            type="text"
            placeholder="e.g. react, node, Sql"
            value={customSkills}
            onChange={(e) => setCustomSkills(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upload Box */}
        <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors mb-4">
          <label className="block text-center cursor-pointer">
            <span className="text-gray-600 text-sm font-medium">
              Click to upload or drag a PDF file here
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded File Info */}
        {fileName && (
          <p className="text-sm text-center text-gray-700 mb-4">
            ✅ Uploaded: <span className="font-medium">{fileName}</span>
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleScan}
            disabled={!pdfData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Scan Resume
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-lg text-sm font-medium"
          >
            Clear
          </button>
        </div>

        {/* Match Result */}
        {matchResult && (
          <div className="mt-4">
            <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-4 bg-green-500 transition-all duration-500"
                style={{ width: `${matchResult.percentage}%` }}
              ></div>
            </div>
            <p className="mt-2 text-center text-xl font-semibold text-gray-800">
              Match Score: {matchResult.percentage}%
            </p>
            <p className="text-center text-sm mt-1 text-gray-600">
              Matched keywords:
              <span className="text-blue-600 font-medium ml-1">
                {matchResult.matched.length > 0 ? matchResult.matched.join(", ") : "None"}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
