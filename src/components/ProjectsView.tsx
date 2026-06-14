import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, X, Search, FileText, Play, Square, Clock, Calendar, CheckCircle2, ChevronLeft, ChevronRight, LayoutList, MessageSquare, Send, Check, Trash2 } from 'lucide-react';
import { Project, Platform, ProjectStatus } from '../types';
import { formatCurrency, translateStatus } from '../lib/utils';
import { generateInvoicePDF } from '../lib/pdf';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const CATEGORIES = ['Yazılım', 'Tasarım', 'Çeviri', 'Danışmanlık', 'Pazarlama', 'Veri Girişi', 'Diğer'];

function getRemainingTime(deadline?: string) {
  if (!deadline) return 'Süre Sınırı Yok';
  const diffTime = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffTime < 0) return 'Gecikti';
  if (diffTime === 0) return 'Bugün Teslim';
  return `${diffTime} Gün Kaldı`;
}

function ProjectCardComponent({ project, now, hourlyRate, updateProject }: { project: Project, now: number, hourlyRate: number, updateProject: (id: string, data: Partial<Project>) => void }) {
  const { addTimesheetEntry, deleteTimesheetEntry } = useStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'communications' | 'tasks' | 'timesheet'>('summary');
  const [newMessage, setNewMessage] = useState('');
  const [isClientMessage, setIsClientMessage] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState('');

  let currentSeconds = project.trackedSeconds || 0;
  if (project.isTimerRunning && project.timerLastStartedAt) {
    currentSeconds += Math.floor((now - new Date(project.timerLastStartedAt).getTime()) / 1000);
  }
  const trackAmount = +(currentSeconds / 3600).toFixed(2) * hourlyRate;
  const totalEarnings = project.amount + trackAmount;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newCommunication = {
      id: 'msg-' + Date.now(),
      date: new Date().toISOString(),
      message: newMessage.trim(),
      isClient: isClientMessage
    };

    updateProject(project.id, {
      communications: [...(project.communications || []), newCommunication]
    });
    setNewMessage('');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    const newTask = {
      id: 'task-' + Date.now(),
      description: newTaskDesc.trim(),
      amount: 0
    };
    updateProject(project.id, {
      tasks: [...(project.tasks || []), newTask]
    });
    setNewTaskDesc('');
  };

  const handleDeleteTask = (taskId: string) => {
    updateProject(project.id, {
      tasks: (project.tasks || []).filter(t => t.id !== taskId)
    });
  };

  const toggleTaskStatus = (taskId: string) => {
    updateProject(project.id, {
      tasks: (project.tasks || []).map(t => t.id === taskId ? { ...t, isDone: !t.isDone } : t)
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden hover:border-blue-500/30 transition-colors h-full">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base line-clamp-1" title={project.title}>{project.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{project.clientName}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Özet
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex justify-center items-center gap-1.5 ${activeTab === 'tasks' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Görevler
            {project.tasks && project.tasks.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">{project.tasks.filter(t => t.isDone).length}/{project.tasks.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('communications')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex justify-center items-center gap-1.5 ${activeTab === 'communications' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            İletişim
            {project.communications && project.communications.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">{project.communications.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('timesheet')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex justify-center items-center gap-1.5 ${activeTab === 'timesheet' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            title="Süre & Zaman Kayıtları"
          >
            Zaman
            {project.timesheets && project.timesheets.length > 0 && (
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full text-[10px]">{project.timesheets.length}</span>
            )}
          </button>
        </div>

        {activeTab === 'summary' ? (
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                Finansal Durum
              </span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalEarnings, project.currency)}
              </span>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1 overflow-hidden">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Calendar className="w-3 h-3 shrink-0" />
                Kalan Süre
              </span>
              <span className={`font-medium text-sm truncate ${project.deadline && Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 3 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {getRemainingTime(project.deadline)}
              </span>
            </div>
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="flex flex-col flex-1 h-[140px]">
            <div className="flex-1 overflow-y-auto pr-1 mb-3 space-y-2 custom-scrollbar">
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 group p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <button 
                      onClick={() => toggleTaskStatus(task.id)} 
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center ${task.isDone ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      {task.isDone && <Check className="w-3 h-3" />}
                    </button>
                    <span className={`text-sm flex-1 truncate ${task.isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {task.description}
                    </span>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <CheckCircle2 className="w-6 h-6 mb-2 opacity-50" />
                  <span className="text-xs">Görev listesi boş.</span>
                </div>
              )}
            </div>
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Yeni görev..."
                className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newTaskDesc.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : activeTab === 'communications' ? (
          <div className="flex flex-col flex-1 h-[140px]">
            <div className="flex-1 overflow-y-auto pr-1 mb-3 space-y-3 custom-scrollbar">
              {project.communications && project.communications.length > 0 ? (
                project.communications.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.isClient ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.isClient ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm' : 'bg-blue-500 text-white rounded-tr-sm'}`}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {msg.isClient ? project.clientName : 'Siz'} • {new Date(msg.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="w-6 h-6 mb-2 opacity-50" />
                  <span className="text-xs">Henüz mesaj yok.</span>
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Not ekle..."
                className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="button"
                onClick={() => setIsClientMessage(!isClientMessage)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isClientMessage ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                title={isClientMessage ? "Müşteri Mesajı" : "Benim Notum"}
              >
                {isClientMessage ? 'Müşteri' : 'Ben'}
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 h-[140px]">
            <div className="flex-1 overflow-y-auto pr-1 mb-3 space-y-1.5 custom-scrollbar">
              {project.timesheets && project.timesheets.length > 0 ? (
                project.timesheets.map(entry => (
                  <div key={entry.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/30">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{entry.description}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{new Date(entry.date).toLocaleDateString('tr-TR')} • {new Date(entry.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {entry.loggedHours}s
                      </span>
                      <button 
                        type="button"
                        onClick={() => deleteTimesheetEntry(project.id, entry.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Zaman kaydını sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Clock className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[11px]">Zaman geçmişi boş.</span>
                </div>
              )}
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const desc = (form.elements.namedItem('tsDesc') as HTMLInputElement).value.trim();
              const hrs = parseFloat((form.elements.namedItem('tsHours') as HTMLInputElement).value) || 0;
              if (hrs > 0) {
                addTimesheetEntry(project.id, desc, hrs);
                form.reset();
              }
            }} className="flex gap-1.5 items-center">
              <input
                name="tsDesc"
                type="text"
                placeholder="Örn: Tasarım Revizyonu"
                className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <input
                name="tsHours"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Saat"
                className="w-14 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center self-stretch shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectsView() {
  const { data, addProject, updateProject, addInvoice, toggleTimer } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [now, setNow] = useState(Date.now());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'timeline'>('list');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Form State
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [platform, setPlatform] = useState<Platform>('Upwork');
  const [amount, setAmount] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [difficultyRating, setDifficultyRating] = useState('3');
  const [satisfactionRating, setSatisfactionRating] = useState('5');
  const [status, setStatus] = useState<ProjectStatus>('Active');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName || !amount) return;
    
    addProject({
      title,
      clientName,
      platform,
      amount: parseFloat(amount) || 0,
      currency: data.profile?.currency || 'TRY',
      status,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      category: category || undefined,
      estimatedHours: parseFloat(estimatedHours) || undefined,
      difficultyRating: parseInt(difficultyRating) || undefined,
      satisfactionRating: parseInt(satisfactionRating) || undefined,
      date: new Date().toISOString()
    });
    
    setIsAdding(false);
    setTitle('');
    setClientName('');
    setAmount('');
    setEstimatedHours('');
    setDeadline('');
    setCategory('');
    setDifficultyRating('3');
    setSatisfactionRating('5');
  };

  const handleGenerateInvoice = (project: Project) => {
    // Generate Invoice Data
    const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = new Date().toISOString();
    
    // Due after 14 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Calculate tracked amount
    let totalTrackedSeconds = project.trackedSeconds || 0;
    if (project.isTimerRunning && project.timerLastStartedAt) {
      totalTrackedSeconds += Math.floor((Date.now() - new Date(project.timerLastStartedAt).getTime()) / 1000);
      toggleTimer(project.id); // stop timer
    }
    
    const hours = +(totalTrackedSeconds / 3600).toFixed(2);
    const trackedAmount = hours * (data.profile.hourlyRate || 0);
    const finalAmount = project.amount + trackedAmount;
    
    let updatedProject = { ...project };
    
    // Add tasks
    if (hours > 0) {
       updatedProject.tasks = [
         ...(project.tasks || []),
         { id: 't-' + Date.now(), description: 'Zaman Takibi (Saatlik Çalışma)', hours, amount: trackedAmount }
       ];
    }
    
    const newInvoice = {
      projectId: project.id,
      invoiceNumber,
      issueDate,
      dueDate: dueDate.toISOString(),
      amount: finalAmount,
      status: 'Pending' as const
    };
    
    addInvoice(newInvoice);
    updateProject(project.id, { status: 'Invoiced', isTimerRunning: false, tasks: updatedProject.tasks, trackedSeconds: totalTrackedSeconds });
    
    // Generate the PDF
    const pdf = generateInvoicePDF(data.profile, updatedProject, { ...newInvoice, id: 'temp' });
    pdf.save(`${invoiceNumber}-${project.clientName}.pdf`);
  };

  const filteredProjects = [...data.projects].reverse().filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === '' || project.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Projeler</h1>
          <p className="text-slate-500 dark:text-slate-400">Aktif ve tamamlanmış işlerinizi yönetin.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Yeni Proje
        </button>
      </header>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Proje veya müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Kategoriler</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Yeni Proje Ekle</h2>
             <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
               <X className="w-5 h-5" />
             </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proje Başlığı</label>
               <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" placeholder="örn. Logo Tasarımı" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Müşteri Adı</label>
               <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" placeholder="örn. XYZ Şirketi" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
               <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2">
                 <option value="Upwork">Upwork</option>
                 <option value="Fiverr">Fiverr</option>
                 <option value="Bionluk">Bionluk</option>
                 <option value="Direct">Direkt / Doğrudan</option>
                 <option value="Other">Diğer</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
               <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2">
                 <option value="">Belirtilmemiş</option>
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tutar (Üzerinden Fatura Kesilecek Kur)</label>
               <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" placeholder="500.00" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tahmini Süre (Saat)</label>
               <input type="number" step="0.5" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" placeholder="örn. 10" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teslim Tarihi (Opsiyonel)</label>
               <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-slate-900" style={{colorScheme: 'light dark'}} />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proje Zorluk Derecesi (1-5)</label>
               <input type="number" min="1" max="5" value={difficultyRating} onChange={e => setDifficultyRating(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Müşteri Memnuniyeti (1-5)</label>
               <input type="number" min="1" max="5" value={satisfactionRating} onChange={e => setSatisfactionRating(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2" />
             </div>
             <div className="sm:col-span-2 pt-2">
               <button type="submit" className="w-full sm:w-auto bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">Projeyi Kaydet</button>
             </div>
          </form>
        </div>
      )}

      {filteredProjects.length > 0 && viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {filteredProjects.map(project => (
            <div key={`summary-${project.id}`}>
              <ProjectCardComponent 
                project={project} 
                now={now} 
                hourlyRate={data.profile.hourlyRate || 0} 
                updateProject={updateProject} 
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex shadow-sm border border-slate-200 dark:border-slate-700">
          <button 
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <LayoutList className="w-4 h-4" />
            Liste
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Calendar className="w-4 h-4" />
            Takvim
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Clock className="w-4 h-4" />
            Zaman Çizelgesi (Gantt)
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Proje Portföyü</h3>
            <div className="flex gap-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded uppercase">Upwork</span>
              <span className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 text-[10px] font-bold px-2 py-1 rounded uppercase">Bionluk</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Proje Adı</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Durum</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Zaman Takipçisi</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Tutar / İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProjects.map(project => {
                  let currentSeconds = project.trackedSeconds || 0;
                  if (project.isTimerRunning && project.timerLastStartedAt) {
                    currentSeconds += Math.floor((now - new Date(project.timerLastStartedAt).getTime()) / 1000);
                  }
                  const trackAmount = +(currentSeconds / 3600).toFixed(2) * (data.profile.hourlyRate || 0);
  
                  return (
                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-800 dark:bg-slate-700 rounded flex items-center justify-center text-[10px] text-white font-bold">
                            {project.platform.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{project.platform}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{project.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-400 uppercase">{project.clientName}</p>
                          {project.category && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {project.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold">
                          {translateStatus(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {project.status !== 'Invoiced' && project.status !== 'Paid' ? (
                          <div className="flex items-center gap-2">
                             <span className={`font-mono text-sm ${project.isTimerRunning ? 'text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                               {formatTime(currentSeconds)}
                             </span>
                             <button 
                               onClick={() => toggleTimer(project.id)}
                               className={`p-1.5 rounded-full transition-colors ${project.isTimerRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'}`}
                             >
                                {project.isTimerRunning ? <Square className="w-3 h-3" fill="currentColor" /> : <Play className="w-3 h-3" fill="currentColor" />}
                             </button>
                          </div>
                        ) : (
                          <span className="font-mono text-sm text-slate-400">{formatTime(currentSeconds)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-3 h-full">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                            {formatCurrency(project.amount + trackAmount, project.currency)}
                          </span>
                          {trackAmount > 0 && <span className="text-[10px] text-blue-500 font-medium">+{formatCurrency(trackAmount)} (Süre)</span>}
                        </div>
                        {project.status !== 'Invoiced' && project.status !== 'Paid' && (
                          <button 
                            onClick={() => handleGenerateInvoice(project)}
                            className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md font-medium transition-colors border border-blue-200 text-xs"
                          >
                            <FileText className="w-3 h-3" />
                            Fatura Kes
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Proje bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              {currentMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                Bugün
              </button>
              <button 
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 last:border-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
            {(() => {
              const year = currentMonth.getFullYear();
              const month = currentMonth.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              let firstDay = new Date(year, month, 1).getDay() - 1;
              if (firstDay === -1) firstDay = 6; // Make Monday 0, Sunday 6

              const paddingDays = Array(firstDay).fill(null);
              const monthDays = Array.from({length: daysInMonth}, (_, i) => i + 1);
              
              const totalCells = paddingDays.length + monthDays.length > 35 ? 42 : 35;
              const remainingPadding = Array(totalCells - (paddingDays.length + monthDays.length)).fill(null);
              
              const isToday = (d: number) => {
                const today = new Date();
                return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
              };

              return [...paddingDays, ...monthDays, ...remainingPadding].map((d, index) => {
                if (d === null) return <div key={`empty-${index}`} className="bg-slate-50/50 dark:bg-slate-800/20 border-r border-b border-slate-100 dark:border-slate-800/50 p-2 min-h-[120px]" />;
                
                const dayDateStr = new Date(year, month, d).toISOString().split('T')[0];
                const dayProjects = filteredProjects.filter(p => p.deadline && p.deadline.startsWith(dayDateStr));
                
                return (
                  <div key={`day-${d}`} className={`border-r border-b border-slate-100 dark:border-slate-800/50 p-2 min-h-[120px] min-w-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex flex-col group ${isToday(d) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                    <div className={`text-sm font-medium mb-1.5 w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${isToday(d) ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                      {d}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      {dayProjects.map(p => (
                        <div key={p.id} className="text-[10px] p-1.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50 truncate font-medium cursor-pointer" title={p.title}>
                          {p.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        /* Timeline / Gantt Chart View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Proje Termini & Zaman Akışı (Gantt)</h3>
              <p className="text-xs text-slate-400 mt-1">Projelerinizin teslim tarihlerini ve zaman çakışmalarını yatay düzlemde izleyin.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                {currentMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[760px] pb-4">
              {/* Timeline Header (Days of the Month) */}
              <div className="grid grid-cols-12 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 text-xs font-bold text-slate-400 text-center uppercase tracking-wider">
                <div className="col-span-3 text-left pl-2">PROJE VE MÜŞTERİ</div>
                <div className="col-span-9 grid grid-cols-30 text-[9px] font-mono font-normal">
                  {Array.from({ length: 30 }, (_, idx) => {
                    const dayNum = idx + 1;
                    return (
                      <div key={idx} className="border-r border-slate-100 dark:border-slate-800/60 last:border-0 flex flex-col justify-center py-1">
                        <span>{dayNum}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline Rows */}
              <div className="space-y-4">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map(project => {
                    // Calculate project start & end positioning
                    const projStartDate = new Date(project.date || new Date());
                    const projEndDate = project.deadline ? new Date(project.deadline) : new Date(projStartDate.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days fallback
                    
                    // Limit calculation within selected month
                    const year = currentMonth.getFullYear();
                    const month = currentMonth.getMonth();
                    
                    const monthStartDate = new Date(year, month, 1);
                    const monthEndDate = new Date(year, month + 1, 0);
                    
                    const startDiffMs = projStartDate.getTime() - monthStartDate.getTime();
                    const startDay = Math.max(0, Math.floor(startDiffMs / (1000 * 60 * 60 * 24)));
                    
                    const totalProjLengthMs = projEndDate.getTime() - projStartDate.getTime();
                    const projDays = Math.max(2, Math.ceil(totalProjLengthMs / (1000 * 60 * 60 * 24)));
                    
                    // Compute grid percentages or spans
                    const monthTotalDays = monthEndDate.getDate();
                    const startPct = (startDay / monthTotalDays) * 100;
                    const widthPct = Math.min(100 - startPct, (projDays / monthTotalDays) * 100);
                    
                    // Setup colors
                    const isOverdue = project.deadline && new Date(project.deadline).getTime() < Date.now() && project.status !== 'Completed' && project.status !== 'Paid';
                    const barColor = isOverdue ? 'bg-red-500/80 text-white' : 
                      project.platform === 'Upwork' ? 'bg-blue-500/80 text-white' :
                      project.platform === 'Fiverr' ? 'bg-emerald-500/80 text-white' :
                      project.platform === 'Bionluk' ? 'bg-amber-500/80 text-slate-900' : 'bg-indigo-500/80 text-white';

                    return (
                      <div key={`timeline-row-${project.id}`} className="grid grid-cols-12 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 py-2.5 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 pl-2">
                        {/* Name of project */}
                        <div className="col-span-3 min-w-0 pr-4">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{project.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{project.clientName} • {project.platform}</p>
                        </div>
                        
                        {/* Gantt Bar Area */}
                        <div className="col-span-9 h-11 bg-slate-50 dark:bg-slate-950/60 rounded-xl relative border border-slate-100 dark:border-slate-800/40 flex items-center overflow-hidden">
                          {/* Day vertical grid indicators */}
                          <div className="absolute inset-0 grid grid-cols-30 pointer-events-none">
                            {Array.from({ length: 30 }, (_, idx) => (
                              <div key={idx} className="border-r border-slate-200/20 dark:border-slate-800/30 last:border-0 h-full" />
                            ))}
                          </div>
                          
                          {/* Colored Timeline block */}
                          {widthPct > 0 ? (
                            <div 
                              style={{ left: `${Math.max(0, Math.min(95, startPct))}%`, width: `${Math.max(4, Math.min(100, widthPct))}%` }}
                              className={`absolute h-7 rounded-lg ${barColor} shadow-sm flex items-center justify-between px-3 text-[10px] font-bold transition-all hover:scale-[1.01]`}
                            >
                              <span className="truncate">{project.title}</span>
                              <span className="text-[8px] font-mono font-medium opacity-90 hidden sm:inline-block shrink-0">
                                {project.deadline ? new Date(project.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '7 Gün'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 pl-3">Bu ay dışında</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-500 py-8 text-xs">Seçili platform veya kriterlere uyan proje bulunmuyor.</p>
                )}
              </div>
              
              {/* Legend scale */}
              <div className="flex gap-4 items-center justify-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500/80 inline-block" /> Upwork</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/80 inline-block" /> Fiverr</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/80 inline-block" /> Bionluk</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500/80 inline-block" /> Direct/Diğer</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/80 inline-block" /> Gecikti</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
