import { Telegraf } from "telegraf";
import axios from "axios";
import fs from "fs";

const bot = new Telegraf(process.env.BOT_TOKEN);
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

// === Command /start ===
bot.start((ctx) => {
  ctx.reply(
    "👋 Halo! Saya siap membantu.\n\n" +
      "✨ Fitur yang tersedia:\n" +
      "🖼️ /gambar <prompt> → Buat gambar\n" +
      "🗑️ (reply foto dengan /removebg) → Hapus background\n" +
      "🎬 /video <prompt> → Buat video"
  );
});

// === Command /gambar ===
bot.command("gambar", async (ctx) => {
  const prompt = ctx.message.text.substring("/gambar ".length).trim();
  if (!prompt) return ctx.reply("❗ Contoh: /gambar kucing lucu di angkasa");

  try {
    ctx.reply("🖼️ Sedang membuat gambar...");

    const { data } = await axios.get(
      `https://zaikyoov3.onrender.com/api/can_gpt_blackbox?prompt=${encodeURIComponent(prompt)}`
    );

    if (data.status === "completed" && data.output?.length > 0) {
      await ctx.replyWithPhoto({ url: data.output[0] }, { caption: `✅ Prompt: ${prompt}` });
    } else {
      ctx.reply("❌ Gagal membuat gambar.");
    }
  } catch (e) {
    console.error("Error /gambar:", e.message);
    ctx.reply("⚠️ Terjadi kesalahan.");
  }
});

// === Command /removebg ===
bot.command("removebg", async (ctx) => {
  if (!ctx.message.reply_to_message?.photo) {
    return ctx.reply("📌 Gunakan perintah ini dengan cara reply ke foto.");
  }

  try {
    const photo = ctx.message.reply_to_message.photo.pop();
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    ctx.reply("⏳ Menghapus background...");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      { image_url: fileLink.href, size: "auto" },
      {
        headers: { "X-Api-Key": REMOVE_BG_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const filePath = "/tmp/no-bg.png";
    fs.writeFileSync(filePath, response.data);

    await ctx.replyWithDocument({ source: filePath, filename: "no-bg.png" });
    fs.unlinkSync(filePath);
  } catch (e) {
    console.error("Error /removebg:", e.response?.data || e.message);
    ctx.reply("❌ Gagal hapus background.");
  }
});

// === Command /video ===
bot.command("video", async (ctx) => {
  const prompt = ctx.message.text.substring("/video ".length).trim();
  if (!prompt) return ctx.reply("❗ Contoh: /video kucing menari di angkasa");

  try {
    ctx.reply("🎬 Membuat video...");

    const { data } = await axios.get(
      `https://zaikyoov3.onrender.com/api/hailuo01?prompt=${encodeURIComponent(prompt)}&expandPrompt=${encodeURIComponent(prompt)}`
    );

    if (data.status === "completed" && data.output?.length > 0) {
      await ctx.replyWithVideo({ url: data.output[0] }, { caption: `✅ Prompt: ${prompt}` });
    } else {
      ctx.reply("❌ Gagal membuat video.");
    }
  } catch (e) {
    console.error("Error /video:", e.message);
    ctx.reply("⚠️ Terjadi kesalahan.");
  }
});

// === Export untuk Vercel ===
export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body, res);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Internal Server Error");
  }
}
