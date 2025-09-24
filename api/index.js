const { Telegraf } = require("telegraf");
const axios = require("axios");
const FormData = require("form-data");

// Token bot dari environment (Vercel)
const bot = new Telegraf(process.env.BOT_TOKEN);

// API Key remove.bg dari environment (Vercel)
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

// ===== Command /start =====
bot.start((ctx) => {
  const welcomeMessage = `Halo! Saya adalah bot dengan tiga fitur utama:

- 🖼️ **Membuat Gambar**: Kirim perintah /gambar diikuti dengan deskripsi.
  Contoh: /gambar seekor kucing di luar angkasa

- ✂️ **Menghapus Background**: Kirimkan saya sebuah foto, dan saya akan menghapus background-nya.

- 🎬 **Membuat Video**: Kirim perintah /video diikuti dengan deskripsi.
  Contoh: /video robot menari di luar angkasa

Silakan coba salah satu fitur di atas!`;
  ctx.reply(welcomeMessage);
});

// ===== Command /gambar =====
bot.command("gambar", async (ctx) => {
  const prompt = ctx.message.text.substring("/gambar ".length).trim();
  if (!prompt) {
    return ctx.reply(
      "Tolong berikan deskripsi gambar. Contoh: /gambar seekor kucing di luar angkasa"
    );
  }

  try {
    ctx.reply("Memproses permintaan Anda. Mohon tunggu sebentar...");

    const response = await axios.get(
      `https://zaikyoov3.onrender.com/api/imagen3?prompt=${encodeURIComponent(
        prompt
      )}`,
      { responseType: "arraybuffer" }
    );

    const imageBuffer = Buffer.from(response.data, "binary");
    await ctx.telegram.sendPhoto(ctx.chat.id, { source: imageBuffer });

    console.log(`Gambar berhasil dikirim untuk prompt: "${prompt}"`);
  } catch (error) {
    console.error("Terjadi kesalahan:", error.message);
    ctx.reply("❌ Maaf, terjadi kesalahan saat membuat gambar.");
  }
});

// ===== Command /video =====
bot.command("video", async (ctx) => {
    const prompt = ctx.message.text.substring("/video ".length).trim();
    if (!prompt) {
      return ctx.reply("Tolong berikan deskripsi video. Contoh: /video robot menari di luar angkasa");
    }

    try {
      ctx.reply("Memproses permintaan Anda. Mohon tunggu, proses ini mungkin memakan waktu beberapa menit...");

      // Mengirim permintaan ke API video
      const response = await axios.get(`https://zaikyoov3.onrender.com/api/hailuo01?prompt=${encodeURIComponent(prompt)}&expandPrompt=${encodeURIComponent(prompt)}`);
      
      const videoData = response.data;
      if (videoData.status === "completed" && videoData.output && videoData.output.length > 0) {
          const videoUrl = videoData.output[0];
          ctx.reply(`✅ Video berhasil dibuat!\n\nLink Video: ${videoUrl}`);
      } else {
          ctx.reply("⚠️ Maaf, video gagal dibuat. Coba lagi dengan deskripsi yang berbeda.");
      }

      console.log(`Video berhasil dibuat untuk prompt: "${prompt}"`);
    } catch (error) {
      console.error("Terjadi kesalahan:", error.message);
      ctx.reply("❌ Maaf, terjadi kesalahan saat membuat video.");
    }
});

// ===== Handler photo (hapus background) =====
bot.on("photo", async (ctx) => {
  try {
    const photo = ctx.message.photo.pop();
    const fileId = photo.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    await ctx.reply("Memproses gambar Anda. Mohon tunggu sebentar...");

    const form = new FormData();
    form.append("image_url", fileLink.href);
    form.append("size", "auto");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-Api-Key": REMOVE_BG_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    const contentType = (response.headers["content-type"] || "").toLowerCase();

    if (!contentType.includes("image/")) {
      const text = Buffer.from(response.data).toString("utf8");
      let errorMsg = "Terjadi kesalahan tidak diketahui.";
      try {
        const json = JSON.parse(text);
        if (json.errors && json.errors.length > 0) {
          const err = json.errors[0];
          errorMsg = `${err.title}: ${err.detail}`;
        }
      } catch (e) {
        errorMsg = text;
      }

      console.error("remove.bg error:", errorMsg);
      return ctx.reply(`❌ Gagal menghapus background.\nAlasan: ${errorMsg}`);
    }

    const imageBuffer = Buffer.from(response.data, "binary");
    console.log("Ukuran file hasil remove.bg:", imageBuffer.length, "bytes");

    await ctx.telegram.sendDocument(
      ctx.chat.id,
      {
        source: imageBuffer,
        filename: "no-bg.png",
      },
      { caption: "✅ Background berhasil dihapus (resolusi auto)!" }
    );
  } catch (error) {
    console.error("Kesalahan:", error);
    ctx.reply("⚠️ Maaf, terjadi kesalahan saat memproses gambar.");
  }
});

// ===== Export untuk Vercel =====
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error saat memproses update:", error);
    res.status(500).send("Internal Server Error");
  }
};