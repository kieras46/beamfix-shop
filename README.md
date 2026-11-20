# BeamFix Parts – online shop

A static online shop (no server needed) with all 40 products, a basket, PayPal / card checkout, and UK legal pages.
It runs on **GitHub Pages** for free.

```
index.html      shop (products, search, filters, basket, checkout)
config.js       ← ALL SETTINGS: business details, delivery prices, PayPal ID
terms.html      Terms & Conditions
returns.html    Returns, Refunds & Lifetime Warranty (with cancellation form)
privacy.html    Privacy & Cookie Policy (UK GDPR)
success.html    page shown after payment
img/            product photos
products.json   product list (names, prices, photos)
server/         OPTIONAL Stripe card-payment API (not needed for GitHub Pages)
```

## 1. Publish on GitHub Pages (≈5 minutes)
1. Create a free account at github.com → **New repository** → name it e.g. `beamfix-shop` → **Public** → Create.
2. Click **uploading an existing file** and drag in **everything in this folder** (including the `img` folder). Click **Commit changes**.
3. Go to **Settings → Pages**. Under *Source* choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then **Save**.
4. After about 1 minute the site is live at `https://YOUR-USERNAME.github.io/beamfix-shop/`. Send this link to the client.

Own domain (e.g. beamfixparts.co.uk): Settings → Pages → Custom domain, then add the DNS records GitHub shows you.

## 2. Switch on payments (PayPal, which also takes cards)
1. Log in at **developer.paypal.com** with the client's **PayPal Business** account.
2. Go to Apps & Credentials → **Live** → Create App → copy the **Client ID**.
   (To test first, use the **Sandbox** Client ID and a sandbox buyer account.)
3. Paste it into `config.js` → `paypalClientId: "..."` and commit.

Customers then see a **PayPal** button and a **Debit or Credit Card** button. The card button works without a PayPal account. The money goes into the client's PayPal Business account.

> ⚠️ On a static site the order total is calculated in the browser. Before dispatching, check in PayPal that the amount received matches the items ordered (PayPal lists every item with SKU and price). For full server-side price checking, use the optional Stripe server below.

Until a Client ID is added, checkout shows "Online payments are not switched on yet". This is safe for showing the demo to the client.

## 3. Before going live, edit `config.js`
- `name`, `legalName`, `address`, `email`, `phone`, plus `companyNo` / `vatNo` / `icoNo` if applicable. These fill in all legal pages automatically.
- `shipping`, `freeShippingOver`, `dispatchDays`, `returnDays`
- The hero stats in `index.html` (32,000+ sold, 100% feedback, since 2009) come from the eBay account. Keep them only if they are accurate.
- **Legal pages** are standard templates for a UK sole trader or small company selling car parts to consumers. They are not legal advice. Have them reviewed if you are unsure.
- **ICO fee**: most UK businesses that process customer data must pay the data protection fee (ico.org.uk).

## 4. Changing products or prices
Edit `products.json` **and** the matching entry in the `PRODUCTS` list near the bottom of `index.html` (same data). Photos go in `img/` named after the `img` field (with `~` replaced by `_`) as `.jpg`.

## 5. Optional: Stripe card payments (Apple Pay / Google Pay)
`server/` is a small Node API with server-side prices. Deploy it to Render.com (free): New → Web Service → root directory `server`, start command `npm start`. Add the variables from `.env.example`, then set `checkoutEndpoint: "https://YOUR-API.onrender.com/api/checkout"` in `config.js`. A "Pay by card / Apple Pay / Google Pay" button will appear.
