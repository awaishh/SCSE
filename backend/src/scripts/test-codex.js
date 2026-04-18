import axios from "axios";

async function test() {
  const url = "https://api.codex.jaagrav.in";
  const body = {
    language: "js",
    code: "console.log(1+2)"
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
