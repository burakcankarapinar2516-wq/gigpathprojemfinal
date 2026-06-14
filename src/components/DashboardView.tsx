import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatCurrency, translateStatus } from '../lib/utils';
import { ArrowUpRight, FolderKanban, CheckCircle2, Clock, Download, Sparkles, AlertTriangle, Trophy, Heart, Star, Calendar, Send, RefreshCw, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart } from 'recharts';

function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  // Convert **bold** to structured tags
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.flatMap((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return [<strong key={`bold-${i}`} className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/60 px-1 rounded">{part.slice(2, -2)}</strong>];
    }
    // Handle inline code `code`
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((subPart, j) => {
      if (subPart.startsWith('`') && subPart.endsWith('`')) {
        return <code key={`code-${i}-${j}`} className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono text-[11px] px-1 py-0.5 rounded">{subPart.slice(1, -1)}</code>;
      }
      return subPart;
    });
  });
}

function parseMarkdownToJSX(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        // Headings
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-neutral-100 mt-3 mb-1.5">{parseInlineMarkdown(line.substring(4))}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-extrabold text-slate-900 dark:text-neutral-50 mt-4 mb-2">{parseInlineMarkdown(line.substring(3))}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-black text-slate-900 dark:text-neutral-50 mt-4 mb-2">{parseInlineMarkdown(line.substring(2))}</h2>;
        }
        
        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={idx} className="list-disc list-inside text-xs text-slate-700 dark:text-neutral-300 ml-4 my-1">
              {parseInlineMarkdown(line.substring(2))}
            </li>
          );
        }
        const numberedListMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numberedListMatch) {
          return (
            <li key={idx} className="list-decimal list-inside text-xs text-slate-700 dark:text-neutral-300 ml-4 my-1">
              {parseInlineMarkdown(numberedListMatch[2])}
            </li>
          );
        }

        // Paragraph
        if (line.trim() === '') {
          return <div key={idx} className="h-1" />;
        }

        return <p key={idx} className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed mb-1">{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export function DashboardView() {
  const { data } = useStore();
  
  const totalIncome = data.invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingIncome = data.invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);
    
  const totalExpenses = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0);
  const trueNetProfit = totalIncome - totalExpenses;
    
  const [sliderTaxRate, setSliderTaxRate] = useState<number>(data.profile.taxRate || 20);
  const [forecastTargetIncome, setForecastTargetIncome] = useState<number>(totalIncome + pendingIncome || 10000);
  
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>(() => [
    {
      role: 'assistant',
      content: `Merhaba **${data.profile.name || 'Freelancer'}**! Ben senin akıllı iş asistanınım. 
      
Senin için güncel finansal verilerini, projelerini ve giderlerini inceledim. Şu an **${data.projects.filter(p => p.status === 'Active').length} adet aktif projen** ve **${data.invoices.filter(i => i.status === 'Pending').length} beklemede olan faturan** bulunuyor. 

Bana finansal durumunu özetlememi, projelerinin gidişatını analiz etmemi sorabilir ya da Upwork/Fiverr profilini nasıl geliştirebileceğin konusunda tavsiyeler isteyebilirsin. Sana nasıl destek olabilirim?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputValue.trim();
    if (!textToSend || isAiResponding) return;

    if (customText === undefined) {
      setInputValue('');
    }

    const updatedMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(updatedMessages);
    setIsAiResponding(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: {
            profile: data.profile,
            projects: data.projects,
            invoices: data.invoices,
            expenses: data.expenses || []
          }
        })
      });

      if (!response.ok) {
        throw new Error('Asistan yanıt verirken hata oluştu.');
      }

      const resData = await response.json();
      setMessages([...updatedMessages, { role: 'assistant', content: resData.text || 'Geri bildirim alınamadı.' }]);
    } catch (err: any) {
      console.error(err);
      setMessages([...updatedMessages, { role: 'assistant', content: 'Üzgünüm, şu an bağlantıda veya sunucu yanıtında bir sorun yaşıyorum. Lütfen tekrar deneyin. 🤖' }]);
    } finally {
      setIsAiResponding(false);
    }
  };
    
  const activeProjects = data.projects.filter(p => p.status === 'Active').length;
  
  const taxRate = data.profile.taxRate || 0;
  
  const totalGross = totalIncome * (1 + taxRate / 100);
  const totalTax = totalGross - totalIncome;
  
  const pendingGross = pendingIncome * (1 + taxRate / 100);
  const pendingTax = pendingGross - pendingIncome;

  const chartData = useMemo(() => {
    const months: Record<string, number> = {};
    
    // Initialize last 6 months to 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('tr-TR', { month: 'short' });
      months[monthKey] = 0;
    }

    // Add paid invoices
    data.invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        const invDate = new Date(inv.issueDate);
        const monthKey = invDate.toLocaleString('tr-TR', { month: 'short' });
        if (months[monthKey] !== undefined) {
          months[monthKey] += inv.amount;
        }
      }
    });

    return Object.keys(months).map(key => ({
      name: key,
      'Net Gelir': months[key],
      'Brüt Gelir': months[key] * (1 + taxRate / 100)
    }));
  }, [data.invoices, taxRate]);

  const profitMarginData = useMemo(() => {
    const months: Record<string, { income: number, expenses: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('tr-TR', { month: 'short' });
      months[monthKey] = { income: 0, expenses: 0 };
    }

    // Add paid invoices
    data.invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        const invDate = new Date(inv.issueDate);
        const diffMonths = (new Date().getFullYear() - invDate.getFullYear()) * 12 + new Date().getMonth() - invDate.getMonth();
        if (diffMonths >= 0 && diffMonths <= 5) {
           const monthKey = invDate.toLocaleString('tr-TR', { month: 'short' });
           if (months[monthKey]) {
             months[monthKey].income += inv.amount;
           }
        }
      }
    });

    // Add expenses
    (data.expenses || []).forEach(e => {
        const date = new Date(e.date);
        const diffMonths = (new Date().getFullYear() - date.getFullYear()) * 12 + new Date().getMonth() - date.getMonth();
        if (diffMonths >= 0 && diffMonths <= 5) {
           const monthKey = date.toLocaleString('tr-TR', { month: 'short' });
           if (months[monthKey]) {
             months[monthKey].expenses += e.amount;
           }
        }
    });

    return Object.keys(months).map(key => {
      const income = months[key].income;
      const expenses = months[key].expenses;
      const profit = income - expenses;
      const margin = income > 0 ? (profit / income) * 100 : 0;
      return {
        name: key,
        'Gelir': income,
        'Gider': expenses,
        'Kâr Marjı (%)': +margin.toFixed(1)
      };
    });
  }, [data.invoices, data.expenses]);

  const efficiencyData = useMemo(() => {
    return data.projects
      .filter(p => p.status === 'Completed' || p.status === 'Invoiced' || p.status === 'Paid')
      .map(p => {
        const actualHours = +((p.trackedSeconds || 0) / 3600).toFixed(2);
        return {
          name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
          'Tahmini (Saat)': p.estimatedHours || 0,
          'Gerçekleşen (Saat)': actualHours,
          zorluk: p.difficultyRating,
          memnuniyet: p.satisfactionRating
        };
      })
      .filter(p => p['Tahmini (Saat)'] > 0 || p['Gerçekleşen (Saat)'] > 0)
      .slice(-5); // Show last 5 completed projects
  }, [data.projects]);

  const currentMonthGross = useMemo(() => {
    const now = new Date();
    const monthKey = now.toLocaleString('tr-TR', { month: 'short' });
    const currentMonthData = chartData.find(d => d.name === monthKey);
    return currentMonthData ? currentMonthData['Brüt Gelir'] : 0;
  }, [chartData]);

  const monthlyTarget = data.profile.monthlyIncomeTarget;
  const targetProgress = monthlyTarget && monthlyTarget > 0 ? Math.min(100, (currentMonthGross / monthlyTarget) * 100) : 0;

  const currentMonthData = useMemo(() => {
    const now = new Date();
    const currentMonthMonth = now.getMonth();
    const currentMonthYear = now.getFullYear();

    const monthIncome = data.invoices
      .filter(inv => inv.status === 'Paid')
      .filter(inv => {
        const d = new Date(inv.issueDate);
        return d.getMonth() === currentMonthMonth && d.getFullYear() === currentMonthYear;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const monthExpenses = (data.expenses || [])
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonthMonth && d.getFullYear() === currentMonthYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const monthSavings = Math.max(0, monthIncome - monthExpenses);
    let monthSavingsRate = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : 0;
    // Cap at 100% and map negative to 0% for display
    monthSavingsRate = Math.max(0, Math.min(100, monthSavingsRate));

    return {
      income: monthIncome,
      expenses: monthExpenses,
      savings: monthSavings,
      rate: monthSavingsRate
    };
  }, [data.invoices, data.expenses]);

  const aiPredictions = useMemo(() => {
    const completedProjectsWithEstimates = data.projects.filter(
      p => (p.status === 'Completed' || p.status === 'Invoiced' || p.status === 'Paid') && 
           p.estimatedHours && p.estimatedHours > 0 &&
           p.trackedSeconds && p.trackedSeconds > 0
    );

    let avgTimeDeviation = 1.0;
    
    if (completedProjectsWithEstimates.length > 0) {
      const deviations = completedProjectsWithEstimates.map(p => {
        const actualHours = (p.trackedSeconds || 0) / 3600;
        return actualHours / (p.estimatedHours || 1);
      });
      avgTimeDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    }

    const activeProjectPredictions = data.projects
      .filter(p => p.status === 'Active' && p.estimatedHours && p.estimatedHours > 0)
      .map(p => {
        const actualHours = (p.trackedSeconds || 0) / 3600;
        const predictedTotalHours = (p.estimatedHours || 0) * avgTimeDeviation;
        const remainingPredictedHours = Math.max(0, predictedTotalHours - actualHours);
        
        let riskLevel = 'Düşük';
        let riskColor = 'text-emerald-500';
        let riskBg = 'bg-emerald-500/10';
        
        if (avgTimeDeviation > 1.2) {
          riskLevel = 'Orta';
          riskColor = 'text-amber-500';
          riskBg = 'bg-amber-500/10';
        }
        
        if (p.deadline) {
          const hoursUntilDeadline = (new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
          if (remainingPredictedHours > hoursUntilDeadline * 8 / 24) { // Assuming typical 8 hour work day
            riskLevel = 'Yüksek';
            riskColor = 'text-red-500';
            riskBg = 'bg-red-500/10';
          }
        } else if (avgTimeDeviation > 1.5) {
          riskLevel = 'Yüksek';
          riskColor = 'text-red-500';
          riskBg = 'bg-red-500/10';
        }

        const isHourly = data.profile.hourlyRate && data.profile.hourlyRate > 0;
        const predictedExtraCost = isHourly ? ((predictedTotalHours - (p.estimatedHours || 0)) * (data.profile.hourlyRate || 0)) : 0;

        return {
          id: p.id,
          title: p.title,
          estimatedHours: p.estimatedHours || 0,
          actualHours,
          predictedTotalHours,
          riskLevel,
          riskColor,
          riskBg,
          predictedExtraCost
        };
      });

    return {
      avgTimeDeviation,
      predictions: activeProjectPredictions
    };
  }, [data.projects, data.profile.hourlyRate]);

  const categoryInsights = useMemo(() => {
    const categoryEarnings: Record<string, number> = {};
    const clientStats: Record<string, { totalEarnings: number, projectCount: number, satisfactionSum: number, satisfactionCount: number }> = {};

    data.projects.forEach(p => {
      let earnings = p.amount;
      if (p.trackedSeconds && data.profile.hourlyRate) {
        // Assume hourly tracking amounts are billed additionally
        earnings += (p.trackedSeconds / 3600) * data.profile.hourlyRate;
      }
      
      const isCompleted = p.status === 'Completed' || p.status === 'Invoiced' || p.status === 'Paid';
      
      if (isCompleted) {
        const cat = p.category || 'Belirtilmemiş';
        categoryEarnings[cat] = (categoryEarnings[cat] || 0) + earnings;
        
        const client = p.clientName || 'Bilinmeyen Müşteri';
        if (!clientStats[client]) {
          clientStats[client] = { totalEarnings: 0, projectCount: 0, satisfactionSum: 0, satisfactionCount: 0 };
        }
        clientStats[client].totalEarnings += earnings;
        clientStats[client].projectCount += 1;
        if (p.satisfactionRating) {
          clientStats[client].satisfactionSum += p.satisfactionRating;
          clientStats[client].satisfactionCount += 1;
        }
      }
    });

    const categoriesArray = Object.entries(categoryEarnings).map(([name, value]) => ({ name, value }));
    const topCategory = categoriesArray.sort((a, b) => b.value - a.value)[0];

    const topClients = Object.entries(clientStats)
      .map(([name, stats]) => {
        const avgSat = stats.satisfactionCount > 0 ? stats.satisfactionSum / stats.satisfactionCount : 0;
        const loyaltyScore = Math.min(100, (stats.projectCount * 15) + (avgSat * 10));
        
        return {
          name,
          ...stats,
          avgSatisfaction: avgSat,
          loyaltyScore: Math.round(loyaltyScore)
        };
      })
      .sort((a, b) => b.loyaltyScore - a.loyaltyScore)
      .slice(0, 3); // top 3 clients

    return {
      topCategory: topCategory || null,
      topClients,
      chartData: categoriesArray
    };
  }, [data.projects, data.profile.hourlyRate]);

  const riskAnalysis = useMemo(() => {
    // Calculate global metrics from past (completed) projects
    const completedProjects = data.projects.filter(p => p.status === 'Completed' || p.status === 'Paid' || p.status === 'Invoiced');
    
    let historicalBudgetOverrunCount = 0;
    let historicalTimeOverrunCount = 0;
    let averageOverrunPercentage = 0;
    let totalOverruns = 0;

    let totalHistoricalProjectsWithEstimates = 0;

    completedProjects.forEach(p => {
      const actualHours = (p.trackedSeconds || 0) / 3600;
      if (p.estimatedHours && p.estimatedHours > 0) {
        totalHistoricalProjectsWithEstimates++;
        if (actualHours > p.estimatedHours) {
          historicalBudgetOverrunCount++;
          const overrunPct = ((actualHours - p.estimatedHours) / p.estimatedHours) * 100;
          totalOverruns += overrunPct;
        }
      }
      
      // Delay heuristic: if date is long ago vs deadline etc.
      // Since we don't have completedAt, we'll use budget overrun strictly and maybe manual deadline parsing if possible
    });

    if (historicalBudgetOverrunCount > 0) {
      averageOverrunPercentage = totalOverruns / historicalBudgetOverrunCount;
    }

    const activeProjectRisks = data.projects
      .filter(p => p.status === 'Active')
      .map(p => {
        let riskScore = 0;
        const actualHours = (p.trackedSeconds || 0) / 3600;
        
        let budgetBurnRate = 0;
        let timeUrgency = 0;
        const reasons = [];

        // Budget Risk
        if (p.estimatedHours && p.estimatedHours > 0) {
          budgetBurnRate = (actualHours / p.estimatedHours) * 100;
          if (budgetBurnRate > 100) {
            riskScore += 50;
            reasons.push(`Bütçe %${(budgetBurnRate - 100).toFixed(0)} aşıldı.`);
          } else if (budgetBurnRate > 80) {
            riskScore += 25;
            reasons.push(`Bütçenin %${budgetBurnRate.toFixed(0)}'i kullanıldı.`);
          }
        }

        // Time Risk
        if (p.deadline) {
          const hoursUntilDeadline = (new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
          const daysUntilDeadline = hoursUntilDeadline / 24;
          
          if (daysUntilDeadline < 0) {
            riskScore += 60;
            reasons.push(`Teslim tarihi ${Math.abs(daysUntilDeadline).toFixed(0)} gün geçti.`);
          } else if (daysUntilDeadline < 2) {
            riskScore += 40;
            reasons.push("Teslime 2 günden az kaldı.");
          } else if (daysUntilDeadline < 5) {
            riskScore += 15;
            reasons.push("Teslime 5 günden az kaldı.");
          }
        }
        
        if (p.difficultyRating && p.difficultyRating >= 4) {
          riskScore += 10;
          reasons.push("Yüksek zorluk derecesi.");
        }

        // Cap risk at 100
        riskScore = Math.min(100, riskScore);

        let riskLevel = 'Düşük Risk';
        let riskColor = 'text-emerald-500';
        let cardBorder = 'border-emerald-200 dark:border-emerald-800/30';
        let bgMark = 'bg-emerald-50 dark:bg-emerald-900/10';

        if (riskScore >= 75) {
          riskLevel = 'Yüksek Risk';
          riskColor = 'text-red-500';
          cardBorder = 'border-red-400 dark:border-red-500/50';
          bgMark = 'bg-red-50 dark:bg-red-900/20';
        } else if (riskScore >= 40) {
          riskLevel = 'Orta Risk';
          riskColor = 'text-amber-500';
          cardBorder = 'border-amber-300 dark:border-amber-500/30';
          bgMark = 'bg-amber-50 dark:bg-amber-900/10';
        }

        return {
          id: p.id,
          title: p.title,
          clientName: p.clientName,
          riskScore,
          riskLevel,
          riskColor,
          cardBorder,
          bgMark,
          reasons
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore); // Highest risk first

    return {
      historicalFailureRate: totalHistoricalProjectsWithEstimates > 0 
        ? ((historicalBudgetOverrunCount / totalHistoricalProjectsWithEstimates) * 100) 
        : 0,
      averageOverrunPercentage,
      activeProjectRisks
    };
  }, [data.projects]);

  const upcomingDeadlines = useMemo(() => {
    return data.projects
      .filter(p => p.status === 'Active' && p.deadline)
      .map(p => {
        const diffTime = new Date(p.deadline!).getTime() - Date.now();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...p,
          diffDays
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 4);
  }, [data.projects]);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    // Add Months Data
    csvContent += "Aylık Gelir Trendi\n";
    csvContent += "Ay,Net Gelir,Brüt Gelir\n";
    chartData.forEach(row => {
      csvContent += `${row.name},${row['Net Gelir']},${row['Brüt Gelir']}\n`;
    });
    
    csvContent += "\n";
    
    // Add Efficiency Data
    csvContent += "Proje Zaman Verimliliği\n";
    csvContent += "Proje,Tahmini (Saat),Gerçekleşen (Saat),Zorluk,Memnuniyet\n";
    efficiencyData.forEach(row => {
      csvContent += `"${row.name.replace(/"/g, '""')}",${row['Tahmini (Saat)']},${row['Gerçekleşen (Saat)']},${row.zorluk || ''},${row.memnuniyet || ''}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finansal_ozet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Freelance Asistanı</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tekrar hoş geldin, {data.profile.name || 'Freelancer'} • Finansal Genel Bakış</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV İndir
        </button>
      </header>

      {monthlyTarget && monthlyTarget > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Aylık Gelir Hedefi</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(currentMonthGross)}</span>
                <span className="text-sm font-medium text-slate-400">/ {formatCurrency(monthlyTarget)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl font-bold ${targetProgress >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                %{targetProgress.toFixed(0)}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${targetProgress}%` }} 
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full rounded-full ${targetProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
            />
          </div>
          {targetProgress >= 100 && (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium mt-3 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tebrikler, aylık hedefinize ulaştınız!
            </p>
          )}
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 shrink-0 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="36" className="text-slate-100 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="none" />
            <circle 
              cx="48" 
              cy="48" 
              r="36" 
              className={currentMonthData.rate > 50 ? "text-emerald-500" : currentMonthData.rate > 20 ? "text-blue-500" : "text-amber-500"} 
              strokeWidth="8" 
              strokeDasharray={`${currentMonthData.rate * 2.26} 226`} 
              stroke="currentColor" 
              fill="none" 
              strokeLinecap="round" 
              style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">%{currentMonthData.rate.toFixed(0)}</span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Aylık Tasarruf Oranı (Savings Rate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Bu ay kazandığınız toplam gelire ({formatCurrency(currentMonthData.income)}) kıyasla, iş giderlerinizin ({formatCurrency(currentMonthData.expenses)}) ardından elinizde kalan net tasarruf oranınızdır.
          </p>
          <div className="inline-flex gap-4">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg text-left">
               <span className="block text-[10px] text-slate-500 font-bold uppercase">Bu Ayki Gelir</span>
               <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(currentMonthData.income)}</span>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg text-left">
               <span className="block text-[10px] text-slate-500 font-bold uppercase">Bu Ayki Gider</span>
               <span className="font-mono text-sm text-red-500 font-bold">{formatCurrency(currentMonthData.expenses)}</span>
             </div>
          </div>
        </div>
      </div>

      <div id="onboarding-financial-cards" className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
           <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">Brüt Gelir</span>
           <div className="mt-3 flex items-baseline gap-2">
             <span className="text-3xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(totalGross)}</span>
           </div>
           <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 shrink-0">
             Net Gelir: {formatCurrency(totalIncome)}
           </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
           <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">Toplam Gider</span>
           <div className="mt-3 flex items-baseline gap-2">
             <span className="text-3xl font-black text-red-500">{formatCurrency(totalExpenses)}</span>
           </div>
           <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 shrink-0">
             Tüm harcamalar
           </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-emerald-500 p-6 rounded-2xl shadow-sm shadow-emerald-500/20 flex flex-col justify-between text-white">
           <span className="text-emerald-100 font-medium text-sm font-bold tracking-wider uppercase">Gerçek Net Kâr</span>
           <div className="mt-3 flex items-baseline gap-2">
             <span className="text-3xl font-black">{formatCurrency(trueNetProfit)}</span>
           </div>
           <div className="mt-3 text-xs text-emerald-100 border-t border-emerald-400/30 pt-2 shrink-0 flex justify-between">
             Net Kâr Marjı: %{totalIncome > 0 ? ((trueNetProfit / totalIncome) * 100).toFixed(1) : 0}
           </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-indigo-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white relative overflow-hidden">
          <div className="z-10">
            <span className="text-indigo-200 font-medium text-sm flex items-center gap-2"><FolderKanban className="w-4 h-4" /> Aktif Projeler</span>
            <h3 className="text-4xl font-black mt-2">{activeProjects}</h3>
            <p className="text-indigo-300 text-xs mt-1">Şu an devam eden</p>
          </div>
          <svg className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-indigo-800 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        </motion.div>
      </div>

      {/* Gelişmiş Vergi ve Elde Kalan Nakit Tahmincisi */}
      <div id="onboarding-tax-sandboxes" className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Gelişmiş Vergi & Net Kâr Hesaplayıcı</h3>
              <p className="text-xs text-slate-400 mt-1">Gelecekteki kazanç simülasyonları ile vergi yükümlülüklerinizi planlayın.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Tahmin Motoru AKTİF</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Simüle Edilecek Brüt Gelir</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">₺/$</span>
                  <input 
                    type="number" 
                    value={forecastTargetIncome === 0 ? '' : forecastTargetIncome} 
                    onChange={e => setForecastTargetIncome(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono font-bold"
                    placeholder="Gelir Girin..."
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Simüle Edilecek Vergi Oranı</label>
                  <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">%{sliderTaxRate}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={sliderTaxRate} 
                  onChange={e => setSliderTaxRate(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>%0 (Vergisiz)</span>
                  <span>%20 (Standart)</span>
                  <span>%50 (Yüksek Gelir)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">SİMÜLASYON SONUÇLARI</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Hedeflenen Gelir:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(forecastTargetIncome)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Hesaplanan Gider Payı (Genel %{(data.expenses && data.expenses.length > 0 && totalIncome > 0) ? ((totalExpenses / totalIncome) * 100).toFixed(0) : '5'}):</span>
                    <span className="font-mono font-bold text-red-500 font-medium">
                      -{formatCurrency(forecastTargetIncome * ((data.expenses && data.expenses.length > 0 && totalIncome > 0) ? (totalExpenses / totalIncome) : 0.05))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Ayrılması Gereken Vergi:</span>
                    <span className="font-mono font-bold text-amber-500 font-medium">
                      -{formatCurrency(forecastTargetIncome * (sliderTaxRate / 100))}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Elde Kalan Tahmini Net Nakit:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Math.max(0, forecastTargetIncome - (forecastTargetIncome * (sliderTaxRate / 100)) - (forecastTargetIncome * ((data.expenses && data.expenses.length > 0 && totalIncome > 0) ? (totalExpenses / totalIncome) : 0.05))))}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
                * Bu hesaplama girdiğiniz vergi oranı ve mevcut masraf/gelir oranlarınız doğrultusunda tahmini olarak yapılmıştır. Resmi beyan niteliği taşımaz.
              </p>
            </div>
          </div>
        </div>

        {/* Client Scorecard & Health panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Müşteri Memnuniyeti & Bağlılık Karnesi</h4>
            <p className="text-xs text-slate-400 mb-4">Tamamlanan projelerdeki memnuniyet puanlarına göre müşteri sağlığı.</p>
            
            <div className="space-y-4">
              {categoryInsights.topClients && categoryInsights.topClients.length > 0 ? (
                categoryInsights.topClients.map((client) => (
                  <div key={client.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{client.name}</span>
                      <span className="text-[10px] font-mono text-blue-500 font-bold">Bağlılık Skoru: %{client.loyaltyScore}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        style={{ width: `${client.loyaltyScore}%` }} 
                        className={`h-full rounded-full ${client.loyaltyScore >= 80 ? 'bg-emerald-500' : client.loyaltyScore >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>{client.projectCount} Proje</span>
                      <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {client.avgSatisfaction.toFixed(1)}/5 Memnuniyet</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-6 text-xs">
                  Sağlık verisini dolduracak derecelendirilmiş tamamlanmış proje bulunmuyor.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 leading-relaxed">
            Puanlar proje sonlarında tamamlanan projelere atanan Memnuniyet Oranından (1-5) otomatik türetilir.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Aylık Gelir Trendi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="Brüt Gelir" 
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Net Gelir" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Net Kâr Marjı Analizi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitMarginData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  dx={-10}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `%${value}`}
                  dx={10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => name === 'Kâr Marjı (%)' ? `%${value}` : formatCurrency(value)}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="Gelir" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar yAxisId="left" dataKey="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="Kâr Marjı (%)" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Proje Zaman Verimliliği</h3>
          <div className="h-72">
            {efficiencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-xl">
                            <p className="font-bold text-slate-800 mb-2">{label}</p>
                            <p className="text-sm text-slate-600">Tahmini: {data['Tahmini (Saat)']} Saat</p>
                            <p className="text-sm text-slate-600 mb-2">Gerçekleşen: {data['Gerçekleşen (Saat)']} Saat</p>
                            {data.zorluk && <p className="text-xs text-amber-600 font-medium">Zorluk: {'★'.repeat(data.zorluk)}{'☆'.repeat(5 - data.zorluk)}</p>}
                            {data.memnuniyet && <p className="text-xs text-emerald-600 font-medium mt-1">Memnuniyet: {'★'.repeat(data.memnuniyet)}{'☆'.repeat(5 - data.memnuniyet)}</p>}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} iconType="circle" />
                  <Bar dataKey="Tahmini (Saat)" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Gerçekleşen (Saat)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                Yeterli tamamlanmış proje verisi yok.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Net Kâr Marjı Analizi (Son 6 Ay)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={profitMarginData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                dx={-10}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `%${value}`}
                dx={10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => name === 'Kâr Marjı (%)' ? `%${value}` : formatCurrency(value)}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} iconType="circle" />
              <Bar yAxisId="left" dataKey="Gelir" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar yAxisId="left" dataKey="Gider" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="Kâr Marjı (%)" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🤖 Yapay Zeka Yardımcı Asistanı (Sohbet Modülü) */}
      <div id="onboarding-ai-assistant" className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                  Freelance AI Asistanınız
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] uppercase px-1.5 py-0.5 rounded-full font-bold">Aktif</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Finansallarınız, projeleriniz, vergi durumunuz veya platform stratejileriniz hakkında anında destek alın.</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setMessages([
                  {
                    role: 'assistant',
                    content: `Merhaba **${data.profile.name || 'Freelancer'}**! Ben senin akıllı iş asistanınım. \n\nSana nasıl destek olabilirim?`
                  }
                ]);
              }}
              className="text-xs font-bold text-slate-450 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors self-end sm:self-auto cursor-pointer"
              title="Sohbeti Sıfırla"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sohbeti Sıfırla
            </button>
          </div>

          {/* Sohbet Kutusu Akışı */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 max-h-[380px] overflow-y-auto mb-4 space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-xs select-none ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-805 text-slate-700 dark:text-slate-300'}`}>
                  {msg.role === 'user' ? (data.profile.name ? data.profile.name.substring(0, 2).toUpperCase() : 'U') : <Bot className="w-4 h-4 text-blue-500" />}
                </div>

                {/* Balon */}
                <div className={`rounded-2xl px-4 py-2.5 text-xs shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'}`}>
                  {parseMarkdownToJSX(msg.content)}
                </div>
              </div>
            ))}

            {isAiResponding && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                  <Bot className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <span className="text-[11px] text-slate-400 font-medium">Asistan düşünüyor...</span>
                </div>
              </div>
            )}
          </div>

          {/* Hazır Soru Kalıpları */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold self-center uppercase tracking-wider">Hızlı Sorular:</span>
            {[
              { label: '💼 Finansal durumumu özetler misin?', query: 'Finansal durumumu güncel ödenmiş gelirlerim, faturalarım ve giderlerim çerçevesinde özetleyip net kârımı değerlendirir misin?' },
              { label: '📈 Gelirlerimi nasıl artırabilirim?', query: 'Gelirlerimi artırmak ve aylık hedefime daha hızlı yaklaşmak için ne gibi stratejiler izlemeliyim?' },
              { label: '⏰ Proje & Zaman yönetimi tavsiyesi', query: 'Projelerimi daha verimli planlamak, teslim sürelerini aşmamak ve iş-yaşam dengesini kurmak için rehberlik edebilir misin?' },
              { label: '🔥 Upwork / Fiverr taktikleri', query: 'Upwork ve Fiverr platformlarında daha fazla yüksek bütçeli iş kapmak, dikkat çekici teklifler yazmak için pratik taktikler sunar mısın?' }
            ].map((suggest, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggest.query)}
                disabled={isAiResponding}
                className="text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/60 px-3 py-1.5 rounded-full cursor-pointer transition-colors disabled:opacity-50"
              >
                {suggest.label}
              </button>
            ))}
          </div>

          {/* Input Alanı */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              disabled={isAiResponding}
              placeholder="Asistana freelance işleriniz hakkında sorun... (örn: 'Net kârımı hesapla ve öneri ver.')"
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isAiResponding || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 shrink-0 shadow-sm"
              title="Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">En Çok Kazandıran Kategori</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tamamlanan projelerin gelir dağılımı</p>
            </div>
          </div>
          
          {categoryInsights.topCategory ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">{categoryInsights.topCategory.name}</span>
                <p className="mt-4 text-3xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(categoryInsights.topCategory.value)}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Toplam Kazanç</p>
              </div>
              <div className="space-y-3">
                {categoryInsights.chartData.sort((a, b) => b.value - a.value).slice(0, 4).map(cat => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{cat.name}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-400">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Yeterli veri yok.</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Müşteri Sadakat Skorları</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Proje sayısı ve memnuniyet oranlarına göre</p>
            </div>
          </div>

          {categoryInsights.topClients.length > 0 ? (
            <div className="space-y-4">
              {categoryInsights.topClients.map((client, idx) => (
                <div key={client.name} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{client.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{client.projectCount} Proje</span>
                      <span>&middot;</span>
                      <span className="font-mono">{formatCurrency(client.totalEarnings)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-amber-500 mb-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{client.avgSatisfaction > 0 ? client.avgSatisfaction.toFixed(1) : '-'}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full inline-block">
                      Sadakat: {client.loyaltyScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Yeterli veri yok.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
        <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Son Projeler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Proje Adı</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Durum</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.projects.slice(-4).reverse().map(project => (
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
                      <p className="text-sm font-semibold">{project.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{project.clientName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold">
                        {translateStatus(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                      {formatCurrency(project.amount, project.currency)}
                    </td>
                  </tr>
                ))}
                {data.projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Henüz proje yok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Son Faturalar</h3>
            <div className="space-y-4">
              {data.invoices.slice(-4).reverse().map(invoice => {
                const isPaid = invoice.status === 'Paid';
                const taxRate = data.profile.taxRate || 0;
                const totalGross = invoice.amount * (1 + taxRate / 100);
                return (
                  <div key={invoice.id} className={`flex gap-3 border-l-2 pl-3 py-1 ${isPaid ? 'border-emerald-500' : 'border-amber-500'}`}>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{invoice.invoiceNumber} {isPaid && <span className="text-yellow-500">💰</span>}</p>
                      <p className="text-slate-500 dark:text-slate-400">{formatCurrency(totalGross)} {taxRate > 0 ? '(Brüt)' : ''} &middot; {translateStatus(invoice.status)}</p>
                    </div>
                  </div>
                );
              })}
              {data.invoices.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-4">Henüz fatura yok.</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Proje Risk Skoru
            </h3>
            
            {riskAnalysis.historicalFailureRate > 0 && (
              <div className="mb-4 text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Geçmiş projelerin <strong className="text-slate-800 dark:text-slate-200">%{(riskAnalysis.historicalFailureRate).toFixed(0)}</strong>'sinde bütçe/zaman aşıldı. 
                Ortalama aşım oranı: <strong className="text-red-500">+{riskAnalysis.averageOverrunPercentage.toFixed(0)}%</strong>.
              </div>
            )}

            <div className="space-y-3">
              {riskAnalysis.activeProjectRisks.slice(0, 3).map(risk => (
                <div key={risk.id} className={`p-3 rounded-xl border ${risk.cardBorder} ${risk.bgMark} flex flex-col gap-2 transition-all`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{risk.title}</h4>
                       <p className="text-[10px] text-slate-500">{risk.clientName}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${risk.riskColor} bg-white dark:bg-slate-800 shadow-sm whitespace-nowrap`}>
                      {risk.riskScore} Puan
                    </span>
                  </div>
                  
                  {risk.reasons.length > 0 && (
                    <ul className="text-xs text-slate-600 dark:text-slate-400 pl-4 list-disc space-y-0.5">
                      {risk.reasons.map((reason, i) => (
                        <li key={i} className={risk.riskScore >= 75 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {riskAnalysis.activeProjectRisks.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-4">Aktif proje bulunmuyor.</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Yaklaşan Teslimatlar
            </h3>
            
            <div className="space-y-3">
              {upcomingDeadlines.map(deadline => (
                <div key={deadline.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{deadline.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{new Date(deadline.deadline!).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                    deadline.diffDays < 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                    deadline.diffDays === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                    deadline.diffDays <= 3 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                    'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {deadline.diffDays < 0 ? `${Math.abs(deadline.diffDays)} Gün Gecikti` : 
                     deadline.diffDays === 0 ? 'Bugün' : 
                     `${deadline.diffDays} Gün Kaldı`}
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-4">Yaklaşan teslimat yok.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
