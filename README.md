# Sell your PDF with Cashfree — free hosting on Netlify

Total running cost: ₹0 for hosting. You only pay Cashfree's per-transaction gateway fee (no platform commission).

## How it works

1. Buyer fills name, email, phone on your site and clicks **Pay**.
2. A Netlify function (`/api/create-order`) creates the order with Cashfree using your secret key. The price is set on the server, so nobody can edit it in the browser.
3. Cashfree's checkout opens (UPI, cards, net banking, wallets).
4. After paying, Cashfree sends the buyer to `success.html`, which asks `/api/verify-order` whether the order is PAID.
5. The **Download** button goes to `/api/download`, which checks with Cashfree again and only then redirects to your PDF.

## Files

```
netlify.toml                    Netlify settings
public/index.html               Sales page + checkout form   ← edit the text here
public/success.html             Post-payment download page
public/terms.html, privacy.html, refund.html, delivery.html, contact.html
                                Policy pages Cashfree checks before approving you
public/styles.css               Design
netlify/functions/*.mjs         Server code (create order, verify, download)
netlify/lib/cashfree.mjs        Shared Cashfree helpers
```

## Step 1 — Put your PDF on Google Drive
1. Upload the PDF to Google Drive.
2. Share → General access → **Anyone with the link** → Viewer.
3. Copy the link. Optional, for a direct download instead of a preview, change
   `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
   to `https://drive.google.com/uc?export=download&id=FILE_ID`.
Keep this link private. It is only shown to people who paid.

## Step 2 — Edit your content
- `public/index.html`: title, headline, chapters, FAQ, price (₹199 appears in 3 places).
- All policy pages: replace `[YOUR NAME]`, `[YOUR EMAIL]`, `[YOUR PHONE]`, `[CITY]`, address, `[DATE]`.

## Step 3 — Put the code on GitHub (free)
1. Create an account at github.com → **New repository** (Private is fine).
2. **Upload files** → drag in everything from this folder (keep the folder structure) → Commit.

## Step 4 — Deploy on Netlify (free)
1. Sign up at netlify.com with your GitHub account.
2. **Add new site → Import an existing project → GitHub** → pick the repo.
3. Leave build settings as they are (netlify.toml handles it) → **Deploy**.
4. You get a free address like `your-name.netlify.app` (rename it under Site configuration → Change site name).

## Step 5 — Get Cashfree test keys
1. Sign up at cashfree.com as a merchant.
2. Switch to **Test / Sandbox** mode → Developers → API Keys → copy **App ID** and **Secret Key**.

## Step 6 — Add environment variables in Netlify
Site configuration → Environment variables → Add:

| Key | Value |
|---|---|
| `CASHFREE_APP_ID` | your App ID |
| `CASHFREE_SECRET_KEY` | your Secret Key |
| `CASHFREE_ENV` | `sandbox` (later `production`) |
| `PRODUCT_PRICE` | `199` (must match the page) |
| `PRODUCT_NAME` | `The AuraMax Guide` |
| `DOWNLOAD_URL` | your Google Drive link |
| `DOWNLOAD_DAYS` | `30` (optional) |

Then **Deploys → Trigger deploy** so the new values take effect.

## Step 7 — Test
Open your site, fill the form, pay with Cashfree's sandbox test UPI/card details (listed in Cashfree's docs under "test data"). You should land on the download page and get the PDF.

## Step 8 — Go live
1. Complete KYC in Cashfree (PAN, bank account, etc.). Give them your Netlify URL; they review the site and policy pages.
2. In Cashfree production dashboard, **whitelist your domain** (`your-name.netlify.app`). Checkout won't open on domains that aren't whitelisted.
3. Copy the **production** App ID and Secret Key into Netlify, set `CASHFREE_ENV` to `production`, and redeploy.
4. Do one real ₹1–₹199 test purchase yourself.

## Good to know
- Never put the Secret Key in any file in `public/`. It lives only in Netlify's environment variables.
- If a buyer closes the tab before returning to your site, they still paid: you'll see the order in the Cashfree dashboard, and they can contact you with the order ID. Email them the file.
- A buyer can still forward the PDF itself. That's true for every PDF seller; adding their name inside the PDF discourages it.
- Netlify's free plan is enough for thousands of visits a month. Check your usage under Netlify → Usage.
