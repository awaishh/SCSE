import axios from "axios";

async function test() {
  const url = "https://ce.judge0.com/submissions?base64_encoded=true&wait=true";
  const body = {
    source_code: Buffer.from("console.log(1+2)").toString("base64"),
    language_id: 93,
  };

  try {
    const res = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Judge0 Public Error:", err.message);
  }
}

test();
