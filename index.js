// index.js
// Node 18+ (GitHub Actions uses Node 20) — uses global fetch

const WORDNIK_KEY = process.env.WORDNIK_KEY; // optional
const GREEN_ID = process.env.GREEN_ID;
const GREEN_TOKEN = process.env.GREEN_TOKEN;
const GROUP_ID = process.env.GROUP_ID; // e.g. 1234567890-123456@g.us

if (!GREEN_ID || !GREEN_TOKEN || !GROUP_ID) {
  console.error("Missing GREEN_ID, GREEN_TOKEN or GROUP_ID in env");
  process.exit(1);
}

async function getWordOfTheDay() {
  // Try Wordnik if key provided
  if (WORDNIK_KEY) {
    try {
      const r = await fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${WORDNIK_KEY}`);
      if (r.ok) {
        const data = await r.json();
        const definition = data.definitions?.[0]?.text || "No definition available.";
        return { word: data.word, definition };
      } else {
        console.warn("Wordnik response not OK, falling back:", r.status);
      }
    } catch (e) {
      console.warn("Wordnik fetch failed, falling back:", e.message);
    }
  }

async function sendTextToWhatsApp(message) {
  const url = `https://api.green-api.com/waInstance${GREEN_ID}/sendMessage/${GREEN_TOKEN}`;
  const body = { chatId: GROUP_ID, message };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let j;
  try { j = await res.json(); } catch(e){ j = null; }
  if (!res.ok) {
    throw new Error(`Green API failed: ${res.status} ${JSON.stringify(j)}`);
  }
  return j;
}

(async () => {
  try {
    const { word, definition } = await getWordOfTheDay();
    const message = `📚 Word of the Day:\n*${word}*\n\nDefinition: ${definition}`;
    console.log("Sending message:\n", message);

    const result = await sendTextToWhatsApp(message);
    console.log("Sent. Green API response:", result);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
})();


