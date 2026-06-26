// WhatsApp Business API integration — shaped to flip on the instant Meta Business
// verification comes through, without touching any call site. Until then this
// logs the message it *would* send (same shape as a real Cloud API call) instead
// of silently doing nothing, so the notification flow is fully testable today.
export const whatsappEnabled = Boolean(process.env.WHATSAPP_BUSINESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

export async function sendWhatsAppMessage(to, body) {
  if (!whatsappEnabled) {
    console.log(`[whatsapp:mock] -> ${to} :: ${body}`);
    return { status: 'mocked' };
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[whatsapp] send failed: ${text}`);
    return { status: 'failed' };
  }
  return { status: 'sent' };
}
