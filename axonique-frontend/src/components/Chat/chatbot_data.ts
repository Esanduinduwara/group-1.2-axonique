export interface ChatResponse {
  keywords: string[];
  subKeywords?: string[];
  response: string;
}

export interface ProductInfo {
  collection: string;
  type: string;
  color: string;
  price: number;
  description: string;
}

// Synonyms for mapping user input to canonical terms
export const SYNONYMS: Record<string, string> = {
  'ecstasy': 'timeless',
  'hat': 'cap',
  't-shirt': 'tee',
  'tshirt': 'tee',
  'shirt': 'tee',
  'sweatshirt': 'hoodie',
  'bought': 'buy',
  'hoody': 'hoodie',
  'caps': 'cap',
  'tees': 'tee'
};

export const PRODUCTS: ProductInfo[] = [
  // Timeless
  { collection: 'Timeless', type: 'Tee', color: 'White', price: 3500, description: 'is a classic white premium cotton tee' },
  { collection: 'Timeless', type: 'Hoodie', color: 'White', price: 6500, description: 'is an oversized white fleece hoodie' },
  { collection: 'Timeless', type: 'Cap', color: 'White', price: 2190, description: 'is a clean white structured cap' },
  
  // Impossible
  { collection: 'Impossible', type: 'Tee', color: 'Black', price: 3500, description: 'features an edgy graphic on a black base' },
  { collection: 'Impossible', type: 'Hoodie', color: 'Black', price: 6500, description: 'is a dark, heavyweight black hoodie' },
  { collection: 'Impossible', type: 'Cap', color: 'Black', price: 2190, description: 'is an all-black stealth headwear piece' },

  // Phantom
  { collection: 'Phantom', type: 'Tee', color: 'Black', price: 3500, description: 'is a minimal black drop-shoulder tee' },
  { collection: 'Phantom', type: 'Hoodie', color: 'Black', price: 6500, description: 'is a distressed black comfortable hoodie' },
  { collection: 'Phantom', type: 'Cap', color: 'Black', price: 2190, description: 'features subtle black-on-black embroidery' },

  // Xenonix
  { collection: 'Xenonix', type: 'Tee', color: 'White', price: 3500, description: 'is a futuristic bright white streetwear tee' }
];

export const CHAT_DATA: ChatResponse[] = [
  // --- Shipping & Delivery ---
  {
    keywords: ['shipping', 'delivery', 'ship', 'arrive'],
    response: "We offer worldwide shipping! Orders typically arrive within 5-7 business days for domestic shipments and 10-14 days for international ones. Standard shipping is free on orders over Rs. 5000."
  },
  {
    keywords: ['track', 'order', 'status'],
    response: "Once your order ships, you'll receive a tracking number via email. You can also track your order in your account dashboard under 'Order History'."
  },

  // --- Returns & Refunds ---
  {
    keywords: ['return', 'refund', 'exchange', 'cancel'],
    response: "We have a 14-day hassle-free return policy. If you're not happy with your AxoNique purchase, ensure the tags are intact and visit our Refund Policy page to start a request."
  },

  // --- Sizing ---
  {
    keywords: ['size', 'fit', 'measurement', 'sizing'],
    response: "AxoNique apparel generally follows a modern, slightly oversized fit. Check out our Size Guide on each product page for detailed measurements."
  },
  {
    keywords: ['size', 'oversized', 'fit'],
    subKeywords: ['oversized', 'loose'],
    response: "Most of our hoodies and tees are designed with an oversized silhouette for that premium streetwear look. We recommend staying true to your size for the intended fit, or sizing down for a more standard look."
  },

  // --- General Info ---
  {
    keywords: ['location', 'store', 'shop'],
    response: "Currently, AxoNique is exclusively online at axoshop.online. This allows us to offer premium quality directly to you without traditional retail markups."
  },
  {
    keywords: ['contact', 'support', 'help', 'email'],
    response: "Need more help? You can reach our team at support@axonique.com or via our Contact page. We usually respond within 24 hours."
  },

  // --- Greetings ---
  {
    keywords: ['hello', 'hi', 'hey', 'yo'],
    response: "Hello! I'm the AXO Concierge. How can I help you elevate your wardrobe today?"
  }
];

export const DEFAULT_RESPONSE = "I'm not quite sure I follow. You can ask about our catalog (like 'Timeless Cap'), sizing, or shipping! Or simply type 'contact' to talk to our team.";
export const GREETING_MESSAGE = "Welcome to AxoNique. I am your personal Concierge. Ask me anything about our collections, sizing, or policies.";
