import React, { useState } from 'react';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { X, Save, User, Briefcase, Mail, MapPin, DollarSign, Percent, Settings, Sparkles, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data, updateProfile } = useStore();
  const [profile, setProfile] = useState(data.profile);
  const [activeTab, setActiveTab] = useState<'info' | 'finance'>('info');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profile);
    toast.success('Profil ve tercihleriniz başarıyla güncellendi.');
    onClose();
  };

  // Dynamic initial characters
  const getInitials = (fullName: string) => {
    if (!fullName) return 'GP';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-250">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800"
      >
        {/* Banner with modern mesh background */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-900/60 dark:via-indigo-900/50 dark:to-violet-950/40 border-b border-white/10 overflow-hidden flex justify-between items-center">
          <div className="absolute inset-0 bg-grid-white/[0.06] bg-center [mask-image:linear-gradient(180deg,white,transparent)]" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.75 text-[10px] font-bold tracking-wider text-blue-100 bg-white/15 backdrop-blur-sm rounded-full uppercase mb-1">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" /> Yeni Nesil Profil
            </span>
            <h3 className="font-extrabold text-white text-xl tracking-tight">
              Kullanıcı Hesabı & Tercihler
            </h3>
          </div>
          
          <button 
            type="button"
            onClick={onClose} 
            className="relative z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity preview strip */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-full blur-md opacity-40 dark:opacity-60" />
              <div className="relative w-16 h-16 bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 text-white rounded-full flex items-center justify-center text-xl font-black shadow-lg border-2 border-white dark:border-slate-900">
                {getInitials(profile.name)}
              </div>
              <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">
                {profile.name || 'Yeni Freelancer'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <Briefcase className="w-3.5 h-3.5 text-blue-500 stroke-[2]" /> {profile.title || 'Freelancer'}
              </p>
            </div>
          </div>

          {/* Quick tab controls */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'info' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'finance' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Finansal
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {activeTab === 'info' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Ad Soyad
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        value={profile.name} 
                        onChange={e => setProfile({...profile, name: e.target.value})} 
                        className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all" 
                        placeholder="Örn: Ahmet Yılmaz" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Mesleki Ünvan
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        value={profile.title} 
                        onChange={e => setProfile({...profile, title: e.target.value})} 
                        className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all" 
                        placeholder="Örn: Kıdemli Full-Stack Geliştirici" 
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email"
                      required
                      value={profile.email} 
                      onChange={e => setProfile({...profile, email: e.target.value})} 
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all" 
                      placeholder="adres@ornek.com" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Fatura Adresi
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea 
                      value={profile.address} 
                      onChange={e => setProfile({...profile, address: e.target.value})} 
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm resize-none h-24 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all" 
                      placeholder="Müşterilere kesilecek faturada görüntülenecek resmi adresiniz..." 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Saatlik Ücret
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={profile.hourlyRate || 0} 
                        onChange={e => setProfile({...profile, hourlyRate: parseFloat(e.target.value) || 0})} 
                        className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      KDV / Vergi Oranı (%)
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number"
                        min="0"
                        step="1"
                        value={profile.taxRate || 0} 
                        onChange={e => setProfile({...profile, taxRate: parseFloat(e.target.value) || 0})} 
                        className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Para Birimi
                    </label>
                    <select 
                      value={profile.currency || 'TRY'} 
                      onChange={e => setProfile({...profile, currency: e.target.value})}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">Dolar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">Sterlin (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Kullanıcı Arayüzü Teması
                    </label>
                    <select 
                      value={profile.theme || 'system'} 
                      onChange={e => setProfile({...profile, theme: e.target.value as 'light' | 'dark' | 'system'})}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 outline-none transition-all"
                    >
                      <option value="system">Sistem Teması (Otomatik)</option>
                      <option value="light">Açık Tema (Light)</option>
                      <option value="dark">Karanlık Tema (Dark)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors text-center"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Kaydet
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
