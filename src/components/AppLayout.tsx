import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FileText, Settings, Bell, Check, Trash2, Users, Receipt, RefreshCw, CloudOff, Cloud, CheckCircle2, User, Moon, Sun } from 'lucide-react';
import { useStore } from '../store';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProfileModal } from './ProfileModal';
import { OnboardingTour } from './OnboardingTour';

function SyncIndicator() {
  const { syncState, lastSync } = useStore();
  
  let icon = <Cloud className="w-4 h-4" />;
  let text = 'Senkronize edildi';
  let colorClass = 'text-slate-500';

  if (syncState === 'syncing') {
    icon = <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    text = 'Senkronize ediliyor...';
    colorClass = 'text-blue-500';
  } else if (syncState === 'offline') {
    icon = <CloudOff className="w-4 h-4 text-amber-500" />;
    text = 'Çevrimdışı (Yerel Ön Bellek)';
    colorClass = 'text-amber-500';
  } else if (syncState === 'error') {
    icon = <CloudOff className="w-4 h-4 text-red-500" />;
    text = 'Senkronizasyon Hatası';
    colorClass = 'text-red-500';
  } else if (syncState === 'idle') {
    icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    colorClass = 'text-slate-500';
    if (lastSync) {
      text = `Son senk: ${new Date(lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  return (
    <div id="onboarding-sync" className={`flex items-center gap-1.5 text-xs font-medium ${colorClass} px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mr-4`}>
      {icon}
      <span className="hidden sm:inline">{text}</span>
    </div>
  );
}

function NotificationsPanel() {
  const { data, markNotificationRead, markAllNotificationsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const notifications = data.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div id="onboarding-notifications" className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Bildirimler</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotificationsRead}
                className="text-[10px] text-blue-600 font-medium hover:text-blue-800"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                Bildiriminiz yok.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg flex gap-3 ${n.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/20'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    n.type === 'Payment' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                    n.type === 'Deadline' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {n.type === 'Payment' ? <FileText className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{new Date(n.date).toLocaleString('tr-TR')}</p>
                  </div>
                  {!n.read && (
                    <button onClick={() => markNotificationRead(n.id)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 self-start">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

function ThemeToggleDropdown() {
  const { data, updateProfile } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentTheme = data.profile?.theme || 'system';
  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mr-2 md:mr-4 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Tema Seçimi"
      >
        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="fixed right-4 top-16 md:absolute md:right-0 md:top-full md:mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => { updateProfile({ theme: 'light' }); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${currentTheme === 'light' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Sun className="w-4 h-4" /> Açık (Light)
              </button>
              <button
                onClick={() => { updateProfile({ theme: 'dark' }); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${currentTheme === 'dark' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Moon className="w-4 h-4" /> Karanlık (Dark)
              </button>
              <button
                onClick={() => { updateProfile({ theme: 'system' }); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${currentTheme === 'system' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <RefreshCw className="w-4 h-4" /> Sistem Ayarı
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout() {
  const { data, addNotification, updateProfile, logout } = useStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkDeadlines = () => {
      const now = new Date();
      data.projects.filter(p => p.status === 'Active' && p.deadline).forEach(project => {
        const d = new Date(project.deadline!);
        const diffMs = d.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        
        // Check for 24-hour alert
        if (diffHours <= 24 && diffHours >= 0) {
          const hasNotif = data.notifications?.find(n => n.type === 'Deadline' && n.title.includes(project.title) && n.message.includes('24 saat'));
          if (!hasNotif) {
            const message = `${project.clientName} için '${project.title}' projesinin teslimine 24 saatten az kaldı!`;
            addNotification({
              title: `Acil Proje Teslimi: ${project.title}`,
              message: message,
              type: 'Deadline'
            });
            toast.error(`Acil Teslimat: ${project.title}`, { description: message });
            
            // Try to send browser notification if strictly supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Acil: ${project.title}`, { body: message });
            }
          }
        } else if (diffDays <= 3 && diffDays >= 0) {
          const hasNotif = data.notifications?.find(n => n.type === 'Deadline' && n.title.includes(project.title) && !n.message.includes('24 saat'));
          if (!hasNotif) {
            const message = `${project.clientName} için '${project.title}' projesinin tahmini teslimat tarihi yaklaşıyor (${diffDays} gün kaldı). Sistemsel hatırlatıcı e-postası planlandı.`;
            addNotification({
              title: `Yaklaşan Proje Teslimi: ${project.title}`,
              message: message,
              type: 'Deadline'
            });
            toast.warning(`Yaklaşan Proje Teslimi: ${project.title}`, { description: message });
          }
        }
      });
    };
    
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [data.projects, data.notifications, addNotification]);

  const navItems = [
    { name: 'Panel', path: '/', icon: LayoutDashboard },
    { name: 'Müşteriler', path: '/clients', icon: Users },
    { name: 'Projeler', path: '/projects', icon: FolderKanban },
    { name: 'Giderler', path: '/expenses', icon: Receipt },
    { name: 'Faturalar', path: '/invoices', icon: FileText },
    { name: 'Ayarlar', path: '/settings', icon: Settings },
  ];

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside id="onboarding-sidebar" className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 hidden md:flex h-full">
        <div className="p-6 border-b border-slate-800/55">
          <div className="flex items-center gap-3 group select-none">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:border-blue-500/50 transition-all duration-300">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-5 h-5 text-blue-500 group-hover:text-blue-400 transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 16C6 10.4772 10.4772 6 16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 11L21 16L16 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 16H21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-lg tracking-wider font-sans group-hover:text-blue-400 transition-colors leading-none">
                gig<span className="text-blue-500 font-light">path</span>
              </span>
              <span className="text-[9px] text-slate-500 tracking-widest uppercase font-mono mt-1 leading-none">
                freelance portal
              </span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 mt-4 px-4 space-y-1">
          {navItems.map((item) => (
             <NavLink
               key={item.name}
               to={item.path}
               className={({ isActive }) =>
                 `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                   isActive 
                     ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                     : 'text-slate-400 hover:text-white hover:bg-slate-800'
                 }`
               }
             >
               <item.icon className="w-5 h-5" />
               <span className="font-medium">{item.name}</span>
             </NavLink>
          ))}
        </nav>

        <div className="p-4 flex flex-col gap-4">
          <button 
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch (e) {}
              localStorage.removeItem('auth_token');
              logout();
              window.location.reload();
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors border border-transparent"
          >
            <CloudOff className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Desktop Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 hidden md:flex items-center px-8 justify-end shadow-sm z-50">
          <SyncIndicator />
          <ThemeToggleDropdown />
          <NotificationsPanel />
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="ml-4 flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            {data.profile.name ? data.profile.name.substring(0,2).toUpperCase() : <User className="w-4 h-4" />}
          </button>
        </header>

        {/* Mobile Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 md:hidden flex items-center px-4 justify-between z-50">
          <div className="flex items-center gap-2 group select-none">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 shadow-sm">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 16C6 10.4772 10.4772 6 16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M16 11L21 16L16 21" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 16H21" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-white font-semibold text-base tracking-wider leading-none">
              gig<span className="text-blue-500 font-light">path</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <ThemeToggleDropdown />
            <NotificationsPanel />
            <button onClick={() => setIsProfileOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          <div className="max-w-6xl mx-auto p-4 pb-12 md:p-8 md:pb-12">
            <Outlet />
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <nav className="md:hidden shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex py-2 px-4 justify-between items-center z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 rounded-lg ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`
              }
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <OnboardingTour />
    </div>
  );
}
