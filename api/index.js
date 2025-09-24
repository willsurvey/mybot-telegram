import { Telegraf } from "telegraf";
import axios from "axios";
import fs from "fs";

// === Ganti dengan token bot kamu ===
const bot = new Telegraf("BOT_TOKEN");

// ===== Command /start =====
bot.start((ctx) => {
  ctx.reply(
    "👋 Halo! Saya siap membantu.\n\n" +
      "✨ Fitur yang tersedia:\n" +
      "🖼️ /gambar <prompt> → Buat gambar dari teks\n" +
      "🗑️ /removebg (kirim foto dengan caption ini) → Hapus background foto\n" +
      "🎬 /video <prompt> → Buat video dari teks"
  );
});

// ===== Command /gambar =====
bot.command("gambar", async (ctx) => {
  const prompt = ctx.message.text.substring("/gambar ".length).trim();
  if (!prompt) {
    return ctx.reply(
      "Tolong berikan deskripsi gambar. Contoh: /gambar seekor kucing memakai kacamata"
    );
  }

  try {
    ctx.reply("🖼️ Sedang membuat gambar...");

    const response = await axios.get(
      `https://zaikyoov3.onrender.com/api/can_gpt_blackbox?prompt=${encodeURIComponent(
        prompt
      )}`
    );

    const data = response.data;
    if (data.status === "completed" && data.output && data.output.length > 0) {
      const imageUrl = data.output[0];
      await ctx.replyWithPhoto(
        { url: imageUrl },
        { caption: `✅ Gambar selesai dibuat!\nPrompt: ${prompt}` }
      );
    } else {
      ctx.reply("❌ Gagal membuat gambar, coba lagi nanti.");
    }
  } catch (error) {
    console.error("Error /gambar:", error.message);
    ctx.reply("⚠️ Terjadi kesalahan saat membuat gambar.");
  }
});

// ===== Command /removebg =====
bot.command("removebg", async (ctx) => {
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply(
      "📌 Gunakan perintah ini dengan cara reply ke sebuah foto.\nContoh:\n/rebg (reply ke foto)"
    );
  }

  try {
    const fileId =
      ctx.message.reply_to_message.photo[
        ctx.message.reply_to_message.photo.length - 1
      ].file_id;

    const fileLink = await ctx.telegram.getFileLink(fileId);

    ctx.reply("⏳ Menghapus background, mohon tunggu...");

    const response = await axios({
      method: "POST",
      url: "https://api.remove.bg/v1.0/removebg",
      data: {
        image_url: fileLink.href,
        size: "auto",
      },
      headers: {
        "X-Api-Key": "REMOVE_BG_API_KEY",
      },
      responseType: "arraybuffer",
    });

    const outputPath = "no-bg.png";
    fs.writeFileSync(outputPath, response.data);

    await ctx.replyWithDocument({ source: outputPath });
    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error("Error /removebg:", error.response?.data || error.message);
    ctx.reply("❌ Gagal menghapus background. Coba lagi.");
  }
});

// ===== Command /video =====
bot.command("video", async (ctx) => {
  const prompt = ctx.message.text.substring("/video ".length).trim();
  if (!prompt) {
    return ctx.reply(
      "Tolong berikan deskripsi video. Contoh: /video seekor kucing menari di luar angkasa"
    );
  }

  try {
    ctx.reply("🎬 Sedang membuat video, mohon tunggu...");

    const response = await axios.get(
      `https://zaikyoov3.onrender.com/api/hailuo01?prompt=${encodeURIComponent(
        prompt
      )}&expandPrompt=${encodeURIComponent(prompt)}`
    );

    const data = response.data;
    if (data.status === "completed" && data.output && data.output.length > 0) {
      const videoUrl = data.output[0];
      await ctx.replyWithVideo(
        { url: videoUrl },
        { caption: `✅ Video selesai dibuat!\nPrompt: ${prompt}` }
      );
    } else {
      ctx.reply("❌ Gagal membuat video, coba lagi nanti.");
    }
  } catch (error) {
    console.error("Error /video:", error.message);
    ctx.reply("⚠️ Terjadi kesalahan saat membuat video.");
  }
});

// ===== Jalankan bot =====
bot.launch();
console.log("🚀 Bot sedang berjalan...");
