import axios from "axios";

async function test() {
  const url = "https://piston.engineer/api/v2/execute";
  const body = {
    language: "js",
    version: "18.15.0",
    files: [{ content: "console.log(1+2)" }]
  };

  try {
    const res = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}

test();
