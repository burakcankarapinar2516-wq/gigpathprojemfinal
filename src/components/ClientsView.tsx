import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../lib/utils';
import { Users, Building2, Briefcase, Star, Search, Share2, Loader2 } from 'lucide-react';
import { Project } from '../types';
import { toast } from 'sonner';

export function ClientsView() {
  const { data } = useStore();
  const [loadingClient, setLoadingClient] = useState<string | null>(null);

  const handleSharePortal = async (clientName: string) => {
    try {
      setLoadingClient(clientName);
      const res = await fetch('/api/portal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName })
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Beklenmeyen hata');
      
      const url = `${window.location.origin}/portal/${responseData.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Portal bağlantısı kopyalandı!', { description: 'Müşteriniz ile paylaşabilirsiniz.' });
    } catch (error: any) {
      toast.error('Bağlantı oluşturulamadı', { description: error.message });
    } finally {
      setLoadingClient(null);
    }
  };

  const clients = useMemo(() => {
    const clientMap = new Map<string, {
      name: string,
      totalSpent: number,
      projectCount: number,
      activeProjects: number,
      lastProjectDate: string,
      platforms: Set<string>,
      avgSatisfaction: number,
      satisfactionCount: number
    }>();

    data.projects.forEach(p => {
      let earnings = p.amount;
      if (p.trackedSeconds && data.profile.hourlyRate) {
        earnings += (p.trackedSeconds / 3600) * data.profile.hourlyRate;
      }

      if (!clientMap.has(p.clientName)) {
        clientMap.set(p.clientName, {
          name: p.clientName,
          totalSpent: 0,
          projectCount: 0,
          activeProjects: 0,
          lastProjectDate: p.date,
          platforms: new Set(),
          avgSatisfaction: 0,
          satisfactionCount: 0
        });
      }

      const client = clientMap.get(p.clientName)!;
      
      client.totalSpent += earnings;
      client.projectCount += 1;
      client.platforms.add(p.platform);
      
      if (p.status !== 'Completed' && p.status !== 'Invoiced' && p.status !== 'Paid') {
        client.activeProjects += 1;
      }

      if (new Date(p.date) > new Date(client.lastProjectDate)) {
        client.lastProjectDate = p.date;
      }

      if (p.satisfactionRating) {
        client.avgSatisfaction += p.satisfactionRating;
        client.satisfactionCount += 1;
      }
    });

    return Array.from(clientMap.values()).map(c => ({
      ...c,
      avgSatisfaction: c.satisfactionCount > 0 ? c.avgSatisfaction / c.satisfactionCount : 0,
      platforms: Array.from(c.platforms)
    })).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [data.projects, data.profile.hourlyRate]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Müşteriler (CRM)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Müşteri portföyünüzü ve yaşam boyu değerlerini takip edin.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {clients.map(client => (
          <div key={client.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col hover:border-blue-500/30 transition-colors group relative">
            <button 
              onClick={() => handleSharePortal(client.name)}
              disabled={loadingClient === client.name}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Portalı Paylaş"
            >
              {loadingClient === client.name ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-4 mb-4 pr-10">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                {client.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{client.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {client.platforms.map(plat => (
                    <span key={plat} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold tracking-wider">{plat}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Müşteri Değeri</p>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(client.totalSpent)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Projeler</p>
                <p className="font-medium text-slate-800 dark:text-slate-100 flex gap-2">
                   {client.projectCount} 
                   {client.activeProjects > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{client.activeProjects} Aktif</span>}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Memnuniyet Puanı</p>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(client.avgSatisfaction || 0) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                  ))}
                  <span className="text-xs text-slate-500 ml-2">{client.avgSatisfaction ? client.avgSatisfaction.toFixed(1) : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Henüz müşteri kaydınız bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
