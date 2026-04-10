import { useState, useEffect, useRef } from 'react';
import './AXOConcierge.css';
import { CHAT_DATA, GREETING_MESSAGE, SYNONYMS, PRODUCTS } from './chatbot_data';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useBulk, getBulkDiscount } from '../../context/BulkContext';
import { authService } from '../../services/authService';
import type { Product } from '../../types';

interface MessageOption {
  label: string;
  action: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
  options?: MessageOption[];
}

// Removed unused ParsedIntent interface

const BRANDS = ['Timeless', 'Impossible', 'Phantom', 'Xenonix'];
const TYPES  = ['Tee', 'Hoodie', 'Cap'];
const TARGETS = ['Cart', 'Wishlist', 'Bulk'];

const BASE_FAQ_OPTIONS = [
  { label: 'Check Cart', action: 'Check my cart', keywords: ['cart', 'bag', 'checkout', 'total'], category: 'transaction' },
  { label: 'Sizing Guide', action: 'Size Guide', keywords: ['size', 'fit', 'measurement', 'hoodie', 'tee'], category: 'policy' },
  { label: 'Return Policy', action: 'What is the return policy?', keywords: ['return', 'refund', 'policy', 'exchange'], category: 'policy' },
  { label: 'Shipping Info', action: 'How does shipping work?', keywords: ['shipping', 'delivery', 'arrive', 'track'], category: 'policy' },
  { label: 'Show Wishlist', action: 'Show my wishlist', keywords: ['wishlist', 'favorite', 'save'], category: 'transaction' },
  { label: 'Contact Support', action: 'Contact support', keywords: ['contact', 'help', 'support', 'email'], category: 'general' },
  { label: 'Show All Tees', action: 'Show all tees', keywords: ['tee', 'shirt', 'clothing'], category: 'product' },
  { label: 'Bulk Order Info', action: 'How do bulk orders work?', keywords: ['bulk', 'retail', 'wholesale', 'business'], category: 'transaction' },
  { label: 'Show Black Items', action: 'Show black items', keywords: ['black', 'color', 'dark'], category: 'product' },
];

export default function AXOConcierge() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', text: GREETING_MESSAGE, sender: 'bot', timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [showHelp, setShowHelp]     = useState(false);
  const [currentFAQs, setCurrentFAQs] = useState<MessageOption[]>(BASE_FAQ_OPTIONS.slice(0, 7));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cart     = useCart();
  const wishlist = useWishlist();
  const bulk     = useBulk();
  const [realProducts, setRealProducts] = useState<Product[]>([]);

  const [pendingAction, setPendingAction] = useState<{
    action: 'add_cart' | 'remove_cart' | 'add_wishlist' | 'remove_wishlist' | 'ambiguous' | 
            'confirm_add_all_cart' | 'confirm_add_all_wishlist' | 
            'confirm_clear_all_cart' | 'confirm_clear_all_wishlist' | 'confirm_clear_bulk' |
            'confirm_checkout_cart' | 'confirm_checkout_bulk' |
            'set_company' | 'set_contact_person' | 'set_contact_email' | 'set_address' | 'set_notes' |
            'create_staff_username' | 'create_staff_email' | 'create_staff_password' | 'confirm_create_staff' | 'confirm_restock';
    qty: number;
    collection: string | null;
    type: string | null;
    size: string | null;
    originalQuery?: string;
    payload?: any;
  } | null>(null);

  // Ref keeps pendingAction in sync for setTimeout closures (avoids stale reads)
  const pendingActionRef = useRef(pendingAction);
  const updatePending = (val: typeof pendingAction) => {
    setPendingAction(val);
    pendingActionRef.current = val;
  };

  const SIZE_TOKENS = ['xs', 's', 'm', 'l', 'xl', 'xxl'];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/products`)
      .then(r => r.json())
      .then(d => setRealProducts(d.data || d))
      .catch(err => console.error('Chatbot: failed to load products', err));
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: inputValue.trim(), sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    processResponse(userMsg.text);
  };

  // ─────────────── helpers ────────────────────────────────────────────────

  const parseNumber = (terms: string[], rawTokens: string[]): number => {
    const map: Record<string, number> = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
    for (const t of rawTokens) {
      const n = parseInt(t); if (!isNaN(n)) return n;
      if (t.startsWith('x') && !isNaN(parseInt(t.slice(1)))) return parseInt(t.slice(1));
    }
    for (const t of terms) if (map[t]) return map[t];
    return 1;
  };

  const getRealProduct = (p: typeof PRODUCTS[0]) =>
    realProducts.find(rp =>
      rp.name.toLowerCase().includes(p.collection.toLowerCase()) &&
      (rp.name.toLowerCase().includes(p.type.toLowerCase()) || (p.type === 'Cap' && rp.category === 'Caps'))
    );

  const endResponse = (text: string, options?: MessageOption[]) => {
    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text, sender: 'bot', timestamp: Date.now(), options }]);
    setIsTyping(false);
  };

  const execRaw = (action: string, realP: Product, qty: number, size: string) => {
    let finalSize = size;
    if (realP.category === 'Caps' || realP.sizes?.includes('One Size')) finalSize = 'One Size';
    if (action === 'add_cart') {
      const existing = cart.items.find(i => i.product.id === realP.id && i.size === finalSize);
      if (existing) cart.changeQty(realP.id, finalSize, qty);
      else for (let i=0; i<qty; i++) cart.addItem(realP, finalSize);
    } else if (action === 'remove_cart') {
      cart.changeQty(realP.id, finalSize, -Math.abs(qty));
    } else if (action === 'add_wishlist') {
      wishlist.addItem(realP);
    } else if (action === 'remove_wishlist') {
      wishlist.removeItem(realP.id);
    }
  };

  const execSingle = (action: string, realP: Product, qty: number, size: string) => {
    let finalSize = size;
    if (realP.category === 'Caps' || realP.sizes?.includes('One Size')) finalSize = 'One Size';
    execRaw(action, realP, qty, finalSize);
    const needsSize = realP.sizes && !realP.sizes.includes('One Size');
    const szText = needsSize ? ` (Size ${finalSize})` : '';
    const label = `**${realP.name}**${szText}`;
    const msgs: Record<string,string> = {
      add_cart:       `Added ${qty} ${label} to your cart!`,
      remove_cart:    `Removed ${qty} ${label} from your cart.`,
      add_wishlist:   `Added ${label} to your wishlist!`,
      remove_wishlist:`Removed ${label} from your wishlist.`,
    };
    endResponse(msgs[action] || 'Done!');
  };

  // Filter the abstract PRODUCTS catalog by parsed filters
  const applyFilters = (
    collections: string[], types: string[], colors: string[],
    priceNumber: number | null, priceDir: string | null, priceNumber2: number | null
  ) => {
    let list = [...PRODUCTS];
    if (collections.length > 0) list = list.filter(p => collections.includes(p.collection.toLowerCase()));
    if (types.length > 0)       list = list.filter(p => types.includes(p.type.toLowerCase()));
    if (colors.length > 0)      list = list.filter(p => colors.includes(p.color.toLowerCase()));
    if (priceNumber !== null && priceDir) {
      if (priceDir === 'below') list = list.filter(p => p.price <= priceNumber);
      else if (priceDir === 'above') list = list.filter(p => p.price >= priceNumber);
      else if (priceDir === 'between' && priceNumber2 !== null) {
        const lo = Math.min(priceNumber, priceNumber2), hi = Math.max(priceNumber, priceNumber2);
        list = list.filter(p => p.price >= lo && p.price <= hi);
      }
    }
    return list;
  };

  const processResponse = async (userInput: string) => {
    setIsTyping(true);

    // ── TOKENIZATION & NORMALIZATION ──────────────────────────────────────
    let nText = userInput.toLowerCase();
    nText = nText.replace(/rupees?/g, 'lkr').replace(/\brs\b/g, 'lkr').replace(/\/-/g, '').replace(/[^\w\s]/g, ' ');
    const rawTokens = nText.split(/\s+/).filter(Boolean);
    const terms = rawTokens.map(t => {
      let base = t;
      if (t !== 'timeless' && t !== 'shoes' && t !== 'less' && t !== 'yes' && t.endsWith('s')) {
        base = t.endsWith('ies') ? t.slice(0, -3) + 'y' : t.slice(0, -1);
      }
      return SYNONYMS[base] || SYNONYMS[t] || base;
    });

    // ── SMART FAQ GENERATIONS AND SECURITY ────────────────────────────────
    const role = authService.getRole() || 'CUSTOMER';
    const isStaffUser = role === 'STAFF' || role === 'ADMIN';
    const isAdminUser = role === 'ADMIN';
    
    // 1) Context detection
    const ctxBrand = BRANDS.find(b => rawTokens.includes(b.toLowerCase()) || terms.includes(b.toLowerCase()));
    const ctxType  = TYPES.find(t => rawTokens.includes(t.toLowerCase()) || terms.includes(t.toLowerCase()));
    const ctxPolicy = ['shipping', 'delivery', 'return', 'refund', 'policy', 'size', 'fit', 'measurement'].some(kw => rawTokens.includes(kw));
    const ctxTrans  = ['clear', 'empty', 'wipe', 'checkout', 'buy', 'purchase', 'pay'].some(kw => rawTokens.includes(kw));
    
    let smartSuggestions: MessageOption[] = [];

    // Rule 1: Brand -> Items
    if (ctxBrand && !ctxType) {
        TYPES.forEach(t => smartSuggestions.push({ label: `${ctxBrand} ${t}`, action: `Show ${ctxBrand} ${t}` }));
    }
    // Rule 2: Item -> Brands
    if (ctxType && !ctxBrand) {
        BRANDS.forEach(b => smartSuggestions.push({ label: `${b} ${ctxType}`, action: `Show ${b} ${ctxType}` }));
    }
    // Rule 3: Policy Bundle
    if (ctxPolicy) {
        if (!rawTokens.includes('shipping')) smartSuggestions.push({ label: 'Shipping Info', action: 'How does shipping work?' });
        if (!rawTokens.includes('return'))   smartSuggestions.push({ label: 'Return Policy', action: 'What is the return policy?' });
        if (!rawTokens.includes('size'))     smartSuggestions.push({ label: 'Sizing Guide', action: 'Size Guide' });
    }
    // Rule 4: Transaction Cross-Suggest
    if (ctxTrans) {
        TARGETS.forEach(t => {
            if (!rawTokens.includes(t.toLowerCase()) && !terms.includes(t.toLowerCase())) {
                const act = rawTokens.includes('clear') ? 'Clear' : 'Checkout';
                smartSuggestions.push({ label: `${act} ${t}`, action: `${act} ${t}` });
            }
        });
    }

    // Role-Based Smart Rules (Interchangeable Brands/Items)
    if (isStaffUser) {
        if (rawTokens.includes('restock') || ctxType || ctxBrand) {
            const b = ctxBrand || BRANDS[0];
            const t = ctxType || TYPES[0];
            // Primary suggestion
            smartSuggestions.push({ label: `Restock ${b} ${t}`, action: `Restock ${b} ${t}` });
            // Secondary suggestions (interchangeability)
            const otherBrands = BRANDS.filter(br => br !== b).slice(0, 2);
            const otherTypes = TYPES.filter(ty => ty !== t).slice(0, 2);
            otherBrands.forEach(ob => smartSuggestions.push({ label: `Restock ${ob} ${t}`, action: `Restock ${ob} ${t}` }));
            otherTypes.forEach(ot => smartSuggestions.push({ label: `Restock ${b} ${ot}`, action: `Restock ${b} ${ot}` }));
        }
        if (rawTokens.includes('order') || rawTokens.includes('pending') || rawTokens.includes('dispatch')) {
            smartSuggestions.push({ label: 'List Pending Retail', action: 'List all pending retail orders' });
            smartSuggestions.push({ label: 'List Pending Bulk', action: 'List all pending bulk orders' });
            smartSuggestions.push({ label: 'Dispatch Status', action: 'How many pending orders?' });
        }
        if (rawTokens.includes('user') || rawTokens.includes('activity')) {
            smartSuggestions.push({ label: 'Recent Activity', action: 'Show recent activity' });
            smartSuggestions.push({ label: 'New Signups', action: 'Who registered recently?' });
        }
        if (rawTokens.includes('stock') || rawTokens.includes('inventory')) {
            smartSuggestions.push({ label: 'Low Stock Alerts', action: 'Show low stock items' });
            smartSuggestions.push({ label: 'Quick Inventory', action: 'Check stock levels' });
        }
        // General fallback for staff to hit 8+ ops
        if (smartSuggestions.length < 6) {
            smartSuggestions.push({ label: 'Total Orders', action: 'Show total orders count' });
            smartSuggestions.push({ label: 'Total Bulk', action: 'Show total bulk orders count' });
            smartSuggestions.push({ label: 'Catalog Size', action: 'What is our total number of products?' });
        }
    }

    if (isAdminUser) {
        if (['revenue', 'profit', 'money', 'earnings'].some(k => rawTokens.includes(k))) {
            smartSuggestions.push({ label: 'Total Revenue', action: 'Show total revenue' });
            smartSuggestions.push({ label: 'Estimated Profit', action: 'Show estimated profit' });
        }
        if (['staff', 'team', 'user', 'add', 'member'].some(k => rawTokens.includes(k))) {
            smartSuggestions.push({ label: 'Staff Count', action: 'How many staff users do we have?' });
            smartSuggestions.push({ label: 'Add Staff', action: 'Register new staff member' });
        }
        if (['metric', 'admin', 'overview', 'dashboard'].some(k => rawTokens.includes(k))) {
            smartSuggestions.push({ label: 'Admin Metrics', action: 'Admin metrics overview' });
        }
    }

    // Merge with original keyword matching for Base FAQs
    const matchedBase = BASE_FAQ_OPTIONS.filter(faq => 
       faq.keywords.some(kw => rawTokens.includes(kw))
    );
    const otherBase = BASE_FAQ_OPTIONS.filter(faq => !matchedBase.includes(faq) && !smartSuggestions.some(s => s.label === faq.label));
    
    const finalFAQs = [...smartSuggestions, ...matchedBase, ...otherBase].slice(0, 10);
    setCurrentFAQs(finalFAQs);


      // ── Canceller ────────────────────────────────────────────────────────
      if (['cancel', 'stop', 'nvm', 'nevermind'].some(w => terms.includes(w))) {
        if (pendingActionRef.current) {
          updatePending(null);
          endResponse("Okay, canceled! What else can I help you with?");
          return;
        }
      }

      // Confirmation Yes/No
      if (['yes', 'yep', 'sure', 'yeah'].some(w => terms.includes(w))) {
        if (pendingActionRef.current && pendingActionRef.current.action.startsWith('confirm_')) {
          const act = pendingActionRef.current.action;
          if (act === 'confirm_clear_all_cart') { cart.clearCart(); endResponse("Your cart has been cleared out entirely."); }
          else if (act === 'confirm_clear_all_wishlist') { wishlist.items.forEach(i => wishlist.removeItem(i.id)); endResponse("Your wishlist has been cleared out entirely."); }
          else if (act === 'confirm_clear_bulk') { bulk.clearBulk(); endResponse("Your bulk order has been cleared out entirely."); }
          else if (act === 'confirm_checkout_cart') { 
            if (cart.items.length === 0) endResponse("Your cart is empty! Add some items before checking out.");
            else { endResponse("Checkout successful! Thank you for shopping with AxoNique."); cart.clearCart(); }
          }
          else if (act === 'confirm_checkout_bulk') {
            const missing = !bulk.info.companyName || !bulk.info.contactPerson || !bulk.info.contactEmail || !bulk.info.deliveryAddress;
            if (bulk.items.length === 0) endResponse("Your bulk order is empty!");
            else if (missing) endResponse("Please provide all required retailer information before checking out. Use 'Update business info' to start.");
            else { endResponse("Bulk order submitted successfully! Our team will contact you shortly."); bulk.clearBulk(); }
          }
          else if (act === 'confirm_add_all_cart') {
             PRODUCTS.forEach(p => { const rp = getRealProduct(p); if (rp) execRaw('add_cart', rp, 1, rp.sizes?.includes('M') ? 'M' : 'One Size'); });
             endResponse("Added one of every item to your cart!");
          }
          else if (act === 'confirm_add_all_wishlist') {
             PRODUCTS.forEach(p => { const rp = getRealProduct(p); if (rp) execRaw('add_wishlist', rp, 1, 'One Size'); });
             endResponse("Added one of every item to your wishlist!");
          }
          else if (act === 'confirm_create_staff') {
             const { username, email, password } = pendingActionRef.current.payload;
             const head = authService.getAuthHeader();
             const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
             try {
                const res = await fetch(`${API_URL}/api/admin/staff`, {
                   method: 'POST', headers: { ...head, 'Content-Type': 'application/json' },
                   body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();
                if (data.success || res.ok) endResponse(`Success! Staff member '${username}' has been created.`);
                else endResponse(`Failed to create staff member: ${data.message || 'Unknown error'}`);
             } catch (e) {
                endResponse("Network error while creating user.");
             }
          }
          else if (act === 'confirm_restock') {
             const { productId, name, newAmount } = pendingActionRef.current.payload;
             const head = authService.getAuthHeader();
             const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
             try {
                const pRes = await fetch(`${API_URL}/api/products/${productId}`);
                const pData = await pRes.json();
                if (pData.data) {
                    const existingProduct = pData.data;
                    existingProduct.stockQuantity = (existingProduct.stockQuantity || 0) + newAmount;
                    const res = await fetch(`${API_URL}/api/products/${productId}`, {
                       method: 'PUT', headers: { ...head, 'Content-Type': 'application/json' },
                       body: JSON.stringify(existingProduct)
                    });
                    if (res.ok) endResponse(`Success! Restocked ${newAmount} units of '${name}'.`);
                    else endResponse(`Failed to restock '${name}'.`);
                } else endResponse("Product not found on server.");
             } catch (e) { endResponse("Network error."); }
          }
          updatePending(null);
          return;
        }
      }

      if (['no', 'nope', 'nah'].some(w => terms.includes(w))) {
        if (pendingActionRef.current && pendingActionRef.current.action.startsWith('confirm_')) {
          updatePending(null);
          endResponse("Action canceled.");
          return;
        }
      }

      const mCollections = terms.filter(t => PRODUCTS.some(p => p.collection.toLowerCase() === t));
      const mTypes       = Array.from(new Set(terms.filter(t => PRODUCTS.some(p => p.type.toLowerCase() === t))));
      const mColors      = terms.filter(t => PRODUCTS.some(p => p.color.toLowerCase() === t));
      let mSizes       = rawTokens.filter(t => SIZE_TOKENS.includes(t.toLowerCase())).map(t => t.toUpperCase());

      // Size rules for Caps
      if (mTypes.includes('cap') || mTypes.includes('hat')) { mSizes = []; }

      // Price / Qty parsing
      const allNums = rawTokens.map(t => parseInt(t)).filter(n => !isNaN(n));
      const priceNum1 = allNums.find(n => n >= 100) ?? null;
      const priceNum2 = allNums.filter(n => n >= 100).length >= 2 ? allNums.filter(n => n >= 100)[1] : null;
      const qty = parseNumber(terms, rawTokens.filter(t => parseInt(t) < 100 || t.startsWith('x')));

      const isBelow   = terms.some(t => ['below', 'under', 'less', 'within'].includes(t));
      const isAbove   = terms.some(t => ['above', 'over', 'more', 'greater'].includes(t));
      const isBetween = terms.includes('between');
      const priceDir  = isBetween ? 'between' : isBelow ? 'below' : isAbove ? 'above' : null;

      const filteredProducts = applyFilters(mCollections, mTypes, mColors, priceNum1, priceDir, priceNum2);
      const hasProductFilters = mCollections.length > 0 || mTypes.length > 0 || mColors.length > 0 || mSizes.length > 0 || priceNum1 !== null;

      // ── SIGNAL EXTRACTION ───────────────────────────────────────────────
      const actsCart      = terms.some(t => ['cart', 'bag', 'basket'].includes(t));
      const actsWL        = terms.some(t => ['wishlist', 'favorites', 'favourite', 'favorite', 'save', 'saved'].includes(t));
      const actsBulk      = terms.some(t => ['bulk', 'retail', 'wholesale'].includes(t));
      const actsInv       = terms.some(t => ['inventory', 'restock', 'restocking', 'stock', 'stocklevel', 'threshold', 'qty', 'amount'].includes(t));
      const actsStaff     = terms.some(t => ['staff', 'worker', 'member', 'admin', 'registration', 'registrations', 'registered', 'user', 'users'].includes(t));
      const actsMetrics   = terms.some(t => ['report', 'revenue', 'profit', 'metric', 'overview', 'system', 'maintenance', 'activity', 'pending', 'dispatch', 'latest'].includes(t)) || actsStaff;

      const isAddVerb    = terms.some(t => ['add', 'insert', 'put', 'place', 'set', 'create'].includes(t)) || terms.some(t => ['buy', 'purchase', 'get', 'order', 'checkout', 'cop', 'pay', 'finish', 'restock'].includes(t));
      const isRemoveVerb = terms.some(t => ['remove', 'delete', 'drop', 'take', 'ditch', 'dump'].includes(t));
      const isClearVerb  = terms.some(t => ['clear', 'empty', 'wipe', 'reset', 'nuke'].includes(t));
      const isKeepVerb   = terms.some(t => ['keep', 'just', 'only', 'leave'].includes(t));
      const isCheckVerb  = terms.some(t => ['check', 'list', 'show', 'view', 'display', 'see'].includes(t)) || ['is', 'are', 'did', 'have', 'was', 'how', 'what', 'who'].some(w => rawTokens[0] === w || rawTokens.slice(0, 3).includes(w));
      const isCheckout   = terms.includes('checkout') || (terms.some(t => ['buy', 'purchase', 'order', 'pay', 'finish'].includes(t)) && !hasProductFilters);
      const isInfoVerb   = terms.some(t => ['detail', 'info', 'information', 'profile', 'business', 'retailer', 'company'].includes(t));
      const isModVerb    = isKeepVerb || terms.some(t => ['double', 'half', 'increase', 'reduce', 'decrease', 'halve', 'update'].includes(t));
      const isQAVerb     = ['is', 'are', 'did', 'have', 'was', 'how'].some(w => rawTokens[0] === w || rawTokens.slice(0, 3).includes(w));
      const isAll        = terms.some(t => ['all', 'every', 'each', 'everything'].includes(t));

      // Check strict structural branches
      let resolvedTargets: string[] = [];
      if (actsCart || (isAddVerb && !hasProductFilters)) resolvedTargets.push('Cart');
      if (actsWL || terms.some(t => ['save', 'favorite', 'wish'].includes(t))) resolvedTargets.push('Wishlist');
      if (actsBulk || terms.some(t => ['business', 'retailer', 'company'].includes(t))) resolvedTargets.push('Bulk');
      if (actsInv || (isAddVerb && terms.some(t=>['restock'].includes(t)))) resolvedTargets.push('Inventory');
      if (actsStaff) resolvedTargets.push('Staff');
      // Expand implicit collisions ("buy in bulk" -> Cart + Bulk -> Bulk overrides Cart locally)
      if (resolvedTargets.includes('Cart') && resolvedTargets.includes('Bulk')) {
          resolvedTargets = resolvedTargets.filter(t => t !== 'Cart');
      }

      // 1) Verify structural logic: Reject ambiguous multi-targets
      if (resolvedTargets.length > 1) {
          if ((isStaffUser) && (resolvedTargets.includes('Inventory') || resolvedTargets.includes('Staff'))) {
              endResponse(`Your query is ambiguous because it refers to multiple discrete operations (${resolvedTargets.join(' and ')}). Please pick one branch at a time.`);
              return;
          } else if (resolvedTargets.includes('Staff') || resolvedTargets.includes('Inventory')) {
              // Hide from standard customers
              endResponse("I couldn't clearly map your query to a standard shopping action. Are you talking about your Cart or Wishlist?");
              return;
          } else {
              endResponse(`Your query is combining commands for your ${resolvedTargets.join(' and ')}. Please separate your requests!`);
              return;
          }
      }

      const activeTarget = resolvedTargets[0] || null;

      // 2) Unrecognized Target Prompting (Replacing old "Ambiguous target branch before anything else")
      if (!activeTarget && !actsMetrics && (isAddVerb || isRemoveVerb || isClearVerb || isModVerb)) {
          const options = [
             { label: 'Cart', action: `Cart ${userInput}` },
             { label: 'Wishlist', action: `Wishlist ${userInput}` }
          ];
          if (isStaffUser) options.push({ label: 'Inventory', action: `Inventory ${userInput}` });
          if ((isAdminUser) && isAddVerb) options.push({ label: 'Staff', action: `Staff ${userInput}` });
          
          updatePending({ action: 'ambiguous', qty, collection: mCollections[0]||null, type: mTypes[0]||null, size: mSizes[0]||null, originalQuery: userInput, payload: null });
          endResponse("Where should I apply this action?", options);
          return;
      }

      // Map strict targets to execution variables
      const targetCart = activeTarget === 'Cart';
      const targetWL   = activeTarget === 'Wishlist';
      const targetBulk = activeTarget === 'Bulk';
      const targetBoth = targetCart || targetWL || targetBulk;

      const isStaffReq = activeTarget === 'Inventory' || actsMetrics;
      const isAdminReq = activeTarget === 'Staff' || terms.some(t => ['report', 'revenue', 'maintenance', 'restart', 'system', 'systemstatus', 'profit', 'admin', 'metric', 'overview'].includes(t));

      // ── BRANCH RESOLUTION ────────────────────────────────────────────────
      let branch = "3) Unknown";
      let subBranch = "N/A";
      let logOutput = "";

      // Logging Utility
      const log = (msg: string) => { logOutput = msg; };
      const finalLog = () => {
        console.group(`%c AXO CONCIERGE NLP `, 'background:#111; color:#0f0; padding:2px 5px; border-radius:3px;');
        console.log(`%cPROMPT:%c "${userInput}"`, 'font-weight:bold; color:#aaa', 'color:#fff');
        console.log(`%cKEYWORDS:%c ${terms.join(', ')}`, 'font-weight:bold; color:#aaa', 'color:#0ff');
        console.log(`%cBRANCH:%c ${branch} -> ${subBranch}`, 'font-weight:bold; color:#aaa', 'color:#f0f');
        console.log(`%cCONDITIONS:%c filters:${hasProductFilters}, all:${isAll}, cart:${targetCart}, wl:${targetWL}`, 'font-weight:bold; color:#aaa', 'color:#ff0');
        console.log(`%cOUTPUT:%c ${logOutput}`, 'font-weight:bold; color:#aaa', 'color:#fff');
        console.groupEnd();
      };

      // ── ADMIN / STAFF BRANCHES ───────────────────────────────────────────

      if (isAdminReq || (isAdminUser && actsMetrics)) {
          if (isAdminUser) {
             branch = "Admin Action";
             try {
                const head = authService.getAuthHeader();
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                
                if (terms.includes('revenue')) {
                    const r = await fetch(`${API_URL}/api/admin/dashboard/metrics`, { headers: head }).then(d=>d.json());
                    endResponse(`Admin: Total revenue is LKR ${r.data?.totalRevenue?.toLocaleString() || 0}.`);
                    log(branch); finalLog(); return;
                } else if (terms.includes('profit')) {
                    const r = await fetch(`${API_URL}/api/admin/dashboard/metrics`, { headers: head }).then(d=>d.json());
                    endResponse(`Admin: Estimated profit is LKR ${r.data?.estimatedProfit?.toLocaleString() || 0}.`);
                    log(branch); finalLog(); return;
                } else if ((terms.includes('add') || terms.includes('create')) && terms.includes('staff')) {
                    updatePending({ action: 'create_staff_username', qty: 0, collection: null, type: null, size: null, payload: {} });
                    endResponse("Let's create a new staff account. What should the username be?");
                    log(branch); finalLog(); return;
                } else if (terms.includes('staff') || terms.includes('users') || terms.includes('active') || terms.includes('registration') || terms.includes('registrations')) {
                    const r = await fetch(`${API_URL}/api/admin/users`, { headers: head }).then(d=>d.json());
                    const allUsers = r.data || [];
                    const counts = allUsers.reduce((acc: any, u: any) => {
                        acc[u.role] = (acc[u.role] || 0) + 1;
                        return acc;
                    }, {});
                    const now = Date.now();
                    const newLast24 = allUsers.filter((u: any) => u.createdAt && (now - new Date(u.createdAt).getTime()) < 24 * 60 * 60 * 1000).length;
                    
                    const roleBreakdown = `\n• Customers: ${counts['CUSTOMER'] || 0}\n• Staff: ${counts['STAFF'] || 0}\n• Admin: ${counts['ADMIN'] || 0}\n• Retailers: ${counts['RETAILER'] || 0}\n\nTotal Users: ${allUsers.length}\nNew Users (Past 24h): ${newLast24}`;
                    endResponse(`Admin Hub — User Metrics:${roleBreakdown}`);
                    log(branch); finalLog(); return;
                } else if (terms.includes('metric') || terms.includes('overview') || terms.includes('products')) {
                    const r = await fetch(`${API_URL}/api/admin/dashboard/metrics`, { headers: head }).then(d=>d.json());
                    endResponse(`Admin Metrics: ${r.data?.totalOrders || 0} total orders, ${r.data?.totalBulkOrders || 0} bulk orders. Total products in catalog: ${r.data?.totalProducts || 0}.`);
                    log(branch); finalLog(); return;
                }
                // Fallthrough to staff checks for admins if no specific admin keyword matched
             } catch (e) {
                endResponse("Admin: Network error fetching data.");
                log(branch); finalLog(); return;
             }
          }
      }

      if (isStaffReq || (isStaffUser && actsMetrics)) {
          if (isStaffUser) {
             branch = "Staff Action";
             try {
                const head = authService.getAuthHeader();
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                
                if (terms.includes('restock') || terms.includes('update')) {
                     if (mCollections.length > 0 && mTypes.length > 0) {
                         const match = realProducts.find(p => p.name.toLowerCase().includes(mCollections[0].toLowerCase()) && p.name.toLowerCase().includes(mTypes[0].toLowerCase()));
                         if (match) {
                             const addAmt = qty > 1 ? qty : 50;
                             updatePending({ action: 'confirm_restock', qty: 0, collection: null, type: null, size: null, payload: { productId: match.id, name: match.name, newAmount: addAmt } });
                             endResponse(`Critical Action: Are you sure you want to securely restock +${addAmt} units of '${match.name}'? (yes/no)`, [
                                 { label: 'Yes', action: 'yes' }, { label: 'No', action: 'no' }
                             ]);
                             log(branch); finalLog(); return;
                         }
                     }
                }
                
                if (terms.includes('stock') || terms.includes('inventory') || terms.includes('levels') || terms.includes('alert') || terms.includes('threshold') || terms.includes('healthy') || terms.includes('restocking')) {
                     const r = await fetch(`${API_URL}/api/staff/low-stock`, { headers: head }).then(d=>d.json());
                     const ls = r.data || [];
                     if (ls.length === 0) endResponse("Staff: Inventory levels are healthy! No items below threshold.");
                     else endResponse(`Staff: Warning! ${ls.length} items are low on stock. For example: '${ls[0]?.name}' only has ${ls[0]?.stockQuantity} units left.`);
                } else if (terms.includes('registrations') || terms.includes('registered') || terms.includes('user') || terms.includes('signup')) {
                     const r = await fetch(`${API_URL}/api/staff/activity`, { headers: head }).then(d=>d.json());
                     const reg = r.data?.recentRegistrations || [];
                     
                     // Try to get full counts if allowed (admin role check)
                     let roleBreakdown = "";
                     try {
                         const ur = await fetch(`${API_URL}/api/admin/users`, { headers: head }).then(d=>d.json());
                         const allUsers = ur.data || [];
                         if (Array.isArray(allUsers)) {
                             const counts = allUsers.reduce((acc: any, u: any) => {
                                 acc[u.role] = (acc[u.role] || 0) + 1;
                                 return acc;
                             }, {});
                             const now = Date.now();
                             const newLast24 = allUsers.filter((u: any) => u.createdAt && (now - new Date(u.createdAt).getTime()) < 24 * 60 * 60 * 1000).length;
                             
                             roleBreakdown = `\n• Customers: ${counts['CUSTOMER'] || 0}\n• Staff: ${counts['STAFF'] || 0}\n• Admin: ${counts['ADMIN'] || 0}\n• Retailers: ${counts['RETAILER'] || 0}\n\nTotal Users: ${allUsers.length}\nNew Users (Past 24h): ${newLast24}`;
                         }
                     } catch (e) {}

                     if (roleBreakdown) {
                         endResponse(`Staff Hub — User Metrics:${roleBreakdown}`);
                     } else {
                         if (reg.length === 0) endResponse("Staff: No recent registrations found in the activity log.");
                         else {
                             const names = reg.slice(0, 3).map((u:any) => u.username).join(', ');
                             endResponse(`Staff: Found ${reg.length} recent registrations. Latest users: ${names}.`);
                         }
                     }
                } else if (terms.includes('pending') || terms.includes('dispatch') || terms.includes('order')) {
                     const r = await fetch(`${API_URL}/api/staff/activity`, { headers: head }).then(d=>d.json());
                     const orders = r.data?.recentOrders || [];
                     const pending = orders.filter((o:any)=>o.status==='PENDING').length;
                     endResponse(`Staff: There are exactly ${pending} retail orders pending dispatch right now out of ${orders.length} recent orders.`);
                } else if (terms.includes('bulk') || terms.includes('total') || terms.includes('count')) {
                     const r = await fetch(`${API_URL}/api/admin/dashboard/metrics`, { headers: head }).then(d=>d.json());
                     endResponse(`Staff: We have processed ${r.data?.totalOrders || 0} retail orders and ${r.data?.totalBulkOrders || 0} bulk orders.`);
                } else {
                     const r = await fetch(`${API_URL}/api/staff/activity`, { headers: head }).then(d=>d.json());
                     const orders = r.data?.recentOrders || [];
                     const reg = r.data?.recentRegistrations || [];
                     endResponse(`Staff: Current activity summary: ${orders.length} recent orders and ${reg.length} new registrations.`);
                }
             } catch (e) {
                endResponse("Staff Action failed due to network error.");
             }
             log(branch); finalLog(); return;
          }
          // If NOT staff, fall through silently to default response
      }

      // Determine Branch
      if (isAddVerb || isRemoveVerb || isClearVerb || isModVerb || targetBoth) {
        branch = "2) Action";
        if (isAddVerb) subBranch = isAll || hasProductFilters ? "2.1.2) Add based on condition" : "2.1.1) Add individual";
        else if (isRemoveVerb) subBranch = isAll || hasProductFilters ? "2.2.2) Remove based on condition" : "2.2.1) Remove individual";
        else if (isModVerb) {
           if (isKeepVerb) subBranch = "2.5.3) Keep certain items";
           else if (terms.some(t => ['double','half','increase','reduce'].includes(t))) subBranch = "2.5.1/2) Quantity modifiers";
           else subBranch = "2.5) Cart actions";
        }
        else if (isClearVerb) subBranch = "2.2/2.4) Clear Cart/Wishlist";
        else if (isCheckVerb) subBranch = "Cart/Wishlist check";
      } else {
        branch = "1) Info";
        if (hasProductFilters || isCheckVerb) subBranch = "1.1) Product info";
        else if (terms.some(t => ['contact','support','help'].includes(t))) subBranch = "1.2) Contact info";
        else if (terms.some(t => ['shipping','delivery','return'].includes(t))) subBranch = "1.3) Shipping policy";
      }



      // ── EXECUTION ───────────────────────────────────────────────────────

      // A: Context Handling (Clarification)
      let activePendingAction = pendingActionRef.current;
      if (activePendingAction) {
         const act = activePendingAction.action;
         if (act === 'create_staff_username') {
            updatePending({ ...activePendingAction, action: 'create_staff_email', payload: { username: userInput } });
            endResponse(`Got it. What's the email for ${userInput}?`);
            log('Staff Creation: Prompted email'); finalLog(); return;
         } else if (act === 'create_staff_email') {
            updatePending({ ...activePendingAction, action: 'create_staff_password', payload: { ...activePendingAction.payload, email: userInput } });
            endResponse(`Okay, and what's the temporary password for ${activePendingAction.payload.username}?`);
            log('Staff Creation: Prompted password'); finalLog(); return;
         } else if (act === 'create_staff_password') {
            const p = { ...activePendingAction.payload, password: userInput };
            updatePending({ ...activePendingAction, action: 'confirm_create_staff', payload: p });
            endResponse(`Critical Action: Are you sure you want to securely create a staff member named '${p.username}' with email '${p.email}'? (yes/no)`, [
               { label: 'Yes', action: 'yes' }, { label: 'No', action: 'no' }
            ]);
            log('Staff Creation: Await Confirmation'); finalLog(); return;
         }

        const isUnrelated = (activePendingAction.action === 'ambiguous' && !targetBoth && (isAddVerb || isRemoveVerb || mCollections.length > 0 || mTypes.length > 0)) ||
                            (activePendingAction.action !== 'ambiguous' && !activePendingAction.collection && mCollections.length === 0 && (isModVerb || targetBoth)) ||
                            (activePendingAction.action !== 'ambiguous' && !activePendingAction.type && mTypes.length === 0 && (isModVerb || targetBoth));

        if (isUnrelated) { activePendingAction = null; updatePending(null); }
      }

      if (activePendingAction) {
        if (activePendingAction.action === 'ambiguous') {
          const target = targetCart ? 'cart' : targetWL ? 'wishlist' : null;
          if (target) {
            updatePending(null);
            processResponse(activePendingAction.originalQuery + ' ' + target);
            return;
          }
          log("Asking for cart/wishlist target");
          endResponse("I'm sorry, I still didn't catch which one. Did you mean your **cart** or **wishlist**?", [{ label: 'Cart', action: 'Cart ' + activePendingAction.originalQuery }, { label: 'Wishlist', action: 'Wishlist ' + activePendingAction.originalQuery }]);
          finalLog();
          return;
        }

        if (activePendingAction.action === 'set_company' || activePendingAction.action === 'set_contact_person' || activePendingAction.action === 'set_contact_email' || activePendingAction.action === 'set_address' || activePendingAction.action === 'set_notes') {
            const val = userInput;
            if (activePendingAction.action === 'set_company') { bulk.setInfo({ companyName: val }); updatePending({ ...activePendingAction, action: 'set_contact_person' }); endResponse(`Company set to **${val}**. Now, who is the **Contact Person**?`); }
            else if (activePendingAction.action === 'set_contact_person') { bulk.setInfo({ contactPerson: val }); updatePending({ ...activePendingAction, action: 'set_contact_email' }); endResponse(`Contact person set to **${val}**. What is the **Email address**?`); }
            else if (activePendingAction.action === 'set_contact_email') { bulk.setInfo({ contactEmail: val }); updatePending({ ...activePendingAction, action: 'set_address' }); endResponse(`Email set to **${val}**. Where should we send the items? (**Delivery Address**)`); }
            else if (activePendingAction.action === 'set_address') { bulk.setInfo({ deliveryAddress: val }); updatePending({ ...activePendingAction, action: 'set_notes' }); endResponse(`Address set. Any **Special Notes** or delivery instructions? (Say "none" if N/A)`); }
            else if (activePendingAction.action === 'set_notes') { bulk.setInfo({ notes: val.toLowerCase()==='none' ? '' : val }); updatePending(null); endResponse("Got it! Your retailer profile is updated and ready."); }
            return;
        }

        const coll = activePendingAction.collection || mCollections[0] || null;
        const type = activePendingAction.type || mTypes[0] || null;

        if (!coll) {
          updatePending({ ...activePendingAction, collection: null, type });
          endResponse("Which brand?", Array.from(new Set(PRODUCTS.map(p => p.collection))).map(c => ({ label: c, action: c })));
          log("Asking for brand"); finalLog(); return;
        }
        if (!type) {
          updatePending({ ...activePendingAction, collection: coll, type: null });
          const opts = Array.from(new Set(PRODUCTS.filter(p => p.collection.toLowerCase() === coll.toLowerCase()).map(p => p.type))).map(t => ({ label: t, action: t }));
          endResponse(`Got it, ${coll}. Which type?`, opts);
          log("Asking for type"); finalLog(); return;
        }

        const matchP = PRODUCTS.find(p => p.collection.toLowerCase() === coll.toLowerCase() && p.type.toLowerCase() === type.toLowerCase());
        const realProduct = matchP ? getRealProduct(matchP) : null;
        if (!realProduct) { updatePending(null); endResponse(`I couldn't find a **${coll} ${type}** in our catalog.`); log("Product not found"); finalLog(); return; }

        let size = activePendingAction.size;
        const needsSize = !realProduct.sizes?.includes('One Size') && realProduct.category !== 'Caps';
        if (needsSize && !size) {
          if (mSizes.length > 0) size = mSizes[0];
          else {
            updatePending({ ...activePendingAction, collection: coll, type, size: null });
            endResponse(`What size for the **${coll} ${type}**?`, realProduct.sizes.map(s => ({ label: s, action: s })));
            log("Asking for size"); finalLog(); return;
          }
        }
        execSingle(activePendingAction.action, realProduct, activePendingAction.qty, needsSize ? (size || 'M') : 'One Size');
        updatePending(null);
        log("Completed pending action"); finalLog(); return;
      }

      // ── BULK / RETAIL BRANCH ───────────────────────────────────────────
      if (targetBulk) {
        branch = "Bulk Order";
        
        // Retailer Info Sub-branch
        if (isInfoVerb || terms.includes('profile')) {
          if (isClearVerb) {
            bulk.setInfo({ companyName: '', contactPerson: '', contactEmail: '', deliveryAddress: '', notes: '' });
            endResponse("Your retailer information has been cleared.");
          } else if (isAddVerb || terms.includes('update') || terms.includes('change') || terms.includes('edit')) {
            updatePending({ action: 'set_company', qty: 1, collection: null, type: null, size: null });
            endResponse("Let's update your business details. First, what is your **Company / Brand Name**?");
          } else {
            const i = bulk.info;
            const infoText = i.companyName 
              ? `Retailer Info:\n- **Company:** ${i.companyName}\n- **Person:** ${i.contactPerson}\n- **Email:** ${i.contactEmail}\n- **Address:** ${i.deliveryAddress}\n- **Notes:** ${i.notes || 'None'}`
              : "No business information found. Say 'Update business info' to set it up.";
            endResponse(infoText);
          }
          log("Bulk: Managed retailer info"); finalLog(); return;
        }

        // Checkout Bulk
        if (isCheckout) {
          updatePending({ action: 'confirm_checkout_bulk', qty: 1, collection: null, type: null, size: null });
          endResponse("Are you ready to submit this bulk order?", [{label: 'Yes, Submit', action: 'Yes'}, {label: 'No', action: 'No'}]);
          log("Bulk: Checkout confirmation prompt"); finalLog(); return;
        }

        // Help / Total / Discount
        if (isCheckVerb || terms.includes('total') || terms.includes('discount') || terms.includes('cost')) {
          if (terms.includes('discount')) {
            const disc = getBulkDiscount(bulk.totalQty);
            endResponse(`Because you have **${bulk.totalQty}** items in total, you get a **${disc.pct}%** discount which amounts to **LKR ${bulk.discountAmt}**`);
          } else {
            if (bulk.items.length === 0) endResponse("Your bulk order is currently empty.");
            else endResponse(`Bulk Order Total:\n- Subtotal: LKR ${bulk.subtotal}\n- Discount: LKR ${bulk.discountAmt} (${getBulkDiscount(bulk.totalQty).pct}%)\n**Grand Total: LKR ${bulk.grandTotal}**`);
          }
          log("Bulk: Checked total/discount"); finalLog(); return;
        }

        // Clear Bulk
        if (isClearVerb || (isRemoveVerb && isAll && !hasProductFilters)) {
          updatePending({ action: 'confirm_clear_bulk', qty: 1, collection: null, type: null, size: null });
          endResponse("Delete your **entire bulk order**? This cannot be undone.", [{label: 'Yes, Clear', action: 'Yes'}, {label: 'No, Keep it', action: 'No'}]);
          log("Bulk: Clear confirmation prompt"); finalLog(); return;
        }

        // Double / Half / More / Less
        if (isModVerb) {
          if (terms.includes('double')) {
            bulk.items.forEach(i => bulk.changeQty(i.product.id, i.size, i.qty * 2));
            endResponse("Bulk order quantities doubled!");
          } else if (terms.includes('half')) {
            bulk.items.forEach(i => bulk.changeQty(i.product.id, i.size, Math.floor(i.qty / 2)));
            endResponse("Bulk order quantities halved!");
          } else if (terms.some(t => ['more', 'increase'].includes(t))) {
             bulk.items.forEach(i => bulk.changeQty(i.product.id, i.size, i.qty + qty));
             endResponse(`Added ${qty} more of each item in bulk!`);
          } else if (terms.some(t => ['less', 'reduce', 'remove'].includes(t))) {
             bulk.items.forEach(i => bulk.changeQty(i.product.id, i.size, i.qty - qty));
             endResponse(`Reduced each item in bulk by ${qty}.`);
          }
          log("Bulk: Modifiers applied"); finalLog(); return;
        }

        // Add to Bulk
        if (isAddVerb) {
          if (mCollections.length > 0 && mTypes.length > 0) {
            const matchP = PRODUCTS.find(p => p.collection.toLowerCase() === mCollections[0] && p.type.toLowerCase() === mTypes[0]);
            const realP = matchP ? getRealProduct(matchP) : null;
            if (!realP) { endResponse(`I couldn't find a **${mCollections[0]} ${mTypes[0]}**.`); log("Bulk: Not found"); finalLog(); return; }
            
            let size = mSizes[0];
            const needsSize = !realP.sizes?.includes('One Size') && realP.category !== 'Caps';
            if (needsSize && !size) {
               updatePending({ action: 'ambiguous' as any, qty, collection: mCollections[0], type: mTypes[0], size: null, originalQuery: userInput }); // Using ambiguous as a generic prompt state
               endResponse(`What size for the bulk **${realP.name}**?`, realP.sizes.map(s => ({ label: s, action: s })));
               log("Bulk: Asking size"); finalLog(); return;
            }
            const finalSize = needsSize ? size : 'One Size';
            bulk.addItem(realP, finalSize, qty);
            endResponse(`Added ${qty} **${realP.name}** (${finalSize}) to your bulk order!`);
            log("Bulk: Added item"); finalLog(); return;
          }
        }

        endResponse("For bulk orders, you can say things like 'Buy in bulk 40 Phantom Tees L', 'Clear bulk order', 'What is my bulk total', or 'Double bulk'.");
        log("Bulk: Help displayed"); finalLog(); return;
      }

      // Branch 2: Action
      if (branch === "2) Action") {
        if (isAddVerb && (actsCart || targetCart) && terms.some(t => ['wishlist', 'favorite', 'favourite', 'saved'].includes(t)) && !hasProductFilters) {
            if (wishlist.items.length === 0) {
               endResponse("Your wishlist is currently empty, nothing to add to cart.");
            } else {
               let addedCount = 0;
               wishlist.items.forEach(wItem => {
                   const rp = getRealProduct({ collection: wItem.name.split(' ')[0], type: wItem.name.split(' ').slice(1).join(' '), color: '', price: 0, description: '' } as any) || wItem;
                   if (rp) {
                     const needsSize = rp.sizes && !rp.sizes.includes('One Size') && rp.category !== 'Caps';
                     const s = needsSize ? (rp.sizes.includes('M') ? 'M' : rp.sizes[0]) : 'One Size';
                     execRaw('add_cart', rp, 1, s);
                     addedCount++;
                   }
               });
               endResponse(`Added ${addedCount} item(s) from your wishlist to your cart!`);
            }
            log("Cart: Added from wishlist"); finalLog(); return;
        }

        const target = targetWL && !targetCart ? 'wishlist' : 'cart';

        // Check/List (if no add/remove/mod)
        if (isCheckVerb && !isAddVerb && !isRemoveVerb && !isModVerb && !isClearVerb) {
          if (target === 'cart') {
            if (cart.items.length === 0) endResponse("Your cart is currently empty.");
            else endResponse(`You have ${cart.totalItems} item(s) in your cart:\n${cart.items.map(i => `• **${i.product.name}** (Size ${i.size}) x ${i.qty}`).join('\n')}\n\n**Total:** LKR ${cart.subtotal}`);
          } else {
            if (wishlist.items.length === 0) endResponse("Your wishlist is empty.");
            else endResponse(`Your Wishlist:\n${wishlist.items.map(i => `• **${i.name}** — LKR ${i.price}`).join('\n')}`);
          }
          log(`Checked ${target}`); finalLog(); return;
        }

        // Checkout Cart
        if (isCheckout && target === 'cart') {
          updatePending({ action: 'confirm_checkout_cart', qty: 1, collection: null, type: null, size: null });
          endResponse("Ready to place your order?", [{label: 'Yes, Checkout', action: 'Yes'}, {label: 'No', action: 'No'}]);
          log("Cart: Checkout confirmation prompt"); finalLog(); return;
        }

        // Q&A Logic (Is total... Do I have...)
        if (isQAVerb) {
          if ((terms.includes('total') || terms.includes('cost')) && priceNum1 !== null && priceDir && target === 'cart') {
            const sub = cart.subtotal;
            const res = priceDir === 'above' ? sub > priceNum1 : sub < priceNum1;
            endResponse(`${res ? 'Yes!' : 'No —'} your cart total is LKR ${sub}, which is ${res ? '' : 'not '}${priceDir} LKR ${priceNum1}.`);
            log("Q&A: Price total check"); finalLog(); return;
          }
          if (hasProductFilters) {
            const inList = target === 'cart' 
              ? cart.items.some(i => (mCollections.length === 0 || mCollections.every(c => i.product.name.toLowerCase().includes(c))) && (mTypes.length === 0 || mTypes.every(t => i.product.name.toLowerCase().includes(t))) && (mSizes.length === 0 || mSizes.includes(i.size)))
              : wishlist.items.some(i => (mCollections.length === 0 || mCollections.every(c => i.name.toLowerCase().includes(c))) && (mTypes.length === 0 || mTypes.every(t => i.name.toLowerCase().includes(t))));
            endResponse(inList ? `Yes, that item is in your ${target}.` : `No, I don't see that in your ${target}.`);
            log("Q&A: Product existence check"); finalLog(); return;
          }
        }

        // 2.5 Logic (Modifiers)
        if (isModVerb) {
          if (isKeepVerb) {
            if (!hasProductFilters) {
              endResponse("Please specify what you want to keep (e.g., 'Keep only Timeless items'). Prompt again.");
              log("Keep operation without filters"); finalLog(); return;
            }
            let removedCount = 0;
            if (target === 'cart') {
              [...cart.items].forEach(item => {
                const matchesFilter = filteredProducts.some(fp => { const rp = getRealProduct(fp); return rp && rp.id === item.product.id; });
                const matchesSize = mSizes.length === 0 || mSizes.includes(item.size);
                if (!(matchesFilter && matchesSize)) { cart.changeQty(item.product.id, item.size, -item.qty); removedCount++; }
              });
            } else {
              [...wishlist.items].forEach(item => {
                const matchesFilter = filteredProducts.some(fp => { const rp = getRealProduct(fp); return rp && rp.id === item.id; });
                if (!matchesFilter) { wishlist.removeItem(item.id); removedCount++; }
              });
            }
            endResponse(`Kept matching items and removed ${removedCount} others from your ${target}.`);
            log(`${target}: Keep operation completed`); finalLog(); return;
          }
          if (target === 'cart') {
            if (terms.includes('double')) { cart.items.forEach(i => cart.changeQty(i.product.id, i.size, i.qty)); endResponse("Cart doubled!"); log("Cart doubled"); finalLog(); return; }
            if (terms.includes('half')) { cart.items.forEach(i => cart.changeQty(i.product.id, i.size, -Math.floor(i.qty/2))); endResponse("Cart halved!"); log("Cart halved"); finalLog(); return; }
          }
        }

        // 2.1/2.2/2.3/2.4 Add/Remove
        const actionType = (isAddVerb ? 'add_' : 'remove_') + target;

        // Bulk (All) / Clear
        if (isAll || isClearVerb || (isRemoveVerb && hasProductFilters && mCollections.length === 0 && mTypes.length > 0)) {
          if (!hasProductFilters) {
            if (isClearVerb || isRemoveVerb) {
                updatePending({ action: `confirm_clear_all_${target}` as any, qty, collection: null, type: null, size: null });
                endResponse(`Are you sure you want to clear your **entire ${target}**?`, [{label: 'Yes, Clear it', action: 'Yes'}, {label: 'No, Keep it', action: 'No'}]);
                log(`Confirming clear all ${target}`); finalLog(); return;
            }
            if (isAddVerb) {
               updatePending({ action: `confirm_add_all_${target}` as any, qty, collection: null, type: null, size: null });
               endResponse(`Did you mean to add one of EVERY item to your ${target}?`, [{label: 'Yes', action: 'Yes'}, {label: 'No', action: 'No'}]);
               log(`Confirming add all ${target}`); finalLog(); return;
            }
          }

          const targetList = isAddVerb ? filteredProducts : filteredProducts.filter(p => { 
            const rp = getRealProduct(p); 
            return rp && (target === 'cart' ? cart.items.some(i => i.product.id === rp.id) : wishlist.items.some(i => i.id === rp.id));
          });
          if (targetList.length === 0 && !isClearVerb) { endResponse(`No matching items found to ${isAddVerb ? 'add' : 'remove'}.`); log("Bulk: No matches"); finalLog(); return; }
          
          let affectedCount = 0;
          if (target === 'cart' && (isRemoveVerb || isClearVerb)) {
             [...cart.items].forEach(item => {
                 const matchesFilter = filteredProducts.some(fp => { const rp = getRealProduct(fp); return rp && rp.id === item.product.id; });
                 const matchesSize = mSizes.length === 0 || mSizes.includes(item.size);
                 if (matchesFilter && matchesSize) { cart.changeQty(item.product.id, item.size, -item.qty); affectedCount++; }
             });
          } else if (target === 'wishlist' && (isRemoveVerb || isClearVerb)) {
             [...wishlist.items].forEach(item => {
                 const matchesFilter = filteredProducts.some(fp => { const rp = getRealProduct(fp); return rp && rp.id === item.id; });
                 if (matchesFilter) { wishlist.removeItem(item.id); affectedCount++; }
             });
          } else {
             targetList.forEach(p => {
                const rp = getRealProduct(p);
                if (rp) {
                  const s = mSizes[0] || (rp.sizes?.includes('M') ? 'M' : rp.sizes?.[0]) || 'One Size';
                  execRaw(actionType, rp, qty, s);
                  affectedCount++;
                }
             });
          }
          endResponse(`${isAddVerb ? 'Added' : 'Removed'} ${affectedCount} item(s) matching your criteria.`);
          log(`Bulk ${isAddVerb ? 'Add' : 'Remove'} success`); finalLog(); return;
        }

        // Individual
        if (mCollections.length > 0 && mTypes.length > 0) {
          const matchP = PRODUCTS.find(p => p.collection.toLowerCase() === mCollections[0] && p.type.toLowerCase() === mTypes[0]);
          const realP = matchP ? getRealProduct(matchP) : null;
          if (!realP) { endResponse("I couldn't find that specific item."); log("Single: Not found"); finalLog(); return; }
          
          const needsSize = !realP.sizes?.includes('One Size') && realP.category !== 'Caps';
          if (needsSize && mSizes.length === 0) {
            updatePending({ action: actionType as any, qty, collection: mCollections[0], type: mTypes[0], size: null });
            endResponse(`What size for the **${mCollections[0]} ${mTypes[0]}**?`, realP.sizes.map(s => ({ label: s, action: s })));
            log("Single: Prompting for size"); finalLog(); return;
          }
          execSingle(actionType, realP, qty, mSizes[0] || 'M');
          log("Single Add/Remove success"); finalLog(); return;
        }

        // If we reached here in Action, but didn't have enough info:
        updatePending({ action: (isAddVerb || isRemoveVerb) ? ((isAddVerb ? 'add_' : 'remove_') + target) as any : 'ambiguous', qty, collection: mCollections[0]||null, type: mTypes[0]||null, size: mSizes[0]||null, originalQuery: userInput });
        if (!mCollections[0]) { endResponse("Which brand?", Array.from(new Set(PRODUCTS.map(p => p.collection))).map(c => ({ label: c, action: c }))); log("Ambiguous: Asking brand"); }
        else { endResponse(`Got it, ${mCollections[0]}. Which type?`, Array.from(new Set(PRODUCTS.filter(p => p.collection.toLowerCase() === mCollections[0].toLowerCase()).map(p => p.type))).map(t => ({ label: t, action: t }))); log("Ambiguous: Asking type"); }
        finalLog(); return;
      }
      // Branch 1: Info
      if (branch === "1) Info") {
        if (subBranch === "1.1) Product info") {
           if (filteredProducts.length === 0) { endResponse("I couldn't find any products matching that."); log("Info: No products match"); finalLog(); return; }
           if (filteredProducts.length === 1) {
             const p = filteredProducts[0];
             endResponse(`**${p.collection} ${p.type}**: LKR ${p.price}. ${p.description}`);
           } else {
             endResponse(`I found ${filteredProducts.length} matches:\n${filteredProducts.slice(0,5).map(p => `• **${p.collection} ${p.type}** (LKR ${p.price})`).join('\n')}`);
           }
           log("Info: Product list displayed"); finalLog(); return;
        }
        
        // FAQ Fallback
        const scored = CHAT_DATA.map(entry => {
          let score = 0;
          for (const kw of entry.keywords) if (terms.includes(kw.toLowerCase())) score += 10;
          if (entry.subKeywords) for (const sub of entry.subKeywords) if (terms.includes(sub.toLowerCase())) score += 5;
          return { entry, score };
        }).filter(x => x.score > 0).sort((a,b) => b.score - a.score);

        if (scored.length > 0) {
          endResponse(scored[0].entry.response);
          log(`FAQ match: ${scored[0].entry.keywords[0]}`);
        } else {
          endResponse("I'm not sure how to help with that. Try asking about products, shipping, or saying 'Add to cart'.");
          log("Fallback: No match");
        }
        finalLog(); return;
      }

  };

  // ─────────────── rendering ─────────────────────────────────────────────

  const formatMessage = (text: string) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  const handleQuickAction = (msgId: string, text: string) => {
    // Remove options from the clicked message so they can't be reused
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, options: [] } : m));
    
    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    processResponse(text);
  };

  return (
    <div className="axo-chat-container">
      <button className="axo-chat-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Contact Concierge">
        {isOpen
          ? <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg>
          : <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
        }
      </button>

      {isOpen && (
        <div className="axo-chat-window">
          <div className="axo-chat-header">
            <h3>AXO Concierge</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="axo-chat-help" onClick={() => setShowHelp(true)} title="Help">?</button>
              <button className="axo-chat-close" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
          </div>

          {/* ── Help Modal ──────────────────────────────────── */}
          {showHelp && (
            <div className="axo-help-overlay" onClick={() => setShowHelp(false)}>
              <div className="axo-help-modal" onClick={e => e.stopPropagation()}>
                <div className="axo-help-header">
                  <h3>How to use AXO Concierge</h3>
                  <button className="axo-chat-close" onClick={() => setShowHelp(false)}>&times;</button>
                </div>
                <div className="axo-help-body">

                  <div className="axo-help-section">
                    <h4>🛒 Cart Actions</h4>
                    <ul>
                      <li><strong>Add to cart</strong> — <em>"Buy Timeless Cap"</em>, <em>"Add Phantom Hoodie XL to cart"</em>, <em>"Purchase 2 Impossible Tees M"</em></li>
                      <li><strong>Remove from cart</strong> — <em>"Remove Timeless Cap from cart"</em>, <em>"Delete Phantom Tee from cart"</em></li>
                      <li><strong>Check cart</strong> — <em>"Check my cart"</em>, <em>"Show cart"</em>, <em>"What's in my bag?"</em></li>
                      <li><strong>Clear cart</strong> — <em>"Clear my cart"</em>, <em>"Empty cart"</em>, <em>"Wipe my bag"</em></li>
                    </ul>
                  </div>

                  <div className="axo-help-section">
                    <h4>💛 Wishlist Actions</h4>
                    <ul>
                      <li><strong>Save to wishlist</strong> — <em>"Save Timeless Tee to wishlist"</em>, <em>"Add Phantom Cap to favorites"</em></li>
                      <li><strong>Remove from wishlist</strong> — <em>"Remove Timeless Tee from wishlist"</em></li>
                      <li><strong>Check wishlist</strong> — <em>"Show my wishlist"</em>, <em>"Check favorites"</em></li>
                      <li><strong>Clear wishlist</strong> — <em>"Clear my wishlist"</em></li>
                    </ul>
                  </div>

                  <div className="axo-help-section">
                    <h4>📦 Bulk & Retail Orders</h4>
                    <ul>
                      <li><strong>Bulk add</strong> — <em>"Buy in bulk 40 Phantom Tees L"</em>, <em>"Add 100 Timeless Caps to retail order"</em></li>
                      <li><strong>Business Profile</strong> — <em>"Update business info"</em>, <em>"Show retailer details"</em>, <em>"Clear business profile"</em></li>
                      <li><strong>Checkout</strong> — <em>"Checkout bulk order"</em>, <em>"Finish and pay"</em></li>
                      <li><strong>Modify bulk</strong> — <em>"Double bulk order"</em>, <em>"Add 10 more of each item in bulk"</em></li>
                      <li><strong>Bulk info</strong> — <em>"What is my bulk discount?"</em></li>
                      <li><strong>Clear bulk</strong> — <em>"Clear bulk order"</em></li>
                    </ul>
                  </div>

                  <div className="axo-help-section">
                    <h4>🔢 Quantity Modifiers</h4>
                    <ul>
                      <li><strong>Double</strong> — <em>"Double my cart"</em></li>
                      <li><strong>Halve</strong> — <em>"Half my cart"</em></li>
                      <li><strong>Increase / Decrease</strong> — <em>"Increase cart by 2"</em>, <em>"Reduce cart by 1"</em></li>
                      <li><strong>Keep only</strong> — <em>"Keep only Timeless items in cart"</em></li>
                      <li><strong>Set exact sizes</strong> — <em>"Keep only XL sizes" → Cart</em>, <em>"Just M and L for each item"</em></li>
                      <li><strong>Set exact qty</strong> — <em>"Set just 2 of each item" → Cart</em></li>
                    </ul>
                  </div>

                  <div className="axo-help-section">
                    <h4>❓ Questions &amp; Queries</h4>
                    <ul>
                      <li><strong>Total check</strong> — <em>"Is total above 5000"</em>, <em>"Is my cart below LKR 3000"</em></li>
                      <li><strong>Item check</strong> — <em>"Did I buy Timeless Cap?"</em>, <em>"Are all caps in my cart?"</em></li>
                      <li><strong>Product info</strong> — <em>"How much is Phantom Hoodie?"</em>, <em>"What color is Timeless Tee?"</em></li>
                      <li><strong>Browse</strong> — <em>"Show me all tees"</em>, <em>"Show black items"</em>, <em>"Items under 3000"</em></li>
                    </ul>
                  </div>

                  <div className="axo-help-section">
                    <h4>ℹ️ General</h4>
                    <ul>
                      <li><strong>Shipping</strong> — <em>"How does shipping work?"</em></li>
                      <li><strong>Returns</strong> — <em>"What's the return policy?"</em></li>
                      <li><strong>Sizing</strong> — <em>"Size guide"</em>, <em>"How do your hoodies fit?"</em></li>
                      <li><strong>Contact</strong> — <em>"Contact support"</em>, <em>"Help"</em></li>
                      <li><strong>Cancel</strong> — <em>"Cancel"</em>, <em>"Never mind"</em> (cancels any pending prompt)</li>
                    </ul>
                  </div>

                  <div className="axo-help-section">
                    <h4>💡 Tips</h4>
                    <ul>
                      <li><strong>"buy/purchase/order"</strong> always implies <strong>cart</strong></li>
                      <li><strong>"save/favorite"</strong> always implies <strong>wishlist</strong></li>
                      <li><strong>"add/remove"</strong> without a target will prompt you to pick <strong>cart</strong> or <strong>wishlist</strong></li>
                      <li>You can say sizes like <strong>S, M, L, XL, XXL</strong></li>
                      <li>Brands: <strong>Timeless, Impossible, Phantom, Xenonix</strong></li>
                      <li>Types: <strong>Tee, Hoodie, Cap</strong></li>
                      <li>Currency: <strong>"LKR"</strong>, <strong>"Rs"</strong>, or <strong>"rupees"</strong> are all understood</li>
                    </ul>
                  </div>

                  {(authService.getRole() === 'STAFF' || authService.getRole() === 'ADMIN') && (
                    <div className="axo-help-section">
                      <h4>🛡️ Staff Commands</h4>
                      <ul>
                        <li><strong>Inventory Alerts</strong> — <em>"Show low stock items"</em>, <em>"Are there any items below threshold?"</em>, <em>"What needs restocking immediately?"</em>, <em>"Check stock levels"</em>, <em>"Any inventory alerts?"</em></li>
                        <li><strong>Order Tracking</strong> — <em>"How many pending orders?"</em>, <em>"Show today's orders count"</em>, <em>"List pending dispatch"</em>, <em>"Show recent activity"</em>, <em>"Show total orders count"</em>, <em>"Show total bulk orders count"</em>, <em>"List all pending retail orders"</em>, <em>"List all pending bulk orders"</em></li>
                        <li><strong>User Activity</strong> — <em>"Show recent registrations"</em>, <em>"Who registered recently?"</em>, <em>"Latest users"</em></li>
                        <li><strong>Catalog</strong> — <em>"What is our total number of products?"</em></li>
                      </ul>
                    </div>
                  )}

                  {authService.getRole() === 'ADMIN' && (
                    <div className="axo-help-section">
                      <h4>⚙️ Admin Commands</h4>
                      <ul>
                        <li><strong>Metrics & Revenue</strong> — <em>"Show total revenue"</em>, <em>"Show estimated profit"</em>, <em>"Admin metrics overview"</em></li>
                        <li><strong>User Management</strong> — <em>"How many staff users do we have?"</em></li>
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          <div className="axo-chat-messages">
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className={`axo-msg axo-msg-${m.sender}`}>
                  {formatMessage(m.text)}
                </div>
                {m.options && m.options.length > 0 && m.sender === 'bot' && (
                  <div className="axo-msg-options">
                    {m.options.map((opt, i) => (
                      <button key={i} className="axo-msg-opt-btn" onClick={() => handleQuickAction(m.id, opt.action)} disabled={isTyping}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="axo-typing">
                <div className="axo-dot"/><div className="axo-dot"/><div className="axo-dot"/>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          <div className="axo-chat-options-container">
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Suggested</div>
            <div className="axo-chat-options">
              {currentFAQs.map((faq, i) => (
                <button 
                  key={i} 
                  className="axo-opt-btn" 
                  onClick={() => handleQuickAction('fixed-opt', faq.action)}
                >
                  {faq.label}
                </button>
              ))}
            </div>
          </div>

          <div className="axo-chat-input-row">
            <input
              type="text"
              placeholder="Ask the concierge..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button className="axo-chat-send" onClick={handleSend} disabled={!inputValue.trim() || isTyping}>
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
