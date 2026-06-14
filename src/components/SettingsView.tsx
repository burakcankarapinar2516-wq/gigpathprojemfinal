import React, { useState } from 'react';
import { useStore } from '../store';
import { Save, Bell, Globe, FileText, Lock, Mail, ShieldAlert, LogOut, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function SettingsView() {
  const { data, updateProfile, logout } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState('');
  const [profile, setProfile] = useState(data.profile);
  const [activeTab, setActiveTab] = useState<'general' | 'invoice' | 'notifications' | 'security'>('general');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profile);
    toast.success('Ayarlar başarıyla kaydedildi.');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `gigpath_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Veriler dışa aktarıldı (JSON)');
  };

  const handleCsvExport = () => {
    const invoices = data.invoices || [];
    const expenses = data.expenses || [];
    const projects = data.projects || [];
    
    // Projeler CSV
    const prjHeader = "Proje Adı,Müşteri,Platform,Durum,Tutar,Kayıtlı Süre(Dk),Oluşturulma\n";
    const prjCsv = projects.map(p => `"${p.title}","${p.clientName}","${p.platform}","${p.status}","${p.amount}","${Math.floor((p.trackedSeconds || 0)/60)}","${p.date}"`).join("\n");
    
    // Giderler CSV
    const expHeader = "Gider,Kategori,Tutar,Tarih\n";
    const expCsv = expenses.map(e => `"${e.title}","${e.category}","${e.amount}","${e.date}"`).join("\n");
    
    const combined = "---Projeler---\n" + prjHeader + prjCsv + "\n\n---Giderler---\n" + expHeader + expCsv;
    const dataStr = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(combined);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `gigpath_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Excel/CSV raporu dışa aktarıldı');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Uygulama Ayarları</h1>
        <p className="text-slate-500 dark:text-slate-400">GigPath yapılandırmasını ve tercihlerinizi özelleştirin.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeTab === 'general' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Globe className="w-5 h-5" /> Bölge ve Görünüm
          </button>
          <button 
            onClick={() => setActiveTab('invoice')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeTab === 'invoice' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <FileText className="w-5 h-5" /> Fatura & Finans
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeTab === 'notifications' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Bell className="w-5 h-5" /> Şablonlar & Bildirim
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeTab === 'security' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Lock className="w-5 h-5" /> Hesap & Güvenlik (Hesap Silme)
          </button>

          <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />

          <button 
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <LogOut className="w-5 h-5" /> Çıkış Yap
          </button>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">Bölge ve Görünüm Tercihleri</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Görünüm Teması</label>
                    <select 
                      value={profile.theme || 'system'} 
                      onChange={e => setProfile({...profile, theme: e.target.value as 'light' | 'dark' | 'system'})}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    >
                      <option value="system">Sistem Teması (Otomatik)</option>
                      <option value="light">Açık Mod (Light)</option>
                      <option value="dark">Karanlık Mod (Dark)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Varsayılan Dil</label>
                    <select 
                      value={profile.language || 'tr'} 
                      onChange={e => setProfile({...profile, language: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English (Coming Soon)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tarih Formatı</label>
                    <select 
                      value={profile.dateFormat || 'DD/MM/YYYY'} 
                      onChange={e => setProfile({...profile, dateFormat: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    >
                      <option value="DD/MM/YYYY">31/12/2026 (Avrupa)</option>
                      <option value="MM/DD/YYYY">12/31/2026 (ABD)</option>
                      <option value="YYYY-MM-DD">2026-12-31 (ISO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Varsayılan Para Birimi</label>
                    <select 
                      value={profile.currency || 'USD'} 
                      onChange={e => setProfile({...profile, currency: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">Dolar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">Sterlin (£)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Uygulama Rehberliği</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Uygulamayı ilk kez kullanmaya başlayanlar için hazırlanan interaktif tanıtım baloncuklarını ve yardımcı ipuçlarını yeniden etkinleştirerek sistemi keşfedin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      updateProfile({ hasCompletedTour: false });
                      toast.success('Hızlı rehber turu yeniden etkinleştirildi! Başlama alanına yönlendiriliyorsunuz.', { icon: '🤖' });
                      // Navigate to dashboard automatically
                      setTimeout(() => {
                        window.location.href = '/';
                        window.location.reload();
                      }, 1000);
                    }}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-150 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    İnteraktif Tanıtım Turunu Yeniden Başlat
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">Fatura ve Finans Hedefleri</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Saatlik Ücret ({profile.currency || 'USD'}/Saat)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={profile.hourlyRate || 0} 
                      onChange={e => setProfile({...profile, hourlyRate: parseFloat(e.target.value) || 0})} 
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">KDV / Vergi Oranı (%)</label>
                    <input 
                      type="number"
                      min="0"
                      step="1"
                      value={profile.taxRate || 0} 
                      onChange={e => setProfile({...profile, taxRate: parseFloat(e.target.value) || 0})} 
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aylık Gelir Hedefi</label>
                    <input 
                      type="number"
                      min="0"
                      step="100"
                      value={profile.monthlyIncomeTarget || ''} 
                      onChange={e => setProfile({...profile, monthlyIncomeTarget: parseFloat(e.target.value) || undefined})}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fatura Numarası Öneki</label>
                    <input 
                      type="text"
                      value={profile.invoicePrefix || 'INV-'} 
                      onChange={e => setProfile({...profile, invoicePrefix: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                      placeholder="Örn: INV-"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">İletişim ve E-posta Şablonları</h2>
                
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      Fatura Ödendi Bildirimi
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">E-posta Konusu</label>
                        <input 
                          value={profile.emailTemplates?.invoicePaidTitle || ''} 
                          onChange={e => setProfile({...profile, emailTemplates: {...profile.emailTemplates, invoicePaidTitle: e.target.value}})} 
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                          placeholder="Faturanız Ödendi" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          E-posta İçeriği <span className="text-xs font-normal opacity-70">(&#123;clientName&#125;, &#123;invoiceNumber&#125; değişkenlerini kullanabilirsiniz)</span>
                        </label>
                        <textarea 
                          value={profile.emailTemplates?.invoicePaidBody || ''} 
                          onChange={e => setProfile({...profile, emailTemplates: {...profile.emailTemplates, invoicePaidBody: e.target.value}})} 
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                          rows={4}
                          placeholder="Sayın {clientName}, {invoiceNumber} numaralı faturanızın ödemesi alınmıştır. Teşekkür ederiz." 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" />
                      Teslim Süresi Bildirimi
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">E-posta Konusu</label>
                        <input 
                          value={profile.emailTemplates?.deadlineTitle || ''} 
                          onChange={e => setProfile({...profile, emailTemplates: {...profile.emailTemplates, deadlineTitle: e.target.value}})} 
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                          placeholder="Teslim Süresi Yaklaşıyor - {projectTitle}" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          E-posta İçeriği <span className="text-xs font-normal opacity-70">(&#123;clientName&#125;, &#123;projectTitle&#125; değişkenlerini kullanabilirsiniz)</span>
                        </label>
                        <textarea 
                          value={profile.emailTemplates?.deadlineBody || ''} 
                          onChange={e => setProfile({...profile, emailTemplates: {...profile.emailTemplates, deadlineBody: e.target.value}})} 
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                          rows={4}
                          placeholder="Sayın {clientName}, {projectTitle} projenizin teslim süresi yaklaştığını hatırlatmak isteriz." 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">Hesap Güvenliği & Hesap Silme</h2>
                
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 rounded-xl p-5 mb-6">
                  <h4 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5" />
                    Kasa Şifrelemesi (AES-256)
                  </h4>
                  <p className="text-sm text-red-700/80 dark:text-red-300/80 mb-4 leading-relaxed">
                    Uygulama genelindeki tüm finansal dokümanlarınız ve bilgileriniz tarayıcı düzeyinde belirlediğiniz PIN kodu ile şifrelenmektedir. 
                    Unutulan bir PIN kodunun kurtarılması kriptolojik olarak mümkün değildir.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Otomatik Senkronizasyon</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">İnternet bağlantısı olduğunda verilerinizi otomatik olarak buluta yedekler.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={profile.autoSync ?? true}
                        onChange={e => setProfile({...profile, autoSync: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Verileri Dışa Aktar</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kasa içeriğinizi yedekleyin (JSON) veya Excel'e aktarın (CSV).</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={handleCsvExport}
                        className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-lg hover:bg-emerald-200 border border-emerald-200 dark:border-emerald-800 transition-colors"
                      >
                        CSV İndir
                      </button>
                      <button 
                        type="button"
                        onClick={handleExport}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors"
                      >
                        JSON Yedekle
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 mt-4">
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-300">Örnek Veri Yükle (Demo Modu)</h4>
                      <p className="text-xs text-amber-600 dark:text-amber-500/80 mt-1">Uygulamanın boş görünmemesi için örnek projeler ve faturalar yükleyin.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowDemoConfirm(true)}
                      className="px-4 py-2 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 text-sm font-bold rounded-lg hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors border border-amber-300 dark:border-amber-600"
                    >
                      Demo Verisi Yükle
                    </button>
                  </div>

                  {/* Tehlikeli Alan */}
                  <div className="border border-rose-200 dark:border-rose-900/40 rounded-2xl overflow-hidden mt-6 bg-rose-50/20 dark:bg-rose-950/5">
                    <div className="bg-rose-50 dark:bg-rose-950/25 px-5 py-3 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                      <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm uppercase tracking-wider">Tehlikeli Alan</h4>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Hesabı Kalıcı Olarak Sil</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Hesabınızı sildiğinizde, buluttaki tüm projeleriniz, faturalarınız ve kişisel verileriniz <strong>geri döndürülemez şekilde tamamen kalıcı olarak</strong> silinecektir.
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-rose-700 w-full sm:w-auto self-start sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hesabı Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 mt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end">
               <button 
                 type="submit"
                 className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow"
               >
                 <Save className="w-5 h-5" />
                 Değişiklikleri Kaydet
               </button>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeletePasswordConfirm('');
                }
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-6"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 font-sans tracking-tight">Hesabınızı Silin?</h3>
                  <p className="text-xs text-rose-500 font-semibold mt-0.5">Bu işlem geri alınamaz!</p>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
                <p>
                  Hesabınızı kalıcı olarak silmek üzeresiniz. Bu işlem gerçekleştikten sonra tüm verileriniz buluttan ve tarayıcınızdan tamamen temizlenecektir.
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                   Devam etmek için lütfen aşağıdaki alanları doldurarak şifrenizi doğrulayın:
                </p>
              </div>

              {/* Password Verification Area */}
              <div className="space-y-4 border-t border-b border-slate-100 dark:border-slate-800/80 py-4">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Mevcut Şifreniz</span>
                    <span className="text-rose-500 font-normal">* Zorunlu</span>
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    disabled={isDeleting}
                    placeholder="Mevcut şifreniz"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-medium"
                  />
                </div>
                
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Mevcut Şifreniz (Tekrar)</span>
                    <span className="text-rose-500 font-normal">* Zorunlu</span>
                  </label>
                  <input
                    type="password"
                    value={deletePasswordConfirm}
                    onChange={(e) => setDeletePasswordConfirm(e.target.value)}
                    disabled={isDeleting}
                    placeholder="Şifrenizi tekrar yazın"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-medium"
                  />
                  {deletePassword && deletePasswordConfirm && deletePassword !== deletePasswordConfirm && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">Girdiğiniz şifreler uyuşmamaktadır.</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                    setDeletePasswordConfirm('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  İptal Et
                </button>
                <button
                  type="button"
                  disabled={isDeleting || !deletePassword || deletePassword !== deletePasswordConfirm}
                  onClick={async () => {
                    if (!deletePassword) {
                      toast.error('Lütfen güvenlik doğrulaması için şifrenizi girin.');
                      return;
                    }
                    if (deletePassword !== deletePasswordConfirm) {
                      toast.error('Girdiğiniz şifreler uyuşmuyor.');
                      return;
                    }

                    setIsDeleting(true);
                    try {
                      const token = localStorage.getItem('auth_token');
                      const res = await fetch('/api/auth/delete-account', { 
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ password: deletePassword })
                      });
                      const dataRes = await res.json();
                      if (res.ok) {
                        toast.success(dataRes.message || 'Hesabınız başarıyla silindi.');
                        // Clear client status and navigate away
                        localStorage.removeItem('auth_token');
                        logout();
                        setShowDeleteConfirm(false);
                        setDeletePassword('');
                        setDeletePasswordConfirm('');
                      } else {
                        toast.error(dataRes.error || 'Bir hata oluştu.');
                      }
                    } catch (e) {
                      toast.error('Sunucuyla bağlantı kurulamadı.');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/40 text-white font-bold rounded-xl text-xs transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Evet, Hesabımı Sil
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-6"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                  <LogOut className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 font-sans tracking-tight">Çıkış Yapılsın mı?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Oturumunuz sonlandırılacaktır.</p>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Uygulamadan çıkış yapmak istediğinize emin misiniz? Tekrar girmek için bilgilerinizi kullanmanız gerekecektir.
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' });
                    } catch (e) {}
                    localStorage.removeItem('auth_token');
                    logout();
                    setShowLogoutConfirm(false);
                    window.location.reload();
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm hover:shadow"
                >
                  Çıkış Yap
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDemoConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoConfirm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-6"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 font-sans tracking-tight">Örnek Veri Yükle?</h3>
                  <p className="text-xs text-rose-500 font-semibold mt-0.5">Dikkat! Var olan tüm veriler silinir!</p>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p>
                  Mevcut tüm projeleriniz, müşterileriniz, faturalarınız ve giderleriniz <strong>tamamen silinecek</strong> ve yerine örnek veriler doldurulacaktır.
                </p>
                <p className="font-semibold text-xs text-amber-600 dark:text-amber-400">
                  Devam etmek istiyor musunuz?
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    useStore.getState().loadDemoData();
                    toast.success('Örnek veriler başarıyla yüklendi.');
                    setShowDemoConfirm(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm hover:shadow"
                >
                  Evet, Yükle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
