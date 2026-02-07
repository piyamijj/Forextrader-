exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  try {
    // AUD/USD fiyatını çekiyoruz (XAU yoksa AUD ana parite olur)
    const oandaRes = await fetch(`https://api-fxpractice.oanda.com/v3/instruments/AUD_USD/candles?count=1&granularity=M15&price=M`, {
      headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}` }
    });
    const oandaData = await oandaRes.json();
    const audPrice = oandaData.candles[0].mid.c;

    const prompt = `Sen LifeOs'sun. Görevin yetimler için kazanç sağlamak. AUD/USD fiyatı: ${audPrice}. 
    3 farklı strateji üret (Scalp, Day, Swing). Yanıt sadece JSON olsun:
    {
      "aiResponse": "Dostum, AUD/USD fısıltılarını dinledim. İşte çocuklar için en güvenli yollar...",
      "strategies": {
        "scalp": { "pair": "AUD_USD", "action": "AL", "price": "${audPrice}", "tp": "${(parseFloat(audPrice)+0.0010).toFixed(5)}", "sl": "${(parseFloat(audPrice)-0.0005).toFixed(5)}" },
        "day": { "pair": "EUR_USD", "action": "SAT", "price": "1.0850", "tp": "1.0800", "sl": "1.0900" },
        "swing": { "pair": "GBP_USD", "action": "AL", "price": "1.2600", "tp": "1.2800", "sl": "1.2500" }
      }
    }`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const gData = await geminiRes.json();
    const cleanJson = gData.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();

    return { statusCode: 200, headers, body: cleanJson };
  } catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ error: "Sorgu başarısız." }) }; }
};
