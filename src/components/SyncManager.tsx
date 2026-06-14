import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { toast } from 'sonner';

export function SyncManager() {
  const { data, syncState, setSyncState, setLastSync, forceUpdateData, isAuthenticated } = useStore();
  const dataRef = useRef(data);
  const isInitialMount = useRef(true);

  // Keep ref updated to avoid dependency loops in debounce
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Pull data from server on mount/auth
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchCloudData = async () => {
      if (!navigator.onLine) {
        setSyncState('offline');
        return;
      }
      
      setSyncState('syncing');
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/sync', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            // Pre-fill profile name and email if they are empty
            const currentProfile = json.data.profile || {};
            const profile = {
              title: 'Freelancer',
              address: '',
              hourlyRate: 0,
              taxRate: 0,
              currency: 'TRY',
              ...currentProfile,
              name: currentProfile.name || json.user?.name || '',
              email: currentProfile.email || json.user?.email || '',
            };
            forceUpdateData({
              ...json.data,
              profile
            });
            setLastSync(json.timestamp || Date.now());
          } else {
            // Empty data for a new user
            forceUpdateData({
              profile: { name: json.user?.name || '', title: 'Freelancer', email: json.user?.email || '', address: '', hourlyRate: 0, taxRate: 0, currency: 'TRY' },
              projects: [], invoices: [], notifications: [], expenses: []
            });
            setLastSync(Date.now());
          }
        }
        setSyncState('idle');
      } catch (e) {
        setSyncState('error');
      }
    };
    
    fetchCloudData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Push data to server when it changes local
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (!isAuthenticated) return;

    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    const pushData = async () => {
      setSyncState('syncing');
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ data: dataRef.current })
        });
        
        if (res.ok) {
          const json = await res.json();
          setLastSync(json.timestamp);
          setSyncState('idle');
        } else {
          setSyncState('error');
        }
      } catch (e) {
        setSyncState('error');
      }
    };

    const timeoutId = setTimeout(pushData, 2000); // Debounce to prevent spam
    
    return () => clearTimeout(timeoutId);
  }, [data, isAuthenticated, setSyncState, setLastSync]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncState('syncing');
      toast.success('Bağlantı sağlandı', { description: 'Veriler senkronize ediliyor...' });
      
      const pushData = async () => {
        try {
          const token = localStorage.getItem('auth_token');
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ data: dataRef.current })
          });
          
          if (res.ok) {
            const json = await res.json();
            setLastSync(json.timestamp);
            setSyncState('idle');
            toast.success('Senkronizasyon başarılı');
          } else {
            setSyncState('error');
            toast.error('Senkronizasyon başarısız oldu');
          }
        } catch (e) {
          setSyncState('error');
          toast.error('Senkronizasyon başarısız oldu');
        }
      };
      
      pushData();
    };

    const handleOffline = () => {
      setSyncState('offline');
      toast.warning('İnternet bağlantısı kesildi', { description: 'Değişiklikler yerel olarak kaydediliyor. Bağlantı geldiğinde senkronize edilecek.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncState, setLastSync]);

  return null;
}
