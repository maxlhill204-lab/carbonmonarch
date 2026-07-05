const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil'
});

const priceMap = {
  'phone-case': 5999,
  'card-holder': 4999,
  'key-holder': 3999
};

const currency = 'aud';

function buildShippingOptions() {
  return [{
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 0, currency },
      display_name: 'Tracked shipping',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 7 },
        maximum: { unit: 'business_day', value: 14 }
      }
    }
  }];
}

function productName(item) {
  const color = item.colour ? ` - ${item.colour}` : '';
  const model = item.model && item.model !== 'One size' ? ` - ${item.model}` : '';
  const material = item.materialLabel ? ` - ${item.materialLabel}` : '';
  const brand = item.brand ? `${item.brand} ` : '';
  const baseName = item.name || `${brand}${item.type || 'Product'}`;
  return `${baseName}${material}${color}${model}`;
}

function expandPromotionUnits(items) {
  const units = [];
  items.forEach((item) => {
    const unitAmount = priceMap[item.type];
    if (!unitAmount) throw new Error(`Unknown product type: ${item.type || 'unknown'}`);
    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 20));
    for (let i = 0; i < quantity; i += 1) {
      units.push({ item, unitAmount, isFree: false });
    }
  });

  const freeUnits = Math.floor(units.length / 3);
  [...units]
    .sort((a, b) => a.unitAmount - b.unitAmount)
    .slice(0, freeUnits)
    .forEach((unit) => {
      unit.isFree = true;
    });

  return units;
}

function buildLineItems(items) {
  const grouped = new Map();
  expandPromotionUnits(items).forEach((unit) => {
    const key = [
      unit.item.slug || 'unknown',
      unit.item.colour || '',
      unit.item.model || 'One size',
      unit.unitAmount,
      unit.isFree ? 'free' : 'paid'
    ].join('__');
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
      return;
    }
    grouped.set(key, {
      quantity: 1,
      unit,
    });
  });

  return [...grouped.values()].map(({ quantity, unit }) => ({
    quantity,
    price_data: {
      currency,
      unit_amount: unit.isFree ? 0 : unit.unitAmount,
      product_data: {
        name: `${productName(unit.item)}${unit.isFree ? ' - FREE' : ''}`,
        description: unit.isFree ? 'Buy 2 get 1 free promotion' : (unit.item.description || 'CARBON MONARCH product'),
        metadata: {
          slug: unit.item.slug || 'unknown',
          model: unit.item.model || 'One size',
          colour: unit.item.colour || '',
          material: unit.item.material || '',
          promotion: unit.isFree ? 'buy_2_get_1_free' : ''
        }
      }
    }
  }));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { items } = body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const line_items = buildLineItems(items);

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/cart.html?checkout=success`,
      cancel_url: `${origin}/cart.html?checkout=cancelled`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['AU']
      },
      shipping_options: buildShippingOptions()
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create checkout session.' });
  }
};
