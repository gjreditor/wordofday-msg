// index.js
// Node 18+ (GitHub Actions uses Node 20) — uses global fetch

const WORDNIK_KEY = process.env.WORDNIK_KEY; // required
const GREEN_ID = process.env.GREEN_ID;
const GREEN_TOKEN = process.env.GREEN_TOKEN;
const GROUP_IDS = process.env.GROUP_ID; // comma-separated, e.g. "123456@g.us,987654@g.us"

if (!GREEN_ID || !GREEN_TOKEN || !GROUP_IDS) {
  console.error("Missing GREEN_ID, GREEN_TOKEN or GROUP_IDS in env");
  process.exit(1);
}

async function getWordOfTheDay() {
  if (!WORDNIK_KEY) throw new Error("WORDNIK_KEY not set");

  try {
    const r = await fetch(
      `https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${WORDNIK_KEY}`
    );
    if (!r.ok) throw new Error(`Wordnik response not OK: ${r.status}`);

    const data = await r.json();
    const definition = data.definitions?.[0]?.text || "No definition available.";
    const example = data.examples?.[0]?.text || "No example sentence available.";
    return { word: data.word, definition, example };
  } catch (e) {
    throw new Error(`Wordnik fetch failed: ${e.message}`);
  }
}

async function sendTextToWhatsApp(chatId, message) {
  const url = `https://api.green-api.com/waInstance${GREEN_ID}/sendMessage/${GREEN_TOKEN}`;
  const body = { chatId, message };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let j;
  try {
    j = await res.json();
  } catch (e) {
    j = null;
  }

  if (!res.ok) {
    throw new Error(`Green API failed: ${res.status} ${JSON.stringify(j)}`);
  }
  return j;
}

(async () => {
  try {
    const { word, definition, example } = await getWordOfTheDay();

    const message = `📚 *Word of the Day*\n\n*${word}*\n\n📖 Definition: ${definition}\n\n✍️ Example: ${example}`;

    console.log("Prepared message:\n", message);

    const groups = GROUP_IDS.split(",").map((g) => g.trim());
    for (const groupId of groups) {
      console.log(`Sending to group ${groupId}...`);
      const result = await sendTextToWhatsApp(groupId, message);
      console.log("Sent. Green API response:", result);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
})();

