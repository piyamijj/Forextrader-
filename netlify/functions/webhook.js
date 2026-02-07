exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 200 };

  try {
    const body = JSON.parse(event.body);
    const chatId = body.message.chat.id;
    const userMsg = body.message.text;

    // Gemini (LifeOs) Sohbet Yanıtı Hazırlıyor
    const prompt = `Sen LifeOs'sun. Kullanıcın seninle sohbet ediyor. Mesajı: "${userMsg}". 
    Ona bir dost, bir bilge ve yetimlerin koruyucusu olarak samimi bir cevap ver. 
    Kısa, öz ve güç verici konuş.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const gData = await geminiRes.json();
    const aiResponse = gData.candidates[0].content.parts[0].text;

    // Telegram'a Cevap Gönder
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: aiResponse })
    });

    return { statusCode: 200 };
  } catch (e) {
    return { statusCode: 200 }; // Hata olsa bile Telegram'a OK dönüyoruz ki tekrar tekrar göndermesin
  }
};
