import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useStore } from "../store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency?: string) {
  let selectedCurrency = currency;
  if (!selectedCurrency) {
    try {
      selectedCurrency = useStore.getState().data?.profile?.currency;
    } catch (e) {
      // ignore
    }
  }
  if (!selectedCurrency) {
    selectedCurrency = "USD";
  }
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: selectedCurrency,
  }).format(amount);
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export function translateStatus(status: string) {
  const map: Record<string, string> = {
    'Draft': 'Taslak',
    'Active': 'Aktif',
    'Completed': 'Tamamlandı',
    'Invoiced': 'Faturalandı',
    'Paid': 'Ödendi',
    'Pending': 'Bekliyor'
  };
  return map[status] || status;
}
