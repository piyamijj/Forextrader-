const { schedule } = require('@netlify/functions');

const handler = async (event, context) => {
  try {
    // 1. Fiyatları Çek (XAU/USD örneği)
    const oandaRes = await fetch(`https://api-fxpractice.oanda.com/v3/instruments/XAU_USD/candles?count=1&granularity=M15&price=M`, {
      headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}` }
    });
    const oandaData = await oandaRes.json();
    const goldPrice = oandaData.candles[0].mid.c;

    // 2. Gemini'ye "LifeOs" Kimliğiyle Sor
    const prompt = `Sen LifeOs'sun. Görevin yetimlere yardım etmek. Altın fiyatı: ${goldPrice}. 
    Dünya haberlerini ve riskleri analiz et. AL, SAT veya BEKLE kararı ver. 
    Kararın AL veya SAT ise JSON formatında TP ve SL seviyelerini de ver.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const gData = await geminiRes.json();
    const analysis = JSON.parse(gData.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim());

    // 3. Karar "BEKLE" Değilse İşlemi Yap
    if (analysis.action !== "BEKLE") {
      const units = analysis.action === "AL" ? 100 : -100;
      const orderBody = {
        order: {
          units: units.toString(),
          instrument: "XAU_USD",
          timeInForce: "FOK",
          type: "MARKET",
          takeProfitOnFill: { price: analysis.tp.toString() },
          stopLossOnFill: { price: analysis.sl.toString() }
        }
      };

      const tradeRes = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${process.env.OANDA_ACCOUNT_ID}/orders`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(orderBody)
      });
      
      const tradeData = await tradeRes.json();
      
      // 4. Telegram'a Canlı Rapor ve Sohbet
      const message = `🛡️ **LifeOs Canlı Rapor**\n\n"${analysis.aiResponse}"\n\n✅ İşlem: ${analysis.action}\n💰 Fiyat: ${goldPrice}\n📍 Hedef: Yetim Evi`;
      
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT, text: message, parse_mode: 'Markdown' })
      });
    }

    return { statusCode: 200 };
  } catch (e) {
    console.error(e);
    return { statusCode: 500 };
  }
};

// Her 15 dakikada bir çalışması için cron ayarı
export const config = {
  schedule: "*/15 * * * *"
};

exports.handler = handler;
