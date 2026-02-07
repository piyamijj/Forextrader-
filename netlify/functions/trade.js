exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  try {
    const { pair, action, sl, tp } = JSON.parse(event.body);
    const units = action === "AL" ? 100 : -100;
    const oandaSymbol = pair.replace("/", "_");

    const orderRes = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${process.env.OANDA_ACCOUNT_ID}/orders`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OANDA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ order: { units: units.toString(), instrument: oandaSymbol, timeInForce: "FOK", type: "MARKET", takeProfitOnFill: { price: tp.toString() }, stopLossOnFill: { price: sl.toString() } } })
    });

    // TELEGRAM BAĞLANTISI (api.txt ile uyumlu hale getirildi)
    const msg = `🛡️ **LifeOs İŞLEM RAPORU**\n\nDostum, senin için ${pair} paritesinde bir adım attım.\nYön: ${action}\nSonuç: Başarıyla iletildi.\n\n"Bu kazanç bir çocuğun yüzündeki tebessüm olacak."`;
    
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' })
    });

    return { statusCode: 200, headers, body: JSON.stringify({ msg: "Emir ve Telegram Raporu Tamam!" }) };
  } catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ msg: "Hata oluştu." }) }; }
};
