const { chromium } = require('playwright');

async function enviarTelegram(mensaje) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;

  const chatIds = [
    process.env.TELEGRAM_CHAT_ID,
    process.env.TELEGRAM_CHAT_ID_2S
  ];

  for (const chat_id of chatIds) {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        text: mensaje
      })
    });
  }
}

async function obtenerPrecioMinimo(url) {
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.getByRole('button', {
      name: 'Aceptar cookies y continuar'
    }).click().catch(() => {}); // evita crash si no aparece

    await page.waitForTimeout(5000);

    const textos = await page.locator('text=/USD/').allTextContents();

    const precios = textos
      .map(t => t.replace(/[^\d]/g, ''))
      .map(Number)
      .filter(n => n > 0);

    return Math.min(...precios);

  } finally {
    await browser.close();
  }
}

(async () => {

  const urlBahia = 'https://booking.iberostar.com/Reservations/availability?adultohab0=2&bebehab0=0&codiconc=109&conccodi=76&cp_tealium=&edadpersona0_0=30&edadpersona0_1=30&fechafin=14/03/2027&fechaini=04/03/2027&idiocodi=1&idiomercodi=es&monecodi=USD&ninohab0=0&numerohabitaciones=1&numeropersonas0=2&ok_promo=0&origen_soporte=IBE&search_origin=hotel';

  const urlPraia = 'https://booking.iberostar.com/Reservations/availability?codiconc=137&conccodi=76&cp_tealium=&fechafin=14/03/2027&fechaini=04/03/2027&idiocodi=1&idiomercodi=es&monecodi=USD&numerohabitaciones=1&ok_promo=0&origen_soporte=IBE&search_origin=hotel&edP0_0=30&edadpersona0_0=30&edP0_1=30&edadpersona0_1=30&adultohab0=2&ninohab0=0&bebehab0=0&numeropersonas0=2';

  const precioBahia = await obtenerPrecioMinimo(urlBahia);
  const precioPraia = await obtenerPrecioMinimo(urlPraia);

  const mensaje = `
🏨 Precios Brasil - 04/03/2027 al 14/03/2027

Iberostar Bahia: USD ${precioBahia}
Iberostar Praia do Forte: USD ${precioPraia}
`;

  await enviarTelegram(mensaje);

})();
