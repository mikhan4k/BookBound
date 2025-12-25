
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sun, 
  Moon, 
  Target,
  BookMarked,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ReadingData, ScheduleItem } from './types';
import { getReadingAdvice } from './services/geminiService';

const STORAGE_KEY = 'bookbound_data_v2';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [data, setData] = useState<ReadingData>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return {
      bookTitle: '',
      totalPages: 0,
      pagesRead: 0,
      targetFinishDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      pagesPerDay: 20
    };
  });

  const [advice, setAdvice] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const today = useMemo(() => new Date(), []);
  const pagesLeft = Math.max(0, (Number(data.totalPages) || 0) - (Number(data.pagesRead) || 0));
  const completionPercent = data.totalPages > 0 ? Math.min(100, Math.round((data.pagesRead / data.totalPages) * 100)) : 0;

  useEffect(() => {
    if (!data.bookTitle || pagesLeft === 0) {
      setAdvice('');
      return;
    }
    const fetchAdvice = async () => {
      try {
        const tip = await getReadingAdvice(data.bookTitle, pagesLeft, data.pagesPerDay);
        if (tip) setAdvice(tip);
      } catch (e) {
        console.error("Gemini service failed", e);
      }
    };
    const timer = setTimeout(fetchAdvice, 2000);
    return () => clearTimeout(timer);
  }, [data.bookTitle, pagesLeft, data.pagesPerDay]);

  const schedule = useMemo(() => {
    const items: ScheduleItem[] = [];
    if (pagesLeft <= 0 || data.pagesPerDay <= 0) return items;

    let currentPagesRead = Number(data.pagesRead);
    const total = Number(data.totalPages);
    const pace = Number(data.pagesPerDay);
    let dayCount = 1;

    while (currentPagesRead < total) {
      const date = addDays(today, dayCount);
      const remainingForTarget = total - currentPagesRead;
      const readToday = Math.min(pace, remainingForTarget);
      
      const startPage = currentPagesRead + 1;
      const endPage = currentPagesRead + readToday;
      currentPagesRead += readToday;
      
      items.push({
        date: format(date, 'MMM dd, EEE'),
        pagesToReadToday: readToday,
        startPage,
        endPage,
        cumulativePagesRead: currentPagesRead,
        percentComplete: Math.round((currentPagesRead / total) * 100)
      });

      dayCount++;
      if (dayCount > 180) break; 
    }
    return items;
  }, [data, pagesLeft, today]);

  const estimatedFinishDate = schedule.length > 0 
    ? schedule[schedule.length - 1].date 
    : 'N/A';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue: string | number = value;
    if (name !== 'bookTitle' && name !== 'targetFinishDate') {
      newValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    }
    setData(prev => ({ ...prev, [name]: newValue }));
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-tr from-indigo-50 via-white to-rose-50 dark:from-slate-950 dark:via-black dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans pb-12 selection:bg-rose-500 selection:text-white">
      
      {/* Dynamic Navigation */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-indigo-100 dark:border-indigo-900/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">BookBound</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              <span>{format(today, 'MMM d, yyyy')}</span>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Title Row */}
        <div className="flex items-center justify-between gap-3 bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-white/50 dark:border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-500">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black tracking-tight uppercase text-slate-500 dark:text-slate-400">Dashboard</h2>
          </div>
          <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-indigo-500" /> Today: {format(today, 'EEE, d MMM')}
          </div>
        </div>

        {/* AI Insight Bar */}
        {advice && (
          <div className="relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 p-[1px] rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none">
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-[15px] flex gap-3 items-center">
              <div className="bg-gradient-to-br from-amber-400 to-rose-500 p-2 rounded-xl shadow-lg">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 italic">
                "{advice}"
              </p>
            </div>
          </div>
        )}

        {/* Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Inputs Section */}
          <div className="md:col-span-5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-indigo-50 dark:border-indigo-900/30 shadow-sm">
              <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                <Target className="w-3 h-3" /> Book Settings
              </h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  name="bookTitle"
                  value={data.bookTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-400 focus:ring-0 text-[14px] font-bold"
                  placeholder="What are you reading?"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Total</label>
                    <input 
                      type="number" 
                      name="totalPages"
                      value={data.totalPages || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-purple-400 text-[14px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Read</label>
                    <input 
                      type="number" 
                      name="pagesRead"
                      value={data.pagesRead || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-rose-400 text-[14px] font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Deadline</label>
                    <input 
                      type="date" 
                      name="targetFinishDate"
                      value={data.targetFinishDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-amber-400 text-[12px] font-bold [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Daily Goal</label>
                    <input 
                      type="number" 
                      name="pagesPerDay"
                      value={data.pagesPerDay || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-400 text-[14px] font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 shadow-lg shadow-rose-100/50 dark:shadow-none flex flex-col justify-center transition-transform active:scale-95">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">To Go</span>
              <div className="text-3xl font-black tabular-nums text-slate-800 dark:text-slate-100">{pagesLeft}</div>
              <span className="text-[9px] text-rose-400 font-bold uppercase mt-1">Pages Left</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30 shadow-lg shadow-amber-100/50 dark:shadow-none flex flex-col justify-center transition-transform active:scale-95">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pace</span>
              <div className="text-3xl font-black tabular-nums text-slate-800 dark:text-slate-100">{data.pagesPerDay}</div>
              <span className="text-[9px] text-amber-500 font-bold uppercase mt-1">Daily Target</span>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-none flex flex-col justify-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Finish</span>
              <div className="text-[15px] font-black text-white mt-1 leading-tight">{estimatedFinishDate === 'N/A' ? '--' : estimatedFinishDate}</div>
              <span className="text-[9px] text-indigo-200 font-bold uppercase mt-2 bg-white/10 w-fit px-2 py-0.5 rounded-full">Projected</span>
            </div>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-2">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Overall Progress</h4>
             <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400">{completionPercent}%</span>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 relative overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-1000 ease-out"
              style={{ width: `${completionPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Schedule Roadmap */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-50 dark:border-indigo-900/30 shadow-2xl shadow-indigo-100/30 dark:shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-500 to-indigo-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-white" />
               <h3 className="text-[12px] font-black text-white uppercase tracking-wider">Reading Roadmap</h3>
            </div>
            <span className="text-[9px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full uppercase border border-white/30 backdrop-blur-sm">Starts Tomorrow</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Target Page</th>
                  <th className="px-6 py-3 text-right">Goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900/10">
                {schedule.length > 0 ? schedule.slice(0, 31).map((item, idx) => (
                  <tr key={idx} className={`transition-all group ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}>
                    <td className="px-6 py-3.5">
                      <div className="text-[13px] font-black text-slate-800 dark:text-slate-100">{item.date}</div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span className="text-[14px] font-black tabular-nums text-indigo-600 dark:text-indigo-400">P. {item.endPage}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${idx % 3 === 0 ? 'bg-rose-100 text-rose-600' : idx % 3 === 1 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} dark:bg-opacity-20`}>
                        +{item.pagesToReadToday}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <BookMarked className="w-8 h-8 text-slate-400" />
                        <p className="text-[13px] font-bold text-slate-400">Enter stats to build your path.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {schedule.length > 31 && (
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-indigo-50 dark:border-indigo-900/30">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Upcoming month mapped out above</p>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 text-center mt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Crafted by</p>
           <span className="text-[11px] font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-rose-500">Imran Khan</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
