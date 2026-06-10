import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, CheckCircle, Lock, AlertCircle, ChevronRight } from 'lucide-react';
import { PAYMENT_METHODS } from '../data/dummy';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentName: string;
  entryFee: number;
}

type Step = 'method' | 'card' | 'processing' | 'success' | 'error';

export function PaymentModal({ isOpen, onClose, onSuccess, tournamentName, entryFee }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function formatCardNum(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (selectedMethod === 'card') {
      const rawCard = cardNum.replace(/\s/g, '');
      if (rawCard.length < 16) errs.cardNum = 'Enter a valid 16-digit card number';
      if (expiry.length < 5) errs.expiry = 'Enter a valid expiry (MM/YY)';
      if (cvv.length < 3) errs.cvv = 'Enter a 3-4 digit CVV';
      if (!cardName.trim()) errs.cardName = 'Name required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handlePay() {
    if (selectedMethod !== 'card') {
      simulatePayment();
      return;
    }
    if (!validate()) return;
    simulatePayment();
  }

  function simulatePayment() {
    setStep('processing');
    setTimeout(() => {
      const success = Math.random() > 0.1;
      setStep(success ? 'success' : 'error');
      if (success) setTimeout(() => { onSuccess(); onClose(); reset(); }, 1800);
    }, 2200);
  }

  function reset() {
    setStep('method');
    setSelectedMethod('card');
    setCardNum('');
    setExpiry('');
    setCvv('');
    setCardName('');
    setErrors({});
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={step !== 'processing' ? onClose : undefined}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <div className="font-bold text-white" style={{ fontFamily: 'Rajdhani', fontSize: '1.1rem' }}>Tournament Entry Fee</div>
              <div className="text-white/45 text-xs mt-0.5 truncate max-w-[240px]">{tournamentName}</div>
            </div>
            {step !== 'processing' && (
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/8 transition-colors">
                <X size={16} className="text-white/50" />
              </button>
            )}
          </div>

          <div className="p-5">
            {/* Amount card */}
            <div className="flex items-center justify-between p-4 rounded-xl mb-5" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <span className="text-white/60 text-sm">Entry fee</span>
              <span className="font-black text-2xl" style={{ fontFamily: 'Rajdhani', color: '#00d4ff' }}>${entryFee} USD</span>
            </div>

            {/* STEP: method */}
            {step === 'method' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-white/50 text-xs mb-3 uppercase tracking-wider font-semibold">Payment Method</p>
                <div className="space-y-2 mb-6">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                      style={{
                        background: selectedMethod === method.id ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${selectedMethod === method.id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <span className="text-xl">{method.icon}</span>
                      <span className="text-white text-sm font-medium">{method.label}</span>
                      <div className="ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: selectedMethod === method.id ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
                        {selectedMethod === method.id && <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }} />}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => selectedMethod === 'card' ? setStep('card') : handlePay()}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: '#000' }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* STEP: card details */}
            {step === 'card' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-white/50 text-xs mb-3 uppercase tracking-wider font-semibold">Card Details</p>
                <div className="space-y-3 mb-5">
                  {/* Card number */}
                  <div>
                    <div className="relative">
                      <input
                        value={cardNum}
                        onChange={e => setCardNum(formatCardNum(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${errors.cardNum ? '#ff4655' : 'rgba(255,255,255,0.1)'}`,
                          fontFamily: 'monospace',
                        }}
                      />
                      <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25" />
                    </div>
                    {errors.cardNum && <p className="text-xs mt-1" style={{ color: '#ff4655' }}>{errors.cardNum}</p>}
                  </div>
                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        value={expiry}
                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.expiry ? '#ff4655' : 'rgba(255,255,255,0.1)'}`, fontFamily: 'monospace' }}
                      />
                      {errors.expiry && <p className="text-xs mt-1" style={{ color: '#ff4655' }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <input
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="CVV"
                        type="password"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.cvv ? '#ff4655' : 'rgba(255,255,255,0.1)'}`, fontFamily: 'monospace' }}
                      />
                      {errors.cvv && <p className="text-xs mt-1" style={{ color: '#ff4655' }}>{errors.cvv}</p>}
                    </div>
                  </div>
                  {/* Cardholder name */}
                  <div>
                    <input
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.cardName ? '#ff4655' : 'rgba(255,255,255,0.1)'}` }}
                    />
                    {errors.cardName && <p className="text-xs mt-1" style={{ color: '#ff4655' }}>{errors.cardName}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                  <Lock size={12} style={{ color: '#4ade80' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Sandbox mode — no real charges</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('method')} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/8" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                    Back
                  </button>
                  <button onClick={handlePay} className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: '#000' }}>
                    <Lock size={14} /> Pay ${entryFee}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: processing */}
            {step === 'processing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }} />
                  <Lock size={20} className="absolute inset-0 m-auto" style={{ color: '#00d4ff' }} />
                </div>
                <p className="text-white font-semibold mb-1">Processing payment…</p>
                <p className="text-white/40 text-xs">Secure sandbox transaction</p>
              </motion.div>
            )}

            {/* STEP: success */}
            {step === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.3)' }}
                >
                  <CheckCircle size={32} style={{ color: '#4ade80' }} />
                </motion.div>
                <p className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Rajdhani' }}>REGISTERED!</p>
                <p className="text-white/40 text-sm">You've joined <span className="text-white/70">{tournamentName}</span></p>
              </motion.div>
            )}

            {/* STEP: error */}
            {step === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,70,85,0.15)', border: '2px solid rgba(255,70,85,0.3)' }}>
                  <AlertCircle size={32} style={{ color: '#ff4655' }} />
                </div>
                <p className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Rajdhani' }}>PAYMENT FAILED</p>
                <p className="text-white/40 text-sm mb-5">Sandbox declined the transaction. Try again.</p>
                <button onClick={() => setStep('method')} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: 'rgba(255,70,85,0.15)', color: '#ff4655', border: '1px solid rgba(255,70,85,0.25)' }}>
                  Try Again
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
