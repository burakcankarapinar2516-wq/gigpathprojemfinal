import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../lib/utils';
import { Plus, X, Trash2, Receipt, TrendingDown, Camera, Loader2, Sparkles } from 'lucide-react';
import { Expense } from '../types';
import { toast } from 'sonner';

export function ExpensesView() {
  const { data, addExpense, deleteExpense } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Yazılım',
    isRecurring: false
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount || !newExpense.date) return;

    addExpense(newExpense as Omit<Expense, 'id'>);
    setIsAdding(false);
    setNewExpense({
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'Yazılım',
      isRecurring: false
    });
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleAutoCategorize = async () => {
    if (!newExpense.title || newExpense.title.length < 3) {
      toast.error('Lütfen önce geçerli bir başlık girin.');
      return;
    }

    setIsCategorizing(true);
    try {
      const response = await fetch('/api/categorize-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newExpense.title })
      });

      if (!response.ok) {
        throw new Error('Kategori önerisi alınamadı');
      }

      const result = await response.json();
      setNewExpense(prev => ({ ...prev, category: result.category as any }));
      toast.success(`Kategori "${result.category}" olarak ayarlandı.`);
    } catch (error: any) {
      toast.error(error.message || 'Kategori belirlenemedi.');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) throw new Error("Dosya okunamadı.");

        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Tarama hatası');
        }

        const result = await response.json();
        
        setNewExpense(prev => ({
          ...prev,
          title: result.title || prev.title,
          amount: result.amount || prev.amount,
          date: result.date || prev.date,
          category: result.category || prev.category
        }));
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const expenses = data.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Giderler</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">İşinizle ilgili masrafları ve abonelikleri takip edin.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Gider Ekle
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Toplam Gider</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">
            {isScanning && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Fiş taranıyor, yorumlanıyor...</p>
              </div>
            )}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                Yeni Gider Ekle
              </h3>
              <button disabled={isScanning} onClick={() => setIsAdding(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Otomatik Doldur</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fiş fotoğrafını yükleyerek bilgileri çekin.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleScanClick}
                  disabled={isScanning}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Tara
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Başlık</label>
                <input required type="text" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" placeholder="Örn: Adobe Creative Cloud" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tutar</label>
                  <input required type="number" min="0" step="0.01" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tarih</label>
                  <input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kategori</label>
                    <button 
                      type="button" 
                      onClick={handleAutoCategorize}
                      disabled={isCategorizing || !newExpense.title}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isCategorizing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                      Yapay Zeka
                    </button>
                  </div>
                  <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2">
                    <option value="Yazılım">Yazılım</option>
                    <option value="Donanım">Donanım</option>
                    <option value="Ofis">Ofis</option>
                    <option value="Pazarlama">Pazarlama</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={newExpense.isRecurring} onChange={e => setNewExpense({...newExpense, isRecurring: e.target.checked})} className="rounded text-blue-600 w-4 h-4" />
                    Tekrarlayan (Aylık)
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">İptal</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Gider Geçmişi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tarih</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Açıklama</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tip</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(expense.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{expense.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {expense.isRecurring ? (
                       <span className="text-xs font-medium text-blue-500">Aylık Abonelik</span>
                    ) : (
                       <span className="text-xs font-medium text-slate-400">Tek Seferlik</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(expense.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteExpense(expense.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Henüz gider eklenmemiş.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
