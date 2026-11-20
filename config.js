/* =====================================================================
   SHOP SETTINGS: edit this file only. It is used by every page.
   Fields marked TODO must be filled in before the shop goes live.
   ===================================================================== */
const SHOP = {
  // ---- Business details (shown on the site and in the legal pages)
  name:        "BeamFix Parts",                 // TODO: shop / brand name
  legalName:   "BeamFix Parts Ltd",             // TODO: legal name (sole trader: your full name, e.g. "John Smith trading as BeamFix Parts")
  companyNo:   "",                              // TODO: Companies House number (leave empty for a sole trader)
  vatNo:       "",                              // TODO: VAT number (leave empty if not VAT registered)
  address:     "TODO: Street, Town, Postcode, United Kingdom",
  returnsAddress: "",                           // leave empty = same as address
  email:       "sales@example.co.uk",           // TODO
  phone:       "+44 0000 000000",               // TODO
  website:     "https://yourname.github.io/beamfix-shop",
  icoNo:       "",                              // TODO: ICO data protection registration number, if you have one

  // ---- Prices & delivery (GBP)
  currency: "GBP",
  shipping: { GB: 2.49, EU: 6.99, WW: 9.99 },   // per order
  freeShippingOver: 20,                         // free UK delivery above this subtotal (0 = off)
  dispatchDays: 1,                              // working days to dispatch
  returnDays: 30,                               // change-of-mind returns window (legal minimum 14)

  // ---- Payments
  // PayPal client ID (developer.paypal.com → Apps & Credentials → Live → Client ID).
  // Customers can pay with PayPal OR with a debit/credit card WITHOUT a PayPal account.
  paypalClientId: "",
  // Optional Stripe checkout server URL (see /server). Leave empty on GitHub Pages.
  checkoutEndpoint: "",

  updated: "20 November 2026",                  // date shown on the legal pages
};

/* Fill elements like <span data-b="email"></span> with the values above. */
document.addEventListener("DOMContentLoaded", () => {
  const v = k => k === "returnsAddress" ? (SHOP.returnsAddress || SHOP.address) : SHOP[k];
  document.querySelectorAll("[data-b]").forEach(el => {
    const k = el.dataset.b, val = v(k);
    if (el.dataset.hideEmpty !== undefined && !val) { (el.closest("[data-wrap]") || el).remove(); return; }
    el.textContent = val;
    if (el.dataset.link === "mailto") el.href = "mailto:" + val;
    if (el.dataset.link === "tel") el.href = "tel:" + String(val).replace(/\s/g, "");
  });
});
