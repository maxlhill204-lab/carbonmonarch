window.MONARCH_CONFIG = {
  checkoutEndpoint: "/api/create-checkout-session",
  newsletterOwnerEmail: "officialcarbonmonarch@gmail.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com/officialcarbonmonarch" },
    { label: "Email", href: "mailto:officialcarbonmonarch@gmail.com" },
    { label: "TikTok", href: "https://tiktok.com/@officialcarbonmonarch" }
  ]
};

(function () {
  const imageBase = "assets/images/products/final product photos";

  const productGroups = [
    {
      slug: "phone-case-iphone-carbon-weave",
      type: "phone-case",
      brand: "Apple",
      typeLabel: "Phone Case",
      material: "carbon-weave",
      materialLabel: "Carbon Fiber Weave",
      name: "iPhone Case - Carbon Fiber Weave",
      price: "$59.99",
      description: "Woven carbon styling with a slim silhouette built for elevated everyday protection.",
      colors: ["Blue", "Green", "Purple", "Gold", "Red"],
      colorImages: {
        blue: `${imageBase}/Phone Cases/Iphone/Weave Blue.avif`,
        green: `${imageBase}/Phone Cases/Iphone/Weave Green.avif`,
        purple: `${imageBase}/Phone Cases/Iphone/Weave Purple.avif`,
        gold: `${imageBase}/Phone Cases/Iphone/Weave GOld.avif`,
        red: `${imageBase}/Phone Cases/Iphone/Weave Red.avif`
      },
      models: [
        "iPhone 17 Pro","iPhone 17","iPhone 17 Air","iPhone 17 Pro Max",
        "iPhone 16","iPhone 16 Pro","iPhone 16 Pro Max","iPhone 16 Plus",
        "iPhone 15","iPhone 15 Plus","iPhone 15 Pro","iPhone 15 Pro Max",
        "iPhone 14","iPhone 14 Pro","iPhone 14 Pro Max",
        "iPhone 13","iPhone 13 Pro","iPhone 13 Pro Max",
        "iPhone 12","iPhone 12 Pro","iPhone 12 Pro Max",
        "iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max"
      ],
      magsafe: "No",
      accent: "#4a86ff"
    },
    {
      slug: "phone-case-iphone-forged",
      type: "phone-case",
      brand: "Apple",
      typeLabel: "Phone Case",
      material: "forged-carbon",
      materialLabel: "Carbon Forge",
      name: "iPhone Case - Carbon Forge",
      price: "$59.99",
      description: "Precision-molded carbon shell with a refined grip profile and a luxury motorsport finish.",
      colors: ["Black", "Red", "Gold", "Blue", "Green", "Silver", "Purple"],
      colorImages: {
        black: `${imageBase}/Phone Cases/Iphone/Forge Black.avif`,
        red: `${imageBase}/Phone Cases/Iphone/Forge Red.avif`,
        gold: `${imageBase}/Phone Cases/Iphone/Forge Gold.avif`,
        blue: `${imageBase}/Phone Cases/Iphone/Forge Blue.avif`,
        green: `${imageBase}/Phone Cases/Iphone/Forge Green.avif`,
        silver: `${imageBase}/Phone Cases/Iphone/Forge Silver.avif`,
        purple: `${imageBase}/Phone Cases/Iphone/Forge Purple.avif`
      },
      models: [
        "iPhone 16","iPhone 16 Pro","iPhone 16 Pro Max","iPhone 16 Plus",
        "iPhone 15","iPhone 15 Pro","iPhone 15 Pro Max",
        "iPhone 14","iPhone 14 Pro","iPhone 14 Pro Max",
        "iPhone 13","iPhone 13 Pro","iPhone 13 Pro Max",
        "iPhone 12 / 12 Pro","iPhone 12 Pro Max",
        "iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max"
      ],
      magsafe: "Yes",
      accent: "#d8dde6"
    },
    {
      slug: "phone-case-samsung-forged",
      type: "phone-case",
      brand: "Samsung",
      typeLabel: "Phone Case",
      material: "forged-carbon",
      materialLabel: "Forge",
      name: "Samsung Case - Forge",
      price: "$59.99",
      description: "Precision-molded forged carbon shell for Samsung flagships.",
      colors: ["Green", "Red", "Blue", "Gold", "Silver", "Black", "Purple"],
      colorImages: {
        black: `${imageBase}/Phone Cases/Samsung/Forged Black.avif`,
        red: `${imageBase}/Phone Cases/Samsung/Forged Red.avif`,
        gold: `${imageBase}/Phone Cases/Samsung/Forged Gold.avif`,
        blue: `${imageBase}/Phone Cases/Samsung/Forged Blue.avif`,
        green: `${imageBase}/Phone Cases/Samsung/Forged Green.avif`,
        silver: `${imageBase}/Phone Cases/Samsung/Forged Silver.avif`,
        purple: `${imageBase}/Phone Cases/Samsung/Forged Purple.avif`
      },
      models: [
        "S24","S24+","S24 Ultra","Galaxy S22","Galaxy S22 Ultra","Galaxy S21",
        "S25","S25 Plus","S25 Ultra","S25 Edge","S25 FE"
      ],
      magsafe: "No",
      accent: "#3d78ff"
    },
    {
      slug: "card-holder-carbon-weave",
      type: "card-holder",
      brand: "CARBON MONARCH",
      typeLabel: "Card Holder",
      material: "carbon-weave",
      materialLabel: "Carbon Weave",
      name: "Card Holder - Carbon Weave",
      price: "$49.99",
      description: "Classic weave detailing wraps a minimalist card holder designed for clean daily carry.",
      colors: ["Black", "Blue", "Golden", "Pink", "Silver"],
      colorImages: {
        black: `${imageBase}/Card holders/Weave Black.avif`,
        blue: `${imageBase}/Card holders/Weave Blue.avif`,
        golden: `${imageBase}/Card holders/Weave Gold.avif`,
        pink: `${imageBase}/Card holders/Weave Pink.avif`,
        silver: `${imageBase}/Card holders/Weave Silver.avif`
      },
      mechanisms: ["Clip", "Cash Belt"],
      magsafe: "N/A",
      accent: "#4a86ff"
    },
    {
      slug: "card-holder-forged-carbon",
      type: "card-holder",
      brand: "CARBON MONARCH",
      typeLabel: "Card Holder",
      material: "forged-carbon",
      materialLabel: "Forged Carbon",
      name: "Card Holder - Forged Carbon",
      price: "$49.99",
      description: "A compact forged carbon card holder with lightweight structure and premium pocket presence.",
      colors: ["Black", "Blue", "Green", "Purple", "Red", "White", "Yellow"],
      colorImages: {
        black: `${imageBase}/Card holders/Forged BLack.avif`,
        blue: `${imageBase}/Card holders/Forged Blue.avif`,
        green: `${imageBase}/Card holders/Forged Green.avif`,
        purple: `${imageBase}/Card holders/Forged Purple.avif`,
        red: `${imageBase}/Card holders/Forged Red.avif`,
        yellow: `${imageBase}/Card holders/Forged Yellow.avif`,
        white: `${imageBase}/Card holders/Forged Silver.avif`
      },
      mechanisms: ["Clip", "Cash Belt"],
      magsafe: "N/A",
      accent: "#d8dde6"
    },
    {
      slug: "key-holder-carbon-weave",
      type: "key-holder",
      brand: "CARBON MONARCH",
      typeLabel: "Key Holder",
      material: "carbon-weave",
      materialLabel: "Carbon Fiber",
      name: "Key Holder - Carbon Fiber",
      price: "$39.99",
      description: "Woven carbon styling gives this key holder a precise, understated luxury character.",
      colors: ["Standard"],
      colorImages: {
        standard: `${imageBase}/key holders/Carbon Weave.avif`
      },
      magsafe: "N/A",
      accent: "#bfc8d6"
    },
    {
      slug: "key-holder-forged",
      type: "key-holder",
      brand: "CARBON MONARCH",
      typeLabel: "Key Holder",
      material: "forged-carbon",
      materialLabel: "Forged",
      name: "Key Holder - Forged",
      price: "$39.99",
      description: "Forged carbon texture brings a performance-inspired finish to a sleek key carry essential.",
      colors: ["Blue", "Gold", "Green", "Red"],
      colorImages: {
        blue: `${imageBase}/key holders/Forged Blue.avif`,
        gold: `${imageBase}/key holders/Forged Gold.avif`,
        green: `${imageBase}/key holders/Forged Green.avif`,
        red: `${imageBase}/key holders/Forged Red.avif`
      },
      magsafe: "N/A",
      accent: "#23b26d"
    }
  ];

  window.MONARCH_PRODUCTS = productGroups.map((group) => {
    const defaultColor = group.colors[0];
    const defaultKey = defaultColor.toLowerCase();
    const priceValue = Number(String(group.price).replace(/[^0-9.]/g, '')) || 0;
    return {
      ...group,
      compareAtPrice: `$${(priceValue + 10).toFixed(2)}`,
      dealLabel: "First-buyer deal: Save $10",
      colour: defaultColor,
      image: group.colorImages[defaultKey] || Object.values(group.colorImages)[0] || null,
      shortTypeLabel: group.typeLabel
    };
  });
})();
