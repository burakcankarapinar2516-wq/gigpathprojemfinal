import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatCurrency, translateStatus } from '../lib/utils';
import { Briefcase, Receipt, CheckCircle2, Circle, Clock, Check } from 'lucide-react';
import { Project, Invoice } from '../types';

interface PortalData {
  clientName: string;
  profileData: { name: string; title: string; email: string; currency: string };
  projects: Project[];
  invoices: Invoice[];
}

export function PortalView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Geçersiz veya süresi dolmuş bağlantı.');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Erişim Hatası</h2>
          <p className="text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const { clientName, profileData, projects, invoices } = data;
  const activeProjects = projects.filter(p => !['Completed', 'Invoiced', 'Paid'].includes(p.status));
  const pendingInvoices = invoices.filter(i => i.status === 'Pending');
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 selection:bg-blue-500/30">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{profileData.name || 'Freelancer'}</h1>
            <p className="text-sm text-slate-500">{profileData.title}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Müşteri Portalı</p>
            <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">{clientName}</h2>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Aktif Projeler</p>
              <h3 className="text-2xl font-bold mt-1">{activeProjects.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Bekleyen Ödemeler</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalPendingAmount, profileData.currency)}</h3>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" /> Projeler
          </h3>
          {projects.length === 0 ? (
            <p className="text-slate-500">Henüz proje bulunmuyor.</p>
          ) : (
            <div className="grid gap-4">
              {projects.map(project => (
                <div key={project.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{project.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">{translateStatus(project.status)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">Bütçe: {formatCurrency(project.amount, profileData.currency)}</span>
                      </div>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock className="w-4 h-4" /> Teslim: {new Date(project.deadline).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>
                  
                  {project.tasks && project.tasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Görevler</p>
                      <div className="space-y-2">
                        {project.tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-2 text-sm">
                            <div className="mt-0.5">
                              {task.isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                            </div>
                            <span className={task.isDone ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}>{task.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" /> Faturalar
          </h3>
          {invoices.length === 0 ? (
            <p className="text-slate-500">Henüz fatura bulunmuyor.</p>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Fatura No</th>
                      <th className="px-6 py-4">Proje</th>
                      <th className="px-6 py-4">Tarih</th>
                      <th className="px-6 py-4">Son Ödeme</th>
                      <th className="px-6 py-4">Durum</th>
                      <th className="px-6 py-4 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => {
                      const projectTitle = projects.find(p => p.id === invoice.projectId)?.title || 'Bilinmeyen Proje';
                      return (
                        <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4 font-mono font-medium">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 font-medium">{projectTitle}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(invoice.issueDate).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              invoice.status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                            }`}>
                              {invoice.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatCurrency(invoice.amount, profileData.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
