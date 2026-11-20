// OPTIONAL checkout API for card payments via Stripe (and server-side PayPal).
// The shop itself is static (GitHub Pages). Deploy this folder to Render/Railway and put its URL + "/api/checkout"
// into checkoutEndpoint in config.js.
// Prices are ALWAYS taken from products.json on the server, never from the browser.
import "dotenv/config";
import express from "express";
import Stripe from "stripe";
import fs from "fs";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PRODUCTS = JSON.parse(fs.readFileSync("../products.json", "utf8"));
const SHIPPING = { GB: 2.49, EU: 6.99, WW: 9.99 };   // keep in sync with shipping in ../config.js
const FREE_UK_OVER = 20;
const SITE = process.env.SITE_URL || "http://localhost:5500";  // the shop URL, e.g. https://yourname.github.io/beamfix-shop

function priceOrder(items, region = "GB") {
  const lines = items.map(({ id, qty }) => {
    const p = PRODUCTS.find(x => x.id === id);
    const q = Math.max(1, Math.min(99, parseInt(qty) || 0));
    if (!p) throw new Error("Unknown product " + id);
    return { p, q };
  });
  if (!lines.length) throw new Error("Empty basket");
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.q, 0);
  const ship = region === "GB" && subtotal >= FREE_UK_OVER ? 0 : (SHIPPING[region] ?? SHIPPING.WW);
  return { lines, subtotal, ship };
}

// Stripe webhook needs the raw body, so register it before express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) { return res.status(400).send(`Webhook error: ${e.message}`); }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    // TODO: save the order / send yourself an email / print a label
    console.log("PAID ORDER", s.id, s.customer_details?.email, s.amount_total / 100, s.metadata);
  }
  res.json({ received: true });
});

app.use(express.json());
// Allow the shop page (e.g. on GitHub Pages) to call this API. Set ALLOWED_ORIGIN in .env.
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.get("/", (req, res) => res.send("Checkout API running"));

// ---- Stripe Checkout (cards, Apple Pay, Google Pay, Klarna if enabled in dashboard)
app.post("/api/checkout", async (req, res) => {
  try {
    const { items, customer = {} } = req.body;
    const { lines, ship } = priceOrder(items, customer.country);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      line_items: lines.map(({ p, q }) => ({
        quantity: q,
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(p.price * 100),
          product_data: { name: p.title, images: [`https://i.ebayimg.com/images/g/${p.img}/s-l500.webp`], metadata: { sku: p.id } },
        },
      })),
      shipping_options: [{ shipping_rate_data: {
        display_name: ship ? "Standard delivery" : "Free UK delivery", type: "fixed_amount",
        fixed_amount: { amount: Math.round(ship * 100), currency: "gbp" } } }],
      shipping_address_collection: { allowed_countries: ["GB","IE","DE","FR","NL","BE","ES","IT","PL","SE","DK","AT","US","CA","AU"] },
      metadata: { name: `${customer.first || ""} ${customer.last || ""}`.trim(), notes: (customer.notes || "").slice(0, 400) },
      success_url: `${SITE}/success.html?order={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/index.html#shop`,
    });
    res.json({ url: session.url });
  } catch (e) { console.error(e); res.status(400).send(e.message); }
});

// ---- PayPal (Orders v2)
async function paypalToken() {
  const r = await fetch(`${process.env.PAYPAL_API}/v1/oauth2/token`, {
    method: "POST", body: "grant_type=client_credentials",
    headers: { Authorization: "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64") },
  });
  return (await r.json()).access_token;
}
app.post("/api/paypal/create", async (req, res) => {
  try {
    const { items, customer = {} } = req.body;
    const { lines, subtotal, ship } = priceOrder(items, customer.country);
    const money = v => ({ currency_code: "GBP", value: v.toFixed(2) });
    const r = await fetch(`${process.env.PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await paypalToken()}` },
      body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{
        amount: { ...money(subtotal + ship), breakdown: { item_total: money(subtotal), shipping: money(ship) } },
        items: lines.map(({ p, q }) => ({ name: p.title.slice(0, 127), sku: p.id, quantity: String(q), unit_amount: money(p.price) })),
      }] }),
    });
    res.json(await r.json());
  } catch (e) { res.status(400).send(e.message); }
});
app.post("/api/paypal/capture", async (req, res) => {
  const r = await fetch(`${process.env.PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(req.body.orderID)}/capture`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await paypalToken()}` },
  });
  const data = await r.json();
  if (data.status === "COMPLETED") console.log("PAID ORDER (PayPal)", data.id, data.payer?.email_address);
  res.status(data.status === "COMPLETED" ? 200 : 400).json(data);
});

app.listen(process.env.PORT || 3000, () => console.log("Checkout API on port " + (process.env.PORT || 3000)));
