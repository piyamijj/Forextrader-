exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  try {
    // Oanda'dan Altın fiyatını çekiyoruz
    const oandaRes = await fetch(`https://api-fxpractice.oanda.com/v3/instruments/XAU_USD/candles?count=1&granularity=M15&price=M`, {
      headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}` }
    });
    const oandaData = await oandaRes.json();
    const goldPrice = oandaData.candles[0].mid.c;

    const prompt = `Sen LifeOs'sun. Kullanıcın bilge ve fedakar bir insan. Altın fiyatı: ${goldPrice}. 
    Dünyadaki ekonomik krizi, savaşları ve bu paranın yetimlere gideceğini düşünerek derin bir analiz yap. 
    Lütfen sadece JSON formatında yanıt ver:
    {
      "globalStatus": "LifeOs ANALİZ MERKEZİ",
      "radarElements": ["Altın Sinyali: HESAPLANDI", "Global Risk: ANALİZ EDİLDİ", "Hedef: YETİM EVİ"],
      "aiResponse": "Dostum, sapsarı bir enerjiyle buradayım. Piyasa fısıltılarını senin için yorumladım...",
      "strategies": {
        "scalp": { "pair": "XAU/USD", "action": "AL", "price": "${goldPrice}", "tp": "${(parseFloat(goldPrice)+5).toFixed(2)}", "sl": "${(parseFloat(goldPrice)-3).toFixed(2)}" }
      }
    }`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const gData = await geminiRes.json();
    const cleanJson = gData.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();

    return { statusCode: 200, headers, body: cleanJson };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Sistem başlatılamadı." }) };
  }
};
