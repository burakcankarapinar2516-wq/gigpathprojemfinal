import { create } from 'zustand';
import { AppData, Project, Invoice, Profile, Notification, Expense } from './types';
import { encryption } from './lib/encryption';
const generateId = () => Math.random().toString(36).substring(2, 11);
import { playCoinSound } from './lib/audio';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface GigPathState {
  isLocked: boolean;
  pin: string | null;
  hasExistingVault: boolean;
  
  data: AppData;
  syncState: 'idle' | 'syncing' | 'offline' | 'error';
  lastSync: number | null;
  isAuthenticated: boolean;
  
    setSyncState: (state: 'idle' | 'syncing' | 'offline' | 'error') => void;
  setLastSync: (timestamp: number) => void;
  forceUpdateData: (data: AppData) => void;
  login: () => void;
  logout: () => void;

  updateProfile: (profile: Partial<Profile>) => void;
  
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleTimer: (projectId: string) => void;
  
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  markInvoicePaid: (id: string) => void;
  lastPaidInvoiceId: string | null;
  clearPaidTrigger: () => void;

  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  addTimesheetEntry: (projectId: string, description: string, loggedHours: number) => void;
  deleteTimesheetEntry: (projectId: string, entryId: string) => void;

  loadDemoData: () => void;
}

const defaultData: AppData = {
  profile: {
    name: 'Ahmet Yılmaz',
    title: 'Kıdemli Freelance Geliştirici',
    email: 'ahmet@example.com',
    address: 'İstanbul, Türkiye',
    hourlyRate: 1500,
    taxRate: 20,
    currency: 'TRY',
  },
  projects: [
    {
      id: 'p-1',
      title: 'E-Ticaret Mobil Uygulama',
      clientName: 'TechStart A.Ş.',
      platform: 'Upwork',
      status: 'Active',
      amount: 150000,
      currency: 'TRY',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
      trackedSeconds: 3600 * 15 + 1800, // 15.5 hours
      isTimerRunning: false,
      timerLastStartedAt: null,
      tasks: [
        { id: 't-1', description: 'UI/UX Tasarımlarının Onaylanması', amount: 0, isDone: true },
        { id: 't-2', description: 'Ödeme Entegrasyonu', amount: 0, isDone: false },
        { id: 't-3', description: 'Kullanıcı Doğrulama Modülü', amount: 0, isDone: true },
      ],
      communications: [
        { id: 'c-1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), message: 'Tasarım revizyonları gönderildi.', isClient: false }
      ]
    },
    {
      id: 'p-2',
      title: 'Kurumsal Web Sitesi Yenileme',
      clientName: 'Global Lojistik',
      platform: 'Direct',
      status: 'Invoiced',
      amount: 45000,
      currency: 'TRY',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
      trackedSeconds: 3600 * 42,
      isTimerRunning: false,
      timerLastStartedAt: null,
      tasks: [
        { id: 't-4', description: 'Ana sayfa animasyonları', amount: 0, isDone: true },
        { id: 't-5', description: 'SEO Optimizasyonu', amount: 0, isDone: true },
      ]
    },
    {
      id: 'p-3',
      title: 'Özel CRM Yazılımı',
      clientName: 'Beta Danışmanlık',
      platform: 'Bionluk',
      status: 'Completed',
      amount: 80000,
      currency: 'TRY',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
      trackedSeconds: 3600 * 65,
      isTimerRunning: false,
      timerLastStartedAt: null,
    }
  ],
  invoices: [
    {
      id: 'inv-1',
      projectId: 'p-2',
      invoiceNumber: 'INV-2024-001',
      issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      amount: 45000,
      status: 'Pending',
    },
    {
      id: 'inv-2',
      projectId: 'p-3',
      invoiceNumber: 'INV-2024-002',
      issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      amount: 80000,
      status: 'Paid',
    }
  ],
  notifications: [
    {
      id: 'n-1',
      title: 'Hoş Geldiniz',
      message: 'GigPath freelancer yönetim sistemine hoş geldiniz.',
      date: new Date().toISOString(),
      read: false,
      type: 'System',
    },
    {
      id: 'n-2',
      title: 'Fatura Hatırlatması',
      message: 'INV-2024-001 numaralı faturanın son ödeme tarihi yaklaşıyor.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      read: false,
      type: 'Payment',
    }
  ],
  expenses: [
    {
      id: 'e-1',
      title: 'Aylık Sunucu Gideri',
      amount: 350,
      category: 'Yazılım',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0]
    },
    {
      id: 'e-2',
      title: 'Freelancer Platform Komisyonu',
      amount: 1500,
      category: 'Diğer',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0]
    },
    {
      id: 'e-3',
      title: 'Yeni Klavye / Mouse Seti',
      amount: 2800,
      category: 'Donanım',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString().split('T')[0]
    }
  ],
};


const devPin = 'dev-mode-bypass';

const emptyData: AppData = {
  profile: { name: '', title: '', email: '', address: '', hourlyRate: 0, taxRate: 0, currency: 'TRY' },
  projects: [], invoices: [], notifications: [], expenses: []
};

export const useStore = create<GigPathState>((set, get) => {
  const initialData = (encryption.loadData(devPin) || emptyData);

  return {
    isLocked: false,
    pin: null,
    hasExistingVault: encryption.hasExistingVault(),
    data: initialData,
    syncState: 'idle' as const,
    lastSync: null,
    lastPaidInvoiceId: null,
    isAuthenticated: false,

    setSyncState: (state) => set({ syncState: state }),
    setLastSync: (timestamp) => set({ lastSync: timestamp }),
    forceUpdateData: (newData) => {
      encryption.saveData(devPin, newData);
      set({ data: newData });
    },
    login: () => set({ isAuthenticated: true }),
    logout: () => {
      const emptyData = {
        profile: { name: '', title: '', email: '', address: '', hourlyRate: 0, taxRate: 0, currency: 'TRY' },
        projects: [], invoices: [], notifications: [], expenses: []
      };
      localStorage.removeItem('auth_token');
      encryption.saveData(devPin, emptyData);
      set({ isAuthenticated: false, data: emptyData });
    },

  loadDemoData: () => {
    encryption.saveData(devPin, defaultData);
    set({ data: defaultData });
  },

  updateProfile: (updates) => {
    const { data } = get();
    const newData = { ...data, profile: { ...data.profile, ...updates } };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  addProject: (projectTemplate) => {
    const { data } = get();
    const newProject = { ...projectTemplate, id: generateId() };
    const newData = { ...data, projects: [...data.projects, newProject] };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  updateProject: (id, updates) => {
    const { data } = get();
    const newData = {
      ...data,
      projects: data.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  deleteProject: (id) => {
     const { data } = get();
     const newData = {
       ...data,
       projects: data.projects.filter(p => p.id !== id)
     };
     encryption.saveData(devPin, newData);
     set({ data: newData });
  },

  toggleTimer: (projectId) => {
    const { data } = get();
    const newData = {
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId) return p;
        
        let newTrackedSeconds = p.trackedSeconds || 0;
        
        if (p.isTimerRunning) {
          // Stopping timer
          let elapsed = 0;
          if (p.timerLastStartedAt) {
            elapsed = Math.floor((Date.now() - new Date(p.timerLastStartedAt).getTime()) / 1000);
            newTrackedSeconds += elapsed;
          }
          const hours = +(elapsed / 3600).toFixed(2);
          const finalHours = hours > 0 ? hours : 0.01;
          const newTimesheetEntry = {
            id: 'ts-' + Date.now(),
            description: 'Zaman Ölçer Oturumu',
            loggedHours: finalHours,
            date: new Date().toISOString()
          };
          return { 
            ...p, 
            isTimerRunning: false, 
            trackedSeconds: newTrackedSeconds, 
            timerLastStartedAt: undefined,
            timesheets: [...(p.timesheets || []), newTimesheetEntry]
          };
        } else {
          // Starting timer
          return { ...p, isTimerRunning: true, timerLastStartedAt: new Date().toISOString() };
        }
      })
    };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  addTimesheetEntry: (projectId, description, loggedHours) => {
    const { data } = get();
    const newEntry = {
      id: 'ts-' + Date.now(),
      description: description || 'Manuel Zaman Kaydı',
      loggedHours: loggedHours || 0,
      date: new Date().toISOString()
    };
    
    const newData = {
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId) return p;
        const currentSeconds = p.trackedSeconds || 0;
        const extraSeconds = loggedHours * 3600;
        
        return {
          ...p,
          trackedSeconds: currentSeconds + extraSeconds,
          timesheets: [...(p.timesheets || []), newEntry]
        };
      })
    };
    
    encryption.saveData(devPin, newData);
    set({ data: newData });
    toast.success('Zaman Kaydı Eklendi', { description: `${loggedHours} saatlik yeni kayıt eklendi.` });
  },

  deleteTimesheetEntry: (projectId, entryId) => {
    const { data } = get();
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const entryToDelete = (project.timesheets || []).find(ts => ts.id === entryId);
    const reduceSeconds = entryToDelete ? entryToDelete.loggedHours * 3600 : 0;
    
    const newData = {
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          trackedSeconds: Math.max(0, (p.trackedSeconds || 0) - reduceSeconds),
          timesheets: (p.timesheets || []).filter(ts => ts.id !== entryId)
        };
      })
    };
    
    encryption.saveData(devPin, newData);
    set({ data: newData });
    toast.info('Zaman Kaydı Silindi');
  },

  addInvoice: (invoiceTemplate) => {
    const { data } = get();
    const newInvoice = { ...invoiceTemplate, id: generateId() };
    const newData = { ...data, invoices: [...data.invoices, newInvoice] };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  markInvoicePaid: (id) => {
    const { data } = get();
    let invoiceFound = false;
    let invoiceNumber = '';
    
    const newData = {
      ...data,
      invoices: data.invoices.map(inv => {
        if (inv.id === id && inv.status !== 'Paid') {
          invoiceFound = true;
          invoiceNumber = inv.invoiceNumber;
          return { ...inv, status: 'Paid' as 'Paid', paidDate: new Date().toISOString() };
        }
        return inv;
      })
    };

    if (invoiceFound) {
      // Simulate sending email
      const newNotification: Notification = {
        id: generateId(),
        title: 'Ödeme Alındı & E-posta Gönderildi',
        message: `${invoiceNumber} numaralı faturanız ödendi. Müşteriye otomatik teşekkür e-postası gönderildi.`,
        date: new Date().toISOString(),
        read: false,
        type: 'Payment'
      };
      
      newData.notifications = [newNotification, ...(newData.notifications || [])];

      encryption.saveData(devPin, newData);
      set({ data: newData, lastPaidInvoiceId: id });
      toast.success(newNotification.title, { description: newNotification.message });
    }
  },

  clearPaidTrigger: () => set({ lastPaidInvoiceId: null }),

  addNotification: (notification) => {
    const { data } = get();
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      date: new Date().toISOString(),
      read: false
    };
    const newData = { ...data, notifications: [newNotification, ...(data.notifications || [])] };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  markNotificationRead: (id) => {
    const { data } = get();
    const newData = {
      ...data,
      notifications: (data.notifications || []).map(n => n.id === id ? { ...n, read: true } : n)
    };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  markAllNotificationsRead: () => {
    const { data } = get();
    const newData = {
      ...data,
      notifications: (data.notifications || []).map(n => ({ ...n, read: true }))
    };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  addExpense: (expenseTemplate) => {
    const { data } = get();
    const newExpense = { ...expenseTemplate, id: generateId() };
    const newData = { ...data, expenses: [...(data.expenses || []), newExpense] };
    encryption.saveData(devPin, newData);
    set({ data: newData });
  },

  deleteExpense: (id) => {
     const { data } = get();
     const newData = {
       ...data,
       expenses: (data.expenses || []).filter(e => e.id !== id)
     };
     encryption.saveData(devPin, newData);
     set({ data: newData });
  }
  };
});
