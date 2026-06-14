import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { ChevronRight, ChevronLeft, Sparkles, X, Bot, Landmark, BadgeAlert, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Step {
  title: string;
  description: string;
  selector?: string;
  icon: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export function OnboardingTour() {
  const { data, updateProfile } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Run tour if profile hasCompletedTour is not true
  useEffect(() => {
    if (data.profile && data.profile.hasCompletedTour !== true) {
      // Delay slightly for smooth page loading
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [data.profile?.hasCompletedTour]);

  const steps: Step[] = [
    {
      title: "🤖 gigpath Portalına Hoş Geldiniz!",
      description: "Serbest çalışanlar (freelancerlar) için özel tasarlanmış, çevrimdışı öncelikli zaman ve gelir portalınızı keşfedin. Sizin için hazırladığımız küçük interaktif turla önemli yetenekleri 1 dakikada keşfedin!",
      icon: <Sparkles className="w-8 h-8 text-yellow-500 animate-spin" />,
      position: 'center'
    },
    {
      title: "📂 İş Yönetim Menüsü",
      description: "Sol kontrol panelinden Müşterilerinizi, Projelerinizi, Gelir-Giderleri, Faturalarınızı ve detaylı e-posta ayarlarınızı pratik bir şekilde yönetin.",
      selector: "#onboarding-sidebar",
      icon: <Layers className="w-6 h-6 text-blue-500" />,
      position: 'right'
    },
    {
      title: "💰 Finansal Sağlık & Net Kâr",
      description: "Buradan brüt gelirlerinizi, masraflarınızı ve geriye kalan net kâr oranınızı her an canlı takip edin. Tüm finansal hesaplamalarınız otomatik güncellenir.",
      selector: "#onboarding-financial-cards",
      icon: <Landmark className="w-6 h-6 text-emerald-500" />,
      position: 'bottom'
    },
    {
      title: "📊 Gelişmiş Vergi & Nakit Planlayıcı",
      description: "Gelir hedeflerinizi simüle edin ve vergi oranını kaydırarak net kalacak kazanç tahminlerinizi yapın. Verginizi şimdiden planlamak hiç bu kadar kolay olmamıştı!",
      selector: "#onboarding-tax-sandboxes",
      icon: <BadgeAlert className="w-6 h-6 text-amber-500" />,
      position: 'top'
    },
    {
      title: "🤖 Yapay Zeka Yardımcı Asistanı",
      description: "Upwork'te nasıl iş kaparsınız? Gelirlerinizi nasıl artırırsınız? Sizin gerçek finansal ve proje verilerinize dayanarak akıllı tavsiyeler sunan asistanınızla sohbete başlayın!",
      selector: "#onboarding-ai-assistant",
      icon: <Bot className="w-6 h-6 text-indigo-500" />,
      position: 'top'
    },
    {
      title: "🔄 Bulut Senkronizasyonu & Güvenlik",
      description: "İnternet bağlantınız kopsa bile portalınız çalışmaya devam eder. Bağlantı sağlandığında tüm şifreli verileriniz otomatik olarak bulut sunucularına yedeklenir.",
      selector: "#onboarding-sync",
      icon: <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />,
      position: 'bottom'
    },
    {
      title: "🎉 Harika, Başlamaya Hazırsınız!",
      description: "Seçkin tasarım dili ve akıllı yapay zeka entegrasyonuyla serbest çalışma kariyerinizi bir üst seviyeye taşımak artık sizin elinizde. Bol kazançlar ve keyifli çalışmalar dileriz!",
      icon: <ShieldCheck className="w-10 h-10 text-emerald-500 animate-bounce" />,
      position: 'center'
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    const currentSelector = steps[currentStep]?.selector;
    if (!currentSelector) {
      setTargetRect(null);
      return;
    }

    // Scroll target into view ONCE when step or selector changes
    const el = document.querySelector(currentSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const updatePosition = () => {
      const targetEl = document.querySelector(currentSelector);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        // Guard hidden/collapsed elements
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    // Run first layout query immediately
    updatePosition();

    // Schedule incremental updates to track smooth scrolling transitions accurately
    const delays = [50, 100, 150, 200, 300, 400, 500, 600, 750, 1000];
    const timers = delays.map(d => setTimeout(updatePosition, d));

    // Listen to resize and scroll on all containers with capture: true
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { capture: true });

    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    updateProfile({ hasCompletedTour: true });
    setIsVisible(false);

    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const hasTarget = !!targetRect;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  if (hasTarget && targetRect) {
    const margin = 16;
    const { top, left, bottom, right, width, height } = targetRect;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (windowWidth < 768) {
      tooltipStyle.left = '16px';
      tooltipStyle.width = 'calc(100vw - 32px)';
      tooltipStyle.bottom = '16px';
      tooltipStyle.top = 'auto';
    } else {
      if (step.position === 'right') {
        tooltipStyle.top = Math.max(margin, Math.min(top + height / 2 - 120, windowHeight - 280));
        tooltipStyle.left = Math.max(margin, Math.min(right + margin, windowWidth - 340));
        tooltipStyle.width = '320px';
      } else if (step.position === 'left') {
        tooltipStyle.top = Math.max(margin, Math.min(top + height / 2 - 120, windowHeight - 280));
        tooltipStyle.left = Math.max(margin, left - 320 - margin);
        tooltipStyle.width = '320px';
      } else if (step.position === 'top') {
        tooltipStyle.top = top - 220 - margin;
        tooltipStyle.left = Math.max(margin, Math.min(left + width / 2 - 160, windowWidth - 340));
        tooltipStyle.width = '320px';
      } else {
        tooltipStyle.top = bottom + margin;
        tooltipStyle.left = Math.max(margin, Math.min(left + width / 2 - 160, windowWidth - 340));
        tooltipStyle.width = '320px';
      }
    }
  }

  // --- RENDERING PATH 1: CENTERED DIALOGS (e.g. Greeting and Final steps) ---
  if (!hasTarget) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[9998] overflow-hidden pointer-events-none select-none flex items-center justify-center p-4">
        {/* Darkened overlay backdrop */}
        <div className="absolute inset-0 bg-slate-950/45 dark:bg-slate-950/65 backdrop-blur-[1.5px] pointer-events-auto" onClick={handleComplete} />

        <div className="relative z-[9999] pointer-events-none w-[440px] max-w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 pointer-events-auto text-slate-800 dark:text-slate-100 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                    {step.icon}
                  </div>
                  <h2 className="font-sans font-extrabold text-sm tracking-wide text-slate-900 dark:text-neutral-55 leading-snug">
                    {step.title}
                  </h2>
                </div>
                <button 
                  onClick={handleComplete}
                  className="p-1.5 rounded-full text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <div className="text-slate-600 dark:text-slate-300 text-xs font-normal leading-relaxed mb-6">
                {step.description}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-mono">
                  ADIM {currentStep + 1} / {steps.length}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={handleComplete}
                    className="text-[11px] font-bold text-slate-400 hover:text-red-550 transition-colors px-2 py-1.5 cursor-pointer"
                  >
                    Turu Atla
                  </button>
                  
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      title="Geri"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm shadow-blue-500/10"
                  >
                    <span>{currentStep === steps.length - 1 ? 'Tamamla' : 'Sonraki'}</span>
                    {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>,
      document.body
    );
  }

  // --- RENDERING PATH 2: TARGET HIGHLIGHT BUBBLE ---
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9998] overflow-hidden pointer-events-none select-none">
      {/* Darkened overlay backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-[1px] pointer-events-auto" onClick={handleComplete} />

      {/* Pulsing focal highlight selector ring */}
      <div 
        className="absolute border-2 border-blue-500 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] dark:shadow-[0_0_0_9999px_rgba(2,6,23,0.65)] pointer-events-none transition-all duration-300 animate-pulse"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          zIndex: 9998
        }}
      />

      {/* Step Speech Bubble Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.18 }}
          style={tooltipStyle}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 pointer-events-auto text-slate-800 dark:text-slate-100 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-800">
                {step.icon}
              </div>
              <h2 className="font-sans font-extrabold text-sm tracking-wide text-slate-900 dark:text-neutral-50 leading-snug">
                {step.title}
              </h2>
            </div>
            <button 
              onClick={handleComplete}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <div className="text-slate-600 dark:text-slate-355 text-xs font-normal leading-relaxed mb-5">
            {step.description}
          </div>

          {/* Bottom Bar: Steps indicator and controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-mono">
              ADIM {currentStep + 1} / {steps.length}
            </span>

            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                className="text-[11px] font-bold text-slate-400 hover:text-red-550 transition-colors px-2 py-1.5 cursor-pointer"
              >
                Turu Atla
              </button>
              
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  title="Geri"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm shadow-blue-500/10"
              >
                <span>{currentStep === steps.length - 1 ? 'Tamamla' : 'Sonraki'}</span>
                {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
