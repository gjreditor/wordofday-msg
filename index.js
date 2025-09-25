import fetch from "node-fetch";

const WORDNIK_KEY = process.env.WORDNIK_KEY;
const GREEN_ID = process.env.GREEN_ID;
const GREEN_TOKEN = process.env.GREEN_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

async function getWordOfTheDay() {
  const res = await fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${WORDNIK_KEY}`);
  const data = await res.json();
  return {
    word: data.word,
    definition: data.definitions?.[0]?.text || "No definition available."
  };
}

async function generateTTS(text) {
  const res = await fetch("https://poppop.ai/api/ai_speech/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      voice: "Amy",
      text: text
    })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (chunk.includes("event: success")) {
      const match = chunk.match(/data:\s*(\{.*\})/);
      if (match) {
        const data = JSON.parse(match[1]);
        return data.url;
      }
    }
  }
  return null;
}

async function sendToWhatsApp(url) {
  await fetch(`https://api.green-api.com/waInstance${GREEN_ID}/sendFileByUrl/${GREEN_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: GROUP_ID,
      urlFile: url,
      fileName: "word_of_the_day.mp3",
      caption: "Word of the Day"
    })
  });
}

(async () => {
  try {
    const { word, definition } = await getWordOfTheDay();
    const text = `Today's word is ${word}. It means: ${definition}`;
    console.log("Generating TTS for:", text);

    const mp3Url = await generateTTS(text);
    if (!mp3Url) throw new Error("TTS failed");

    console.log("Sending to WhatsApp...");
    await sendToWhatsApp(mp3Url);

    console.log("Done!");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
