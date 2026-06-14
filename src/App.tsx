/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

import { AuthScreen } from './components/AuthScreen';
import { AppLayout } from './components/AppLayout';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { InvoicesView } from './components/InvoicesView';
import { SettingsView } from './components/SettingsView';
import { ClientsView } from './components/ClientsView';
import { ExpensesView } from './components/ExpensesView';
import { ConfettiEffect } from './components/ConfettiEffect';
import { SyncManager } from './components/SyncManager';
import { PortalView } from './components/PortalView';

function ProtectedLayout() {
  const { isAuthenticated, login, logout } = useStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/auth/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          login();
        } else {
          localStorage.removeItem('auth_token');
          logout();
        }
      } catch (err) {
        localStorage.removeItem('auth_token');
        logout();
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [login, logout]);

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Yükleniyor...</div>;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <>
      <SyncManager />
      <AppLayout />
    </>
  );
}

function ThemeUpdater() {
  const { data } = useStore();
  const theme = data.profile?.theme || 'system';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      const listener = (e: MediaQueryListEvent) => {
        if (data.profile?.theme === 'system' || !data.profile?.theme) {
          root.classList.remove('light', 'dark');
          root.classList.add(e.matches ? 'dark' : 'light');
        }
      };
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    } else {
      root.classList.add(theme);
    }
  }, [theme, data.profile?.theme]);

  return null;
}

export default function App() {
  return (
    <>
      <ThemeUpdater />
      <Toaster position="top-right" richColors />
      <ConfettiEffect />
      <BrowserRouter>
        <Routes>
          <Route path="/portal/:token" element={<PortalView />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<DashboardView />} />
            <Route path="clients" element={<ClientsView />} />
            <Route path="projects" element={<ProjectsView />} />
            <Route path="expenses" element={<ExpensesView />} />
            <Route path="invoices" element={<InvoicesView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

