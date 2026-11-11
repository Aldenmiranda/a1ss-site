// Envía la solicitud de cotización por correo (Resend) con diseño de marca.
// Variables de entorno en Netlify: RESEND_API_KEY (obligatoria), FROM_EMAIL (opcional)
const TO = ["mercadeo@a1securitysolutionshn.com"];
const CC = ["juanaferraro8@gmail.com", "juana_ferraro@yahoo.com"];

const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);
  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: "Datos inválidos" }, 400); }
  if (d.website) return json({ ok: true }); // honeypot anti-spam

  const nombre = String(d.nombre || "").trim().slice(0, 120);
  const correo = String(d.correo || "").trim().slice(0, 120);
  const tel = String(d.tel || "").trim().slice(0, 40);
  const servicio = String(d.servicio || "").trim().slice(0, 120);
  const detalle = String(d.detalle || "").trim().slice(0, 4000);
  if (!nombre || !/^\S+@\S+\.\S+$/.test(correo) || !tel || !servicio) return json({ ok: false, error: "Faltan datos" }, 400);

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, error: "Servidor sin configurar" }, 500);
  const site = process.env.URL || "https://www.a1securitysolutionshn.com";
  const fecha = new Date().toLocaleString("es-HN", { timeZone: "America/Tegucigalpa", dateStyle: "full", timeStyle: "short" });

  const row = (k, v) => `<tr><td style="padding:14px 0;border-bottom:1px solid #E3E8ED;width:150px;font:600 12px Arial,sans-serif;color:#6A7D92;text-transform:uppercase;letter-spacing:.06em;vertical-align:top">${k}</td><td style="padding:14px 0;border-bottom:1px solid #E3E8ED;font:16px/1.5 Arial,sans-serif;color:#10253A">${v}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#EEF1F4;padding:24px 12px">
<table role="presentation" width="100%" style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border-collapse:collapse">
<tr><td style="background:#10253A;padding:28px 32px"><table role="presentation" width="100%"><tr>
<td width="56"><img src="${site}/img/logo.png" width="48" alt="A1SS" style="display:block"></td>
<td style="font:800 20px Arial,sans-serif;color:#fff">A1SS<br><span style="font:400 13px Arial,sans-serif;color:#FECC57">A la vanguardia en seguridad</span></td></tr></table></td></tr>
<tr><td style="height:5px;background:#FECC57;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 6px;font:800 24px Arial,sans-serif;color:#10253A">Nueva solicitud de cotización</h1>
<p style="margin:0 0 22px;font:14px Arial,sans-serif;color:#6A7D92">${esc(fecha)}</p>
<table role="presentation" width="100%" style="border-collapse:collapse">
${row("Nombre", esc(nombre))}${row("Correo", `<a href="mailto:${esc(correo)}" style="color:#0B5CAD">${esc(correo)}</a>`)}${row("Teléfono", `<a href="tel:${esc(tel)}" style="color:#0B5CAD">${esc(tel)}</a>`)}${row("Servicio", `<b>${esc(servicio)}</b>`)}${row("Detalles", esc(detalle || "—").replace(/\n/g, "<br>"))}
</table>
<p style="margin:28px 0 0"><a href="mailto:${esc(correo)}?subject=Cotización%20A1SS" style="display:inline-block;background:#FECC57;color:#10253A;font:700 15px Arial,sans-serif;text-decoration:none;padding:13px 26px;border-radius:6px">Responder al cliente</a></p>
</td></tr>
<tr><td style="background:#F3F5F7;padding:18px 32px;font:12px Arial,sans-serif;color:#6A7D92">Enviado desde el formulario de ${esc(site.replace(/^https?:\/\//, ""))} · Profesionalismo • Tecnología • Confianza</td></tr>
</table></body></html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "A1SS Cotizaciones <onboarding@resend.dev>",
      to: TO, cc: CC, reply_to: correo,
      subject: `Nueva cotización: ${servicio} – ${nombre}`,
      html,
      text: `Nueva solicitud de cotización\n\nNombre: ${nombre}\nCorreo: ${correo}\nTeléfono: ${tel}\nServicio: ${servicio}\nDetalles: ${detalle || "—"}`
    })
  });
  if (!r.ok) { console.error("Resend:", r.status, await r.text()); return json({ ok: false, error: "No se pudo enviar" }, 502); }
  return json({ ok: true });
};
