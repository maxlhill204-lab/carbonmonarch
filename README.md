# CARBONMONARCH

Luxury static eCommerce storefront for premium carbon fiber accessories.

## Files

- `index.html` — homepage
- `shop.html` — collection page with filters
- `product.html` — reusable product detail page powered by URL params
- `contact.html` — contact page
- `sponsors.html` — dedicated sponsors page
- `assets/css/styles.css` — site styling
- `assets/js/products.js` — full catalogue and site config
- `assets/js/main.js` — rendering and interactions
- `assets/favicon.svg` — favicon
- `assets/social-preview.svg` — social preview image
- `vercel.json` — Vercel static config
- `netlify.toml` — Netlify static config and checkout API redirect
- `netlify/functions/create-checkout-session.js` — Netlify adapter for the Stripe checkout endpoint

## What is included

- 3 product categories: phone cases, card holders, key holders
- 7 product ranges with 36 colour and fit options across the catalogue
- Full-card clickable product boxes
- Reusable product page with colour and model or fit selectors only
- Dropdowns styled to feel clearly interactive
- Separate contact and sponsors pages
- Startup welcome deal display showing every current price as $10 off
- First-visit newsletter popup with email consent, phone capture, and Firestore `newsletterSignups` storage
- Stripe Checkout cart flow with Australia tracked shipping
- Sponsors page featuring Seth Polson and Lachlan Mcqueeney with launch-ready athlete sections
- Deployment ready for Vercel or Netlify

## Launch checklist

- Add `STRIPE_SECRET_KEY` in your hosting environment.
- Optional: set `STRIPE_STANDARD_SHIPPING_AMOUNT`, `STRIPE_EXPRESS_SHIPPING_AMOUNT`, and `STRIPE_FREE_SHIPPING_THRESHOLD` in cents.
- Confirm social media URLs in `assets/js/products.js`.
- Confirm contact emails in `contact.html`.
- Confirm Firestore rules allow creating newsletter signup records, or add a protected backend/email notification flow if you want instant email alerts for every signup.
- Add your final custom domain in the hosting dashboard.

## Upload to GitHub

```bash
git init
git add .
git commit -m "Initial CARBONMONARCH site"
git remote add origin https://github.com/YOUR-USERNAME/monarchcarbon.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel

- Import the GitHub repo in Vercel
- Build command: none
- Output directory: `.`

## Deploy to Netlify

- Import the GitHub repo in Netlify
- Build command: none
- Publish directory: `.`

`netlify.toml` is already included.
