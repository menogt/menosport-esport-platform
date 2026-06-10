import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, CreditCard, Filter, Minus, Package, Plus, Search, ShoppingBag, ShoppingCart, Sparkles, Truck } from 'lucide-react';
import { PRODUCTS, STORE_ORDERS } from '../data/dummy';

type CategoryFilter = 'all' | 'jersey' | 'hoodie' | 'accessory' | 'digital' | 'event_pass';

type CartLine = {
  productId: string;
  quantity: number;
};

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'jersey', label: 'Jerseys' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'accessory', label: 'Accessories' },
  { key: 'digital', label: 'Digital' },
  { key: 'event_pass', label: 'Event Passes' },
];

const orderStatusColor = {
  pending: '#ffd700',
  paid: '#00d4ff',
  packed: '#a855f7',
  shipped: '#f97316',
  completed: '#4ade80',
};

export function StorePage() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([{ productId: 'prd1', quantity: 1 }]);

  const filteredProducts = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return PRODUCTS.filter(product => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesQuery = !lowered || product.name.toLowerCase().includes(lowered) || product.description.toLowerCase().includes(lowered);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const cartItems = cart.map(line => ({ ...line, product: PRODUCTS.find(product => product.id === line.productId)! })).filter(line => line.product);
  const cartTotal = cartItems.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const found = prev.find(line => line.productId === productId);
      if (found) return prev.map(line => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const reduceCart = (productId: string) => {
    setCart(prev => prev.flatMap(line => {
      if (line.productId !== productId) return [line];
      if (line.quantity <= 1) return [];
      return [{ ...line, quantity: line.quantity - 1 }];
    }));
  };

  return (
    <div className="min-h-screen pt-24" style={{ background: '#08090f' }}>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-3xl p-8 border overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.14), rgba(168,85,247,0.14))', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="absolute top-0 right-0 w-72 h-72 opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.45), transparent 65%)' }} />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5" style={{ color: '#ffd700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.2)' }}>
                  <ShoppingBag className="w-3.5 h-3.5" /> Phase 12 storefront
                </span>
                <h1 className="text-white leading-none" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2.2rem, 7vw, 4.6rem)', fontWeight: 800 }}>Merch, passes, and digital drops.</h1>
                <p className="text-white/55 mt-4 max-w-2xl leading-relaxed">The store now has product cards, filters, cart interactions, checkout placeholder, stock states, and order tracking UI for future Stripe checkout.</p>
              </div>
            </motion.div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search merch, digital goods, passes..." className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {CATEGORIES.map(item => (
                  <button key={item.key} onClick={() => setCategory(item.key)} className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs transition-all" style={category === item.key ? { background: 'rgba(0,212,255,0.14)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.28)' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Filter className="w-3 h-3" /> {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-7">
              {filteredProducts.map((product, index) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group rounded-2xl overflow-hidden border" style={{ background: 'rgba(13,14,26,0.84)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className={`h-44 bg-gradient-to-br ${product.imageGradient} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] text-white" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>{product.badge}</div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <Package className="w-10 h-10 text-white/80 mb-2" />
                      <p className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.35rem', fontWeight: 800 }}>{product.name}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-white" style={{ fontWeight: 700 }}>{product.name}</p>
                        <p className="text-xs text-white/35 capitalize">{product.category.replace('_', ' ')}</p>
                      </div>
                      <p className="text-lg" style={{ color: '#ffd700', fontFamily: "'Rajdhani', sans-serif", fontWeight: 800 }}>${product.price}</p>
                    </div>
                    <p className="text-xs text-white/45 leading-relaxed min-h-[48px]">{product.description}</p>
                    {product.sizes && <p className="text-[10px] text-white/35 mt-3">Sizes: {product.sizes.join(' / ')}</p>}
                    <div className="flex items-center justify-between gap-3 mt-4">
                      <span className="text-[10px] px-2 py-1 rounded-full" style={{ color: product.stock > 20 ? '#4ade80' : '#ffd700', background: product.stock > 20 ? 'rgba(74,222,128,0.12)' : 'rgba(255,215,0,0.12)' }}>{product.stock} in stock</span>
                      <button onClick={() => addToCart(product.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 700 }}>
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-5">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.88)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Cart Preview</h2>
                  <p className="text-xs text-white/35">Checkout is a safe placeholder.</p>
                </div>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-black" style={{ background: '#00d4ff', fontWeight: 800 }}>{cartCount}</span>
              </div>
              <div className="p-5 space-y-3">
                {cartItems.length === 0 ? (
                  <p className="text-sm text-white/40">Cart is empty.</p>
                ) : cartItems.map(line => (
                  <div key={line.productId} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${line.product.imageGradient}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate" style={{ fontWeight: 700 }}>{line.product.name}</p>
                      <p className="text-xs text-white/35">${line.product.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => reduceCart(line.productId)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60" style={{ background: 'rgba(255,255,255,0.06)' }}><Minus className="w-3 h-3" /></button>
                      <span className="text-sm text-white w-4 text-center">{line.quantity}</span>
                      <button onClick={() => addToCart(line.productId)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60" style={{ background: 'rgba(255,255,255,0.06)' }}><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/50">Total</span>
                    <span style={{ color: '#ffd700', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 800 }}>${cartTotal}</span>
                  </div>
                  <button className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 700 }}>
                    <CreditCard className="w-4 h-4" /> Checkout Placeholder
                  </button>
                  <p className="text-[10px] text-white/30 mt-3 text-center">Stripe checkout can be connected later. No real payment happens here.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.88)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Recent Orders</h2>
              </div>
              {STORE_ORDERS.map(order => (
                <div key={order.id} className="px-5 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white" style={{ fontWeight: 700 }}>{order.customer}</p>
                      <p className="text-xs text-white/35">{order.items} item(s) · ${order.total}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color: orderStatusColor[order.status], background: `${orderStatusColor[order.status]}15` }}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Secure UI', icon: CheckCircle, color: '#4ade80' },
                { label: 'Shipping state', icon: Truck, color: '#f97316' },
                { label: 'Cart logic', icon: ShoppingCart, color: '#00d4ff' },
                { label: 'Digital drops', icon: Sparkles, color: '#a855f7' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-4 border" style={{ background: 'rgba(13,14,26,0.72)', borderColor: `${item.color}22` }}>
                  <item.icon className="w-4 h-4 mb-2" style={{ color: item.color }} />
                  <p className="text-xs text-white/55">{item.label}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
