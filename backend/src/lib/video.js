// Daily.co rooms are themselves a complete prebuilt video UI at a plain URL —
// no client SDK needed on web or mobile, just open the link. Gated behind
// DAILY_API_KEY like the other optional integrations.
export const videoEnabled = Boolean(process.env.DAILY_API_KEY);

export async function createDailyRoom({ name, expiresInMinutes = 60 }) {
  const res = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      properties: {
        exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
        enable_chat: true,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daily.co room creation failed: ${text}`);
  }
  return res.json();
}
