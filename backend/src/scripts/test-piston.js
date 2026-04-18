import { executeCode } from "../services/piston.service.js";

async function test() {
  console.log("Testing Piston Integration...");
  
  const sourceCode = `
const a = 5;
const b = 10;
console.log(a + b);
  `;
  const language = "javascript";
  const expectedOutput = "15";

  try {
    const result = await executeCode(sourceCode, language, "", expectedOutput);
    console.log("Result:", JSON.stringify(result, null, 2));
    
    if (result.status.id === 3) {
      console.log("SUCCESS: Piston evaluated correctly!");
    } else {
      console.log("FAILED: Unexpected status ID", result.status.id);
    }
  } catch (err) {
    console.error("ERROR during test:", err.message);
  }
}

test();
