const { Telegraf } = require('telegraf');
const axios = require('axios');

// Mengambil token bot dari variabel lingkungan Vercel
const bot = new Telegraf(process.env.BOT_TOKEN);

// Mengambil kunci API remove.bg dari variabel lingkungan Vercel
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

// Menanggapi perintah /start
bot.start((ctx) => {
    const welcomeMessage = `Halo! Saya adalah bot dengan dua fitur utama:

- **Membuat Gambar**: Kirimkan saya perintah /gambar diikuti dengan deskripsi.
  Contoh: /gambar seekor kucing di luar angkasa

- **Menghapus Background**: Kirimkan saya sebuah foto, dan saya akan menghapus background-nya secara otomatis.

Silakan pilih salah satu fitur di atas!`;
    ctx.reply(welcomeMessage);
});

// Menangani perintah /gambar diikuti oleh teks
bot.command('gambar', async (ctx) => {
    const prompt = ctx.message.text.substring('/gambar '.length).trim();
    if (!prompt) {
        return ctx.reply('Tolong berikan deskripsi gambar. Contoh: /gambar seekor kucing di luar angkasa');
    }

    try {
        ctx.reply('Memproses permintaan Anda. Mohon tunggu sebentar...');
        const response = await axios.get(`https://zaikyoov3.onrender.com/api/imagen3?prompt=${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer'
        });
        const imageBuffer = Buffer.from(response.data, 'binary');
        await ctx.telegram.sendPhoto(ctx.chat.id, { source: imageBuffer });
        
        console.log(`Gambar berhasil dikirim untuk prompt: "${prompt}"`);

    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
        ctx.reply('Maaf, terjadi kesalahan saat membuat gambar.');
    }
});

// Menggunakan bot.on('photo') untuk mendengarkan pesan yang berisi foto
bot.on('photo', async (ctx) => {
    try {
        const photo = ctx.message.photo.pop();
        const fileId = photo.file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);

        ctx.reply('Memproses gambar Anda. Mohon tunggu sebentar...');

        const response = await axios.post(
            'https://api.remove.bg/v1.0/removebg',
            {
                image_url: fileLink.href,
                size: 'auto'
            },
            {
                headers: {
                    'X-Api-Key': REMOVE_BG_API_KEY,
                    'Accept': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json') && response.data.length < 1000) {
            const error = JSON.parse(response.data.toString());
            console.error('API Error:', error);
            return ctx.reply('Maaf, tidak dapat memproses gambar. Pastikan gambar jelas dan tidak terlalu besar.');
        }

        await ctx.telegram.sendPhoto(ctx.chat.id, { source: response.data }, { caption: 'Background berhasil dihapus!' });
        
    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
        ctx.reply('Maaf, terjadi kesalahan saat memproses gambar.');
    }
});

// Fungsi utama yang akan dieksekusi oleh Vercel
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error saat memproses update:', error);
    res.status(500).send('Internal Server Error');
  }
};