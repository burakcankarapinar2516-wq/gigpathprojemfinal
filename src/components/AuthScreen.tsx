import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  KeyRound, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

type AuthMode = 'login' | 'register' | 'verify_email';

const parseResponse = async (res: Response) => {
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      return { error: text ? (text.length > 120 ? text.substring(0, 120) + '...' : text) : `Sunucu hatası (${res.status})` };
    }
  } catch (e) {
    return { error: `Sunucudan geçersiz yanıt alındı (${res.status})` };
  }
};

export function AuthScreen() {
  const { login } = useStore();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verification specific state fields
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (authMode === 'login') {
      if (!email || !password) {
        toast.error('Lütfen e-posta ve şifrenizi girin.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        const data = await parseResponse(res);
        
        if (!res.ok) {
          toast.error(data.error || 'Giriş yapılamadı.');
        } else {
          toast.success(data.message || 'Giriş başarılı!');
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          login();
        }
      } catch (err: any) {
        toast.error(`Sunucuyla bağlantı kurulamadı: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    } 
    else if (authMode === 'register') {
      if (!name || !email || !password) {
        toast.error('Lütfen tüm alanları doldurun.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Şifreler uyuşmuyor.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: cleanEmail, password })
        });
        const data = await parseResponse(res);
        
        if (!res.ok) {
          toast.error(data.error || 'Kayıt başarısız.');
        } else {
          toast.success('Kayıt oluşturuldu! Geri sayım olmadan giriş yapılıyor...');
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          login();
        }
      } catch (err: any) {
        toast.error(`Giriş başarısız, ağ hatası: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 5) {
      toast.error('Lütfen geçerli bir kod girin.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: verificationCode })
      });
      const data = await parseResponse(res);
      
      if (!res.ok) {
        toast.error(data.error || 'Kod doğrulanamadı.');
      } else {
        toast.success(data.message || 'E-posta doğrulandı! Hoş geldiniz.');
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        login();
      }
    } catch (err: any) {
      toast.error(`Bağlantı hatası: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error('E-posta adresi eksik.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await parseResponse(res);
      
      if (!res.ok) {
        toast.error(data.error || 'Kod gönderilemedi.');
      } else {
        toast.success('Doğrulama kodu yeniden gönderildi!');
        setSimulatedCode(data.simulated_code || '');
      }
    } catch (err: any) {
      toast.error(`İşlem başarısız oldu: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Aesthetic Glowing Backdrop elements */}
      <div className="absolute -top-40 -left-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-slate-900/30 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[440px] bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_24px_48px_-15px_rgba(0,0,0,0.7)] relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3.5 mb-2 group">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:border-blue-500/50 transition-all duration-500">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/15 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <svg className="w-6.5 h-6.5 text-blue-500 group-hover:text-blue-400 transition-colors duration-300" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 16C6 10.4772 10.4772 6 16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 11L21 16L16 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 16H21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-2xl tracking-tight group-hover:text-blue-400 transition-colors leading-none">
                gig<span className="text-blue-500 font-light">path</span>
              </span>
              <span className="text-[10px] text-slate-550 tracking-wider uppercase font-mono mt-1 leading-none">
                freelance asistanı
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2 max-w-[300px]">
            Finans, fatura ve müşteri yönetim portalı.
          </p>
        </div>

        {/* Content selector based on AuthMode */}
        <AnimatePresence mode="wait">
          {/* LOGIN & REGISTER FLOW */}
          {(authMode === 'login' || authMode === 'register') && (
            <motion.div
              key="auth-login-register"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Sliding Tab Switcher */}
              <div className="p-1 bg-slate-950 border border-slate-800/80 rounded-2xl flex gap-1 mb-6 relative">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setName('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-colors duration-250 relative z-10 ${
                    authMode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-355'
                  }`}
                >
                  {authMode === 'login' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-slate-800 border border-slate-700/50 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center justify-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> Giriş Yap
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-colors duration-250 relative z-10 ${
                    authMode === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-355'
                  }`}
                >
                  {authMode === 'register' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-slate-800 border border-slate-700/50 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center justify-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Kayıt Ol
                  </span>
                </button>
              </div>

              {/* Form Container */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {authMode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      key="name-field"
                      className="overflow-hidden"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input 
                          type="text"
                          required={authMode === 'register'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                          placeholder="Adınız Soyadınız"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="E-posta Adresiniz"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder={authMode === 'register' ? "Şifre (En az 6 karakter)" : "Şifreniz"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {authMode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      key="confirm-password-field"
                      className="overflow-hidden"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"}
                          required={authMode === 'register'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                          placeholder="Şifreyi Onaylayın"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>



                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] disabled:pointer-events-none focus:ring-2 focus:ring-blue-500/50 mt-6 cursor-pointer"
                >
                  <span>{loading ? 'İşlem Sürüyor...' : (authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Doğrula')}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}

          {/* EMAIL VERIFICATION SCREEN */}
          {authMode === 'verify_email' && (
            <motion.div
              key="auth-verify-email"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-blue-950/45 border border-blue-855/30 text-blue-400 rounded-2xl mb-1">
                  <CheckCircle className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-white font-bold text-lg tracking-tight">E-posta Doğrulama</h3>
                <p className="text-xs text-slate-400 max-w-[320px]">
                  Güvenliğiniz için <span className="text-slate-100 font-medium">{email}</span> adresine 6 haneli doğrulama kodu gönderildi.
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-center tracking-[0.4em] font-mono text-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                    placeholder="000000"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setVerificationCode('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Vazgeç
                  </button>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length < 6}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer disabled:pointer-events-none"
                  >
                    {loading ? 'Doğrulanıyor...' : 'Kodu Onayla'}
                  </button>
                </div>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-blue-400 font-medium tracking-tight h-8 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Kodu Tekrar Gönder
                </button>
              </div>

              {/* Dynamic Simulated Test Environment Helper Box */}
              {simulatedCode && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-4 space-y-2 mt-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 font-mono">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span>YEREL SİMÜLASYON MODU</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    E-posta sunucusu (SMTP) bilgileri tanımlanmadığı için sistem taklit modunda çalışıyor. Gerçek e-posta göndermek için lütfen <code className="text-blue-300 font-semibold font-mono">SMTP_HOST</code>, <code className="text-blue-300 font-semibold font-mono">SMTP_PORT</code>, <code className="text-blue-300 font-semibold font-mono">SMTP_USER</code> ve <code className="text-blue-300 font-semibold font-mono">SMTP_PASS</code> bilgilerini <strong>Secrets</strong> panelinden ayarlayın.
                  </p>
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono mt-1">
                    <span className="text-xs text-slate-500">GÖNDERİLEN KOD:</span>
                    <span className="text-sm font-extrabold text-blue-400 select-all tracking-wider">{simulatedCode}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Trust Indicator or Helper Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-[11px] font-mono border-t border-slate-800/60 pt-5">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Verileriniz tarayıcınızda ve bulutta uçtan uca güvende</span>
        </div>
      </motion.div>
    </div>
  );
}

