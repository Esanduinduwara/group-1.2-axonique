import { useState, useEffect, useRef } from 'react';
import './AXOConcierge.css';
import { CHAT_DATA, GREETING_MESSAGE, DEFAULT_RESPONSE, SYNONYMS, PRODUCTS } from './chatbot_data';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
}

export default function AXOConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', text: GREETING_MESSAGE, sender: 'bot', timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    processResponse(userMsg.text);
  };

  const processResponse = (userInput: string) => {
    setIsTyping(true);
    
    // Normalize input
    const rawTerms = userInput.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    // Map to base words via Synonyms
    const terms = rawTerms.map(t => SYNONYMS[t] || t);

    setTimeout(() => {
      let botResponseText = DEFAULT_RESPONSE;

      const askingPrice = terms.includes('price') || terms.includes('cost') || (terms.includes('how') && terms.includes('much'));
      const askingColor = terms.includes('color') || terms.includes('colour');
      const askingType = terms.includes('type') || terms.includes('style');

      const mentionedCollections = terms.filter(t => PRODUCTS.some(p => p.collection.toLowerCase() === t));
      const mentionedTypes = terms.filter(t => PRODUCTS.some(p => p.type.toLowerCase() === t));
      const mentionedColors = terms.filter(t => PRODUCTS.some(p => p.color.toLowerCase() === t));

      // Parse prices for filters
      const numbers = rawTerms.map(t => parseInt(t.replace(/[^0-9]/g, ''))).filter(n => !isNaN(n));
      const isUnder = rawTerms.includes('under') || rawTerms.includes('below') || rawTerms.includes('less');
      const isOver = rawTerms.includes('over') || rawTerms.includes('above') || rawTerms.includes('more');

      let filteredProducts = [...PRODUCTS];

      // Apply price filters
      if (numbers.length > 0) {
        if (isUnder) filteredProducts = filteredProducts.filter(p => p.price <= numbers[0]);
        else if (isOver) filteredProducts = filteredProducts.filter(p => p.price >= numbers[0]);
        else if (numbers.length >= 2 && rawTerms.includes('between')) {
            const min = Math.min(numbers[0], numbers[1]);
            const max = Math.max(numbers[0], numbers[1]);
            filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max);
        }
      }

      // Apply attribute filters
      if (mentionedCollections.length > 0) {
        filteredProducts = filteredProducts.filter(p => mentionedCollections.includes(p.collection.toLowerCase()));
      }
      if (mentionedTypes.length > 0) {
        filteredProducts = filteredProducts.filter(p => mentionedTypes.includes(p.type.toLowerCase()));
      }
      if (mentionedColors.length > 0) {
        filteredProducts = filteredProducts.filter(p => mentionedColors.includes(p.color.toLowerCase()));
      }

      // If no specific attributes or prices were mentioned, don't just dump all products
      const isSearchingProducts = mentionedCollections.length > 0 || mentionedTypes.length > 0 || mentionedColors.length > 0 || numbers.length > 0;

      if (isSearchingProducts) {
        if (filteredProducts.length === 0) {
          botResponseText = "We couldn't find any products matching those exact criteria. Try adjusting your search!";
        } else if (filteredProducts.length === 1) {
          const targetProduct = filteredProducts[0];
          const productFullName = `${targetProduct.collection} ${targetProduct.type}`;

          if (askingPrice && askingColor) {
             const templates = [
               `It is a ${targetProduct.color.toLowerCase()} ${targetProduct.type.toLowerCase()} priced at LKR ${targetProduct.price}.`,
               `The ${productFullName} comes in ${targetProduct.color.toLowerCase()} and costs LKR ${targetProduct.price}.`,
               `Available in ${targetProduct.color.toLowerCase()}, you can grab this for LKR ${targetProduct.price}.`
             ];
             botResponseText = templates[Math.floor(Math.random() * templates.length)];
          } else if (askingPrice) {
             botResponseText = `LKR ${targetProduct.price}`;
          } else if (askingColor) {
             botResponseText = `The ${productFullName} comes in ${targetProduct.color}.`;
          } else if (askingType) {
             botResponseText = `It is a ${targetProduct.type}.`;
          } else {
             const generalTemplates = [
               `The ${productFullName} ${targetProduct.description}. It's ${targetProduct.color.toLowerCase()} in color and priced at LKR ${targetProduct.price}.`,
               `The ${productFullName} ${targetProduct.description}. Tailored for comfort and style, it comes in ${targetProduct.color.toLowerCase()} and starts at LKR ${targetProduct.price}.`,
               `Discover the ${productFullName}: it ${targetProduct.description}. This ${targetProduct.color.toLowerCase()} piece is available for LKR ${targetProduct.price}.`
             ];
             botResponseText = generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
          }
        } else {
          // Multiple products match - Using actual bullet points for the list
          let listStr = filteredProducts.map(p => `• **${p.collection} ${p.type}** (${p.color}): LKR ${p.price}. ${p.description}`).join('\n');
          botResponseText = `We found ${filteredProducts.length} options for you:\n${listStr}`;
        }
      } else {
        // 2. Fallback to basic FAQ matching 
        let bestMatch = null;
        let highestScore = 0;

        for (const entry of CHAT_DATA) {
          let score = 0;
          let matches = 0;

          for (const kw of entry.keywords) {
            if (terms.includes(kw.toLowerCase())) {
              matches++;
            }
          }

          if (matches > 0) {
            score = matches * 10;
            if (entry.subKeywords) {
              for (const sub of entry.subKeywords) {
                if (terms.includes(sub.toLowerCase())) {
                  score += 5;
                }
              }
            }
            if (score > highestScore) {
              highestScore = score;
              bestMatch = entry;
            }
          }
        }

        if (bestMatch) {
          botResponseText = bestMatch.response;
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  /**
   * Simple formatter to handle **bold** text and newlines
   */
  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split('**').map((part, j) => (
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        ))}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const handleQuickAction = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    processResponse(text);
  };

  return (
    <div className="axo-chat-container">
      {/* Toggle Button */}
      <button 
        className="axo-chat-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contact Concierge"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg>
        ) : (
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="axo-chat-window">
          <div className="axo-chat-header">
            <h3>AXO Concierge</h3>
            <button className="axo-chat-close" onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          <div className="axo-chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`axo-msg axo-msg-${m.sender}`}>
                {formatMessage(m.text)}
              </div>
            ))}
            {isTyping && (
              <div className="axo-typing">
                <div className="axo-dot"></div>
                <div className="axo-dot"></div>
                <div className="axo-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Options */}
          <div className="axo-chat-options-container" style={{ padding: '0 20px' }}>
             <div className="axo-chat-options">
               <button className="axo-opt-btn" onClick={() => handleQuickAction("Price of Timeless Cap")}>Timeless Cap</button>
               <button className="axo-opt-btn" onClick={() => handleQuickAction("Tell me about Impossible Hoodie")}>Impossible Hoodie</button>
               <button className="axo-opt-btn" onClick={() => handleQuickAction("Size Guide")}>Sizing</button>
             </div>
          </div>

          <div className="axo-chat-input-row">
            <input 
              type="text" 
              placeholder="Ask the concierge..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="axo-chat-send" onClick={handleSend} disabled={!inputValue.trim()}>
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
