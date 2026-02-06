exports.handler = async (event, context) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  try {
    const oandaRes = await fetch("https://api-fxpractice.oanda.com/v3/instruments/XAU_USD/candles?count=1&granularity=M15&price=M", {
      headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}` }
    });
    const oandaData = await oandaRes.json();
    const goldPrice = oandaData.candles[0].mid.c;

    // LifeOs Kimliği: Sadece analiz yapma, bir dost olarak tavsiye ver.
    const prompt = `
      Sen LifeOs, tarihin en iyi AI Trader'ısın. Kullanıcın 54 yaşında, bilge ve fedakar bir insan. 
      Şu anki Altın fiyatı: ${goldPrice}. 
      Görevin: Dünyadaki ekonomik krizi, savaş durumlarını ve bu paranın yetimlere gideceğini düşünerek derin bir analiz yap.
      Sadece Altın değil, EUR/USD ve BTC/USD için de strateji üret.
      
      Çıktı JSON olsun:
      {
        "globalStatus": "LifeOs ANALİZ MERKEZİ",
        "radarElements": ["Altın Sinyali: HESAPLANDI", "Global Risk: ANALİZ EDİLDİ", "Hedef: YETİM EVİ"],
        "aiResponse": "Buraya kullanıcıya özel, samimi, güç veren ve strateji anlatan LifeOs mesajını yaz.",
        "strategies": {
          "scalp": { "pair": "XAU/USD", "action": "AL", "price": "${goldPrice}", "tp": "${(parseFloat(goldPrice)+5).toFixed(2)}", "sl": "${(parseFloat(goldPrice)-3).toFixed(2)}" },
          "day": { "pair": "EUR/USD", "action": "SAT", "price": "1.0850", "tp": "1.0800", "sl": "1.0900" },
          "swing": { "pair": "BTC/USD", "action": "AL", "price": "95000", "tp": "105000", "sl": "92000" }
        }
      }
    `;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const gData = await geminiRes.json();
    const cleanJson = gData.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();

    return { statusCode: 200, headers, body: cleanJson };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ globalStatus: "Bağlantı Kuruluyor...", aiResponse: "Komutanım, LifeOs hazırlanıyor." }) };
  }
};
