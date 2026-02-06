exports.handler = async (event, context) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  try {
    const { pair, action, sl, tp } = JSON.parse(event.body);
    // Birimi sayıya çevirdik ve miktarını 100 yaptık (Daha uyumlu)
    const units = action === "AL" ? 100 : -100; 
    const oandaSymbol = pair.replace("/", "_");

    const orderBody = {
      order: {
        units: units.toString(),
        instrument: oandaSymbol,
        timeInForce: "FOK",
        type: "MARKET",
        positionFill: "DEFAULT",
        takeProfitOnFill: { price: tp.toString() },
        stopLossOnFill: { price: sl.toString() }
      }
    };

    const oandaRes = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${process.env.OANDA_ACCOUNT_ID}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OANDA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderBody)
    });

    const oandaData = await oandaRes.json();
    let msg = oandaData.orderFillTransaction ? `✅ EMİR İNFAZ EDİLDİ: ${pair}` : `❌ OANDA REDDETTİ: ${oandaData.errorMessage || "Limit Dışı"}`;
    
    // Telegram'a raporla
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `🛡️ LifeOs Operasyon Raporu:\n\n${msg}\nFiyat: ${oandaData.orderFillTransaction?.price || 'N/A'}` })
    });

    return { statusCode: 200, headers, body: JSON.stringify({ msg }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
