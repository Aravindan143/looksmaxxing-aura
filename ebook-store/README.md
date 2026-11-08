# AuraMax: sell your PDF guides with Razorpay on free Netlify hosting

Hosting costs ₹0. You only pay Razorpay's per-payment fee.

## How it works
1. The buyer picks a level, fills name, email and phone, and clicks **Pay**.
2. `/api/create-order` creates the order with Razorpay using your secret key. The price comes from the server, so it can't be edited in the browser.
3. Razorpay's checkout opens (UPI, cards, net banking, wallets).
4. After paying, the buyer lands on `success.html`. `/api/verify-order` checks the payment signature and asks Razorpay's server whether the order is paid.
5. The Download button goes to `/api/download`, which checks with Razorpay again and only then redirects to that level's PDF.

## Files
```
netlify.toml                    Netlify settings
public/index.html               Sales page + checkout     <- edit the text here
public/success.html             Download page shown after payment
public/terms, privacy, refund, delivery, contact .html   <- replace every [PLACEHOLDER]
public/styles.css               Design and motion
netlify/lib/razorpay.mjs        Levels, prices and Razorpay helpers
netlify/functions/*.mjs         Server code (products, create-order, verify-order, download)
```

## Netlify environment variables
Site configuration -> Environment variables:

| Key | Value |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_...` while testing, `rzp_live_...` when live |
| `RAZORPAY_KEY_SECRET` | the matching secret. Type it into Netlify only, never into a file or chat |
| `DOWNLOAD_URL_L1` | Google Drive link to the Level 1 PDF |
| `DOWNLOAD_URL_L2` | Google Drive link to the Level 2 PDF |
| `DOWNLOAD_URL_L3` | Google Drive link to the Level 3 PDF |
| `DOWNLOAD_DAYS` | optional, default 30 |
| `PRICE_L1`, `PRICE_L2`, `PRICE_L3` | optional, defaults 99, 249, 499 |

The key itself decides test or live mode: `rzp_test_` keys make fake payments, `rzp_live_` keys take real money.
Delete any old `CASHFREE_*` variables.
After changing variables: Deploys -> Trigger deploy.

## Test, then go live
1. Razorpay dashboard -> turn on **Test Mode** -> Account & Settings -> **API Keys** -> Generate Test Key.
2. Put the test key ID and secret into Netlify, redeploy, and buy a level using Razorpay's test card or UPI details (in their docs).
   You should land on the download page and get the PDF.
3. Switch Razorpay to **Live Mode**, generate live keys, replace the two Netlify values, and redeploy.
4. Buy Level 1 (₹99) yourself once to confirm real money arrives and the download works.

## PDFs on Google Drive
Upload each PDF, Share -> **Anyone with the link** -> Viewer, copy the link. For a direct download use
`https://drive.google.com/uc?export=download&id=FILE_ID`. Keep these links private.
Only keep bullets on the site that match what is really inside each PDF.

## Good to know
- Never put a secret key in any file. This repo is public.
- If a buyer closes the tab before the download page, they still paid. Find the order in Razorpay -> Transactions and email them the file.
- Add webhooks later if you want extra safety for edge cases.
