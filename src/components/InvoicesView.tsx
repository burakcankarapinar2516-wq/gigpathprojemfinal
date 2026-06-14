import { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency, translateStatus } from '../lib/utils';
import { CheckCircle2, Download, AlertCircle, X, ExternalLink, Palette, FileText, Check } from 'lucide-react';
import { generateInvoicePDF, INVOICE_TEMPLATES } from '../lib/pdf';
import { Invoice, Project } from '../types';

export function InvoicesView() {
  const { data, markInvoicePaid } = useStore();
  const [previewInvoice, setPreviewInvoice] = useState<{ invoice: Invoice, project: Project } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic');

  const handleDownload = (invoice: Invoice, project: Project, templateId: string = 'classic') => {
    const pdf = generateInvoicePDF(data.profile, project, invoice, templateId);
    pdf.save(`${invoice.invoiceNumber}-${project.clientName}.pdf`);
  };

  const handlePreview = (invoiceId: string) => {
    const invoice = data.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    const project = data.projects.find(p => p.id === invoice.projectId);
    if (!project) return;
    
    setPreviewInvoice({ invoice, project });
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Faturalar</h1>
        <p className="text-slate-500 dark:text-slate-400">Oluşturulan faturalarınızı takip edin ve yönetin.</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Oluşturulan Faturalar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fatura No</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Müşteri & Tarih</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Durum</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Tutar / İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.invoices.map((invoice) => {
                const isPaid = invoice.status === 'Paid';
                const project = data.projects.find(p => p.id === invoice.projectId);
                const taxRate = data.profile.taxRate || 0;
                const totalGross = invoice.amount * (1 + taxRate / 100);
                
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => handlePreview(invoice.id)}>
                    <td className="px-6 py-4">
                       <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5">{invoice.invoiceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{project?.clientName || 'Bilinmeyen Müşteri'}</p>
                      <p className="text-[10px] text-slate-400 uppercase">Son Ödeme: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${isPaid ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800'}`}>
                        {translateStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3 h-full">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                          {formatCurrency(totalGross)}
                        </span>
                        {taxRate > 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500">(Brüt)</span>}
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => project && handleDownload(invoice, project)}
                          className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-medium transition-colors border border-blue-200 dark:border-blue-800 text-xs"
                          title="PDF İndir"
                        >
                          <Download className="w-3 h-3" />
                          PDF İndir
                        </button>
                        
                        {!isPaid && (
                          <button 
                            onClick={() => markInvoicePaid(invoice.id)}
                            className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md font-medium transition-colors border border-emerald-200 dark:border-emerald-800 text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Ödendi İşaretle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <p>Fatura bulunmuyor.</p>
                      <p className="text-sm">Burada görmek için bir projeden fatura oluşturun.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Özelleştirilebilir Fatura Tasarım Kitaplığı
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Dilediğiniz şablonu seçip anında PDF formatında indirin.</p>
              </div>
              <button 
                onClick={() => {
                  setPreviewInvoice(null);
                  setSelectedTemplateId('classic');
                }} 
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Split Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
              
              {/* Left Panel: Template List Selector */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Şablon Tasarımı Seçin
                </div>
                
                <div className="space-y-3.5">
                  {INVOICE_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`w-full p-4 rounded-2xl border text-left flex gap-4 transition-all duration-200 outline-none ${
                          isSelected 
                            ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-950 shadow-md ring-2 ring-indigo-500/10' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-900/60'
                        }`}
                      >
                        {/* Mock Badge Thumbnail */}
                        <div className={`w-12 h-14 rounded-lg flex flex-col justify-between p-1.5 border shrink-0 text-[6px] font-sans ${
                          tpl.id === 'classic' ? 'border-blue-100 bg-slate-50' :
                          tpl.id === 'modern' ? 'border-indigo-100 bg-indigo-50/20 border-t-4 border-t-indigo-500' :
                          tpl.id === 'emerald' ? 'border-emerald-100 bg-emerald-50/20' :
                          'border-slate-700 bg-slate-950 text-white'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className={`w-1.5 h-1.5 rounded-full ${tpl.id === 'dark' ? 'bg-amber-400' : tpl.primaryColor}`} />
                            <span className="opacity-40">•••</span>
                          </div>
                          <div className={`w-full h-1 my-1 rounded-sm ${tpl.id === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                          <div className={`w-full h-2 rounded-sm ${tpl.id === 'dark' ? 'bg-amber-400/20' : 'bg-slate-100'}`} />
                        </div>

                        {/* Text descriptions */}
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">
                              {tpl.name}
                            </span>
                            {isSelected && (
                              <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[4]" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    💡 İpucu
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Seçeceğiniz tasarımın renk ve yerleşim düzeni, üretilecek resmi PDF dökümanına tam olarak yansıtılacaktır.
                  </p>
                </div>
              </div>
              
              {/* Right Panel: Live interactive styled mockup */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Canlı Tasarım Önizlemesi</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {INVOICE_TEMPLATES.find(t => t.id === selectedTemplateId)?.name}
                  </span>
                </div>
                
                {/* Visualized mockup card */}
                <div className={`flex-1 border rounded-2xl bg-white dark:bg-slate-950 shadow-inner overflow-hidden transition-all duration-300 flex flex-col relative min-h-[360px] ${
                  selectedTemplateId === 'classic' ? 'border-slate-200 dark:border-slate-800' :
                  selectedTemplateId === 'modern' ? 'border-indigo-200 dark:border-indigo-800 border-t-8 border-t-indigo-600' :
                  selectedTemplateId === 'emerald' ? 'border-emerald-200 dark:border-emerald-800' :
                  'border-slate-300 dark:border-slate-700'
                }`}>
                  
                  {/* Top bar emerald divider */}
                  {selectedTemplateId === 'emerald' && (
                    <div className="h-1.5 bg-emerald-500 w-full" />
                  )}

                  {/* Top Dark Header block styled mockup */}
                  {selectedTemplateId === 'dark' ? (
                    <div className="bg-slate-900 text-white p-5 border-b-2 border-amber-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-black tracking-tight text-amber-500">FATURA</h2>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{previewInvoice.invoice.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xs text-slate-100">{data.profile.name || 'Freelancer'}</p>
                          <p className="text-[10px] text-slate-400">{data.profile.title || 'Hizmetler'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 pb-2 flex justify-between items-start">
                      <div>
                        <h2 className={`text-xl font-black tracking-tight ${
                          selectedTemplateId === 'modern' ? 'text-indigo-600 dark:text-indigo-400' :
                          selectedTemplateId === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-slate-900 dark:text-slate-100'
                        }`}>FATURA</h2>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{previewInvoice.invoice.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{data.profile.name || 'Freelancer'}</p>
                        <p className="text-[10px] text-slate-400">{data.profile.title || 'Hizmetler'}</p>
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-3 flex-1 flex flex-col justify-between">
                    {/* Invoice Meta */}
                    <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 dark:border-slate-900 pb-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sayın Müşteri</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{previewInvoice.project.clientName}</p>
                        <p className="text-[10px] text-slate-500">Platform: {previewInvoice.project.platform}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tarihler</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">Tarih: {new Date(previewInvoice.invoice.issueDate).toLocaleDateString('tr-TR')}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Son Ödeme: {new Date(previewInvoice.invoice.dueDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>

                    {/* Proje/Hizmet Satırı */}
                    <div className="my-3 flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Açıklama</p>
                      <div className={`p-3 rounded-lg flex justify-between items-center ${
                        selectedTemplateId === 'modern' ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-l-2 border-indigo-500' :
                        selectedTemplateId === 'emerald' ? 'bg-emerald-50/10 dark:bg-emerald-950/10 border-b border-emerald-500/20' :
                        'bg-slate-50 dark:bg-slate-900'
                      }`}>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{previewInvoice.project.title}</p>
                          <p className="text-[9px] text-slate-400">Verilen Profesyonel Serbest Çalışma Hizmeti</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(previewInvoice.invoice.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Toplam Hesap Modülü */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-900">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Ara Toplam</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(previewInvoice.invoice.amount)}</span>
                      </div>
                      {data.profile.taxRate && data.profile.taxRate > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">KDV / Vergi (%{data.profile.taxRate})</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(previewInvoice.invoice.amount * (data.profile.taxRate / 100))}</span>
                        </div>
                      )}
                      
                      {/* Bold Total box visually distinct */}
                      <div className={`p-2.5 rounded-lg flex justify-between items-center mt-2 ${
                        selectedTemplateId === 'classic' ? 'bg-slate-100 dark:bg-slate-800' :
                        selectedTemplateId === 'modern' ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900' :
                        selectedTemplateId === 'emerald' ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-t-2 border-emerald-500' :
                        'bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
                      }`}>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ödenecek Toplam (Brüt)</span>
                        <span className={`font-mono text-sm font-black ${
                          selectedTemplateId === 'dark' ? 'text-amber-500' :
                          selectedTemplateId === 'modern' ? 'text-indigo-600 dark:text-indigo-400' :
                          selectedTemplateId === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-slate-900 dark:text-indigo-400'
                        }`}>
                          {formatCurrency(previewInvoice.invoice.amount * (1 + (data.profile.taxRate || 0) / 100))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subtle footer stamp inside mockup */}
                  <div className="bg-slate-50 dark:bg-slate-900 px-5 py-2.5 text-center text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center">
                    <span>* Bu döküman dijital olarak oluşturulmuştur.</span>
                    <span className="font-bold text-slate-300">GIGPATH</span>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-950">
              <button 
                onClick={() => {
                  setPreviewInvoice(null);
                  setSelectedTemplateId('classic');
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 font-bold transition-colors text-xs"
              >
                Kapat
              </button>
              <button 
                onClick={() => {
                  handleDownload(previewInvoice.invoice, previewInvoice.project, selectedTemplateId);
                  setPreviewInvoice(null);
                  setSelectedTemplateId('classic');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs"
              >
                <Download className="w-4 h-4" />
                Şablonla PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
