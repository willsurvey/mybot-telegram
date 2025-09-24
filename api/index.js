const { Telegraf } = require('telegraf');

// Mengambil token bot dari variabel lingkungan Vercel
const bot = new Telegraf(process.env.BOT_TOKEN);

// Menanggapi perintah /start
bot.start((ctx) => ctx.reply('Selamat datang! Kirimkan saya pesan apa pun.'));

// Menanggapi setiap pesan teks
bot.on('text', (ctx) => {
    const userMessage = ctx.message.text;
    ctx.reply(`Anda mengirim: ${userMessage}`);
});

// Ini adalah fungsi utama yang akan dieksekusi oleh Vercel
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error saat memproses update:', error);
    res.status(500).send('Internal Server Error');
  }
};
