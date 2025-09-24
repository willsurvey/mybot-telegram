const { Telegraf } = require('telegraf');
const axios = require('axios');

// Mengambil token bot dari variabel lingkungan Vercel
const bot = new Telegraf(process.env.BOT_TOKEN);

// Menanggapi perintah /start
bot.start((ctx) => ctx.reply('Halo! Kirimkan saya deskripsi gambar diawali dengan /gambar. Contoh: /gambar seekor kucing di luar angkasa'));

// Menangani perintah /gambar diikuti oleh teks
bot.command('gambar', async (ctx) => {
    // Memeriksa apakah ada teks setelah perintah
    const prompt = ctx.message.text.substring('/gambar '.length).trim();
    if (!prompt) {
        return ctx.reply('Tolong berikan deskripsi gambar. Contoh: /gambar seekor kucing di luar angkasa');
    }

    try {
        ctx.reply('Memproses permintaan Anda. Mohon tunggu sebentar...');

        // Mengirim permintaan ke API eksternal untuk mendapatkan gambar.
        // encodeURIComponent() memastikan teks aman untuk URL, mengatasi karakter khusus seperti koma atau titik.
        const response = await axios.get(`https://zaikyoov3.onrender.com/api/imagen3?prompt=${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer' // Mengatur respons ke format biner
        });

        // Mengambil buffer gambar dari respons
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Mengirim gambar kembali ke pengguna di Telegram
        await ctx.telegram.sendPhoto(ctx.chat.id, { source: imageBuffer });
        
        console.log(`Gambar berhasil dikirim untuk prompt: "${prompt}"`);

    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
        ctx.reply('Maaf, terjadi kesalahan saat membuat gambar.');
    }
});

// Ini adalah fungsi utama yang akan dieksekusi oleh Vercel
// untuk memproses setiap webhook yang masuk dari Telegram
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error saat memproses update:', error);
    res.status(500).send('Internal Server Error');
  }
};