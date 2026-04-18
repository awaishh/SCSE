import axios from "axios";

/**
 * JUDGE0 — evaluates code using the Judge0 API via RapidAPI.
 */

export const SUPPORTED_LANGUAGES = ["javascript", "python", "cpp", "java", "c"];

// Judge0 Language IDs for RapidAPI
const LANGUAGE_ID_MAP = {
  javascript: 93, // Node.js 18.15.0
  python: 92,     // Python 3.11.2
  cpp: 75,        // C++ (GCC 11.4.0)
  java: 91,       // Java (JDK 17)
  c: 72,          // C (GCC 11.4.0)
};

const RAPID_API_HOST = "judge0-ce.p.rapidapi.com";

/**
 * Execute code using Judge0 API.
 * 
 * @param {string} sourceCode 
 * @param {string} language 
 * @param {string} stdin 
 * @param {string} expectedOutput 
 */
export const executeCode = async (sourceCode, language, stdin = "", expectedOutput = "") => {
  const languageId = LANGUAGE_ID_MAP[language];
  if (!languageId) {
    throw new Error(`Language ${language} is not supported by Judge0`);
  }

  // Rotate between keys to balance load
  const keys = [process.env.JUDGE0_KEY1, process.env.JUDGE0_KEY].filter(Boolean);
  const apiKey = keys[Math.floor(Math.random() * keys.length)];

  if (!apiKey) {
    throw new Error("No Judge0 API key found in environment variables");
  }

  try {
    // 1. Submit the code
    const submissionResponse = await axios.post(
      `https://${RAPID_API_HOST}/submissions?base64_encoded=true&wait=false`,
      {
        source_code: Buffer.from(sourceCode).toString("base64"),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString("base64"),
        expected_output: Buffer.from(expectedOutput).toString("base64"),
      },
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPID_API_HOST,
          "Content-Type": "application/json",
        },
      }
    );

    const { token } = submissionResponse.data;
    if (!token) {
      throw new Error("Failed to get submission token from Judge0");
    }

    // 2. Poll for the result
    let result = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(
        `https://${RAPID_API_HOST}/submissions/${token}?base64_encoded=true`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": RAPID_API_HOST,
          },
        }
      );

      result = statusResponse.data;

      // Status IDs: 1 = In Queue, 2 = Processing
      if (result.status.id > 2) {
        break;
      }

      // Wait 1-2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;
    }

    if (!result || result.status.id <= 2) {
      throw new Error("Judge0 evaluation timed out");
    }

    // 3. Decode outputs
    const decode = (str) => (str ? Buffer.from(str, "base64").toString("utf-8") : null);

    return {
      status: { 
        id: result.status.id, 
        description: result.status.description 
      },
      stdout: decode(result.stdout),
      stderr: decode(result.stderr),
      compile_output: decode(result.compile_output),
      time: result.time,
      memory: result.memory,
      message: decode(result.message),
    };

  } catch (error) {
    console.error("[Judge0 Error]", error.response?.data || error.message);
    throw new Error(`Judge0 API Error: ${error.response?.data?.message || error.message}`);
  }
};
