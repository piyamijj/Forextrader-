const { schedule } = require('@netlify/functions');

const handler = async (event) => {
  try {
    // 1. Fiyat Verisi Al
    const oandaRes = await fetch(`https://api-fxpractice.oanda.com/v3/instruments/XAU_USD/candles?count=1&granularity=M15&price=M`, {
      headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}` }
    });
    const oandaData = await oandaRes.json();
    const goldPrice = oandaData.candles[0].mid.c;

    // 2. Gemini Karar Mekanizması
    const prompt = `LifeOs olarak Altın (${goldPrice}) için otonom karar ver. AL, SAT veya BEKLE demelisin. Kararın BEKLE değilse TP ve SL belirle. Yanıt sadece JSON olsun.`;
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const gData = await geminiRes.json();
    const decision = JSON.parse(gData.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim());

    // 3. Karar Uygulama ve Telegram Raporu
    if (decision.action !== "BEKLE") {
      const units = decision.action === "AL" ? 100 : -100;
      const orderBody = {
        order: {
          units: units.toString(),
          instrument: "XAU_USD",
          timeInForce: "FOK",
          type: "MARKET",
          takeProfitOnFill: { price: decision.tp.toString() },
          stopLossOnFill: { price: decision.sl.toString() }
        }
      };

      await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${process.env.OANDA_ACCOUNT_ID}/orders`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(orderBody)
      });

      // Telegram Kanalına Canlı Mesaj
      const msg = `🛡️ **LifeOs Otonom Operasyon**\n\nKarar: ${decision.action}\nFiyat: ${goldPrice}\nHedef: Çocuklar için yeni bir umut ışığı.`;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' })
      });
    }
    return { statusCode: 200 };
  } catch (e) { return { statusCode: 500 }; }
};

// Her 15 dakikada bir tetikleme
export const config = { schedule: "*/15 * * * *" };
exports.handler = handler;
