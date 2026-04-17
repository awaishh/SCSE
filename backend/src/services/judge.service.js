const JUDGE0_URL = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

const LANGUAGE_IDS = {
  javascript: 63, // Node.js
  python: 71,     // Python 3
  cpp: 54,        // C++ (GCC)
  java: 62,       // Java
  c: 50,          // C
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);

/**
 * Executes code using Judge0 API
 * @param {string} sourceCode 
 * @param {string} language 
 * @param {string} stdin - Expected input for the test case
 * @param {string} expectedOutput - Expected output for the test case
 */
export const executeCode = async (sourceCode, language, stdin = "", expectedOutput = "") => {
  const language_id = LANGUAGE_IDS[language];
  
  if (!language_id) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const payload = {
    source_code: sourceCode,
    language_id,
    stdin,
    expected_output: expectedOutput,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  if (RAPIDAPI_KEY) {
    headers["X-RapidAPI-Key"] = RAPIDAPI_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  try {
    // wait=true makes the request synchronous on Judge0 side
    const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Judge0 API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("ExecuteCode Error:", error);
    throw new Error("Failed to execute code on sandbox");
  }
};
