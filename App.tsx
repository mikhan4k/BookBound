
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
  TrendingUp
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ReadingData, ScheduleItem } from './types';
import { getReadingAdvice } from './services/geminiService';

const STORAGE_KEY = 'bookbound_data';

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

  // Fetch AI reading advice when significant book details change
  useEffect(() => {
    if (!data.bookTitle || pagesLeft === 0) {
      setAdvice('');
      return;
    }

    const fetchAdvice = async () => {
      const tip = await getReadingAdvice(data.bookTitle, pagesLeft, data.pagesPerDay);
      if (tip) setAdvice(tip);
    };

    const timer = setTimeout(fetchAdvice, 1200);
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
      if (dayCount > 180) break; // Limit to 6 months
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

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-950 dark:via-black dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-500 selection:text-white pb-10">
      
      {/* Colourful Header */}
      <header className="sticky top-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-indigo-100 dark:border-indigo-900/50 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">BookBound</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[12px] font-bold text-indigo-600 dark:text-indigo-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(today, 'MMM d, yyyy')}</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-500">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Reading Dashboard</h2>
          </div>
          <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-white/60 dark:border-slate-700/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 
            Today: <span className="text-indigo-600 dark:text-indigo-400">{format(today, 'EEEE, MMM do')}</span>
          </div>
        </div>

        {/* AI insight widget */}
        {advice && (
          <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-md flex gap-4 items-start animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-gradient-to-br from-amber-400 to-rose-500 p-2.5 rounded-2xl shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">Gemini Reading Insight</h3>
              <p className="text-[15px] text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                "{advice}"
              </p>
            </div>
          </div>
        )}

        {/* Colourful Form and Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Inputs Section - Vibrant Gradient Borders */}
          <div className="md:col-span-5">
            <div className="relative p-[2px] rounded-3xl bg-gradient-to-tr from-indigo-400 via-purple-400 to-rose-400 shadow-xl shadow-indigo-100 dark:shadow-none">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[22px]">
                <h3 className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                  <Target className="w-3 h-3" /> Book Blueprint
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      name="bookTitle"
                      value={data.bookTitle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-400 focus:ring-0 text-[15px] font-semibold transition-all placeholder:text-slate-400"
                      placeholder="Title of your masterpiece..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Pages</label>
                      <input 
                        type="number" 
                        name="totalPages"
                        value={data.totalPages || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-purple-400 focus:ring-0 text-[15px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Current Page</label>
                      <input 
                        type="number" 
                        name="pagesRead"
                        value={data.pagesRead || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-rose-400 focus:ring-0 text-[15px] font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Deadline</label>
                      <input 
                        type="date" 
                        name="targetFinishDate"
                        value={data.targetFinishDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-amber-400 focus:ring-0 text-[13px] font-bold [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pages / Day</label>
                      <input 
                        type="number" 
                        name="pagesPerDay"
                        value={data.pagesPerDay || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-400 focus:ring-0 text-[15px] font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Section - Distinct Colour Themes */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Left Box */}
            <div className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 shadow-lg shadow-rose-100/50 dark:shadow-none transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                <BookMarked className="w-12 h-12 text-rose-500" />
              </div>
              <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Left</span>
              <div className="text-4xl font-black tabular-nums text-slate-800 dark:text-slate-100">{pagesLeft}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex-1 h-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-1000" style={{width: `${100 - completionPercent}%`}}></div>
                </div>
                <span className="text-[10px] font-bold text-rose-500 uppercase">Pages</span>
              </div>
            </div>

            {/* Pace Box */}
            <div className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30 shadow-lg shadow-amber-100/50 dark:shadow-none transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                <TrendingUp className="w-12 h-12 text-amber-500" strokeWidth={3}/>
              </div>
              <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Pace</span>
              <div className="text-4xl font-black tabular-nums text-slate-800 dark:text-slate-100">{data.pagesPerDay}</div>
              <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg inline-block">Daily Quest</div>
            </div>

            {/* Finish Box */}
            <div className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-lg shadow-indigo-100/50 dark:shadow-none transition-transform hover:-translate-y-1 col-span-2 sm:col-span-1">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                <CheckCircle2 className="w-12 h-12 text-indigo-500" />
              </div>
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Finish</span>
              <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 leading-tight break-words">
                {estimatedFinishDate === 'N/A' ? '--' : estimatedFinishDate}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Projected End</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-coloured Progress Tracker */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
             <h4 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mastery Status</h4>
             <span className="text-[14px] font-black text-indigo-600 dark:text-indigo-400">{completionPercent}%</span>
          </div>
          <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 relative overflow-hidden">
            <div 
              className="h-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${completionPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Simplified Schedule - Colourful Rows */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-50 dark:border-indigo-900/30 shadow-2xl shadow-indigo-100/30 dark:shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
            <h3 className="text-[14px] font-black text-white uppercase tracking-wider flex items-center gap-2">
               <Calendar className="w-4 h-4" /> Reading Roadmap
            </h3>
            <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full uppercase border border-white/30 backdrop-blur-sm">Starts Tomorrow</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Read</th>
                  <th className="px-6 py-3 text-right">Target Page</th>
                  <th className="px-6 py-3 text-right">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900/20">
                {schedule.length > 0 ? schedule.slice(0, 31).map((item, idx) => (
                  <tr key={idx} className={`transition-colors group ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/80 dark:hover:bg-indigo-900/20`}>
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.date}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[12px] font-black px-2 py-1 rounded-lg ${idx % 3 === 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : idx % 3 === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        +{item.pagesToReadToday}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300"></div>
                        <span className="text-[15px] font-black tabular-nums text-indigo-600 dark:text-indigo-400">P. {item.endPage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[13px] font-black tabular-nums text-slate-400 dark:text-slate-500">{item.percentComplete}%</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                           <BookOpen className="w-8 h-8" />
                        </div>
                        <p className="text-[15px] font-bold text-slate-400">Blueprint needed! Enter stats above.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {schedule.length > 31 && (
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-indigo-50 dark:border-indigo-900/30">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Viewing your upcoming 31-day saga</p>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-slate-100 dark:border-slate-800 mt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Designed with ❤️ by</p>
           <span className="text-[12px] font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-rose-500">Imran Khan</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase mt-4">© {new Date().getFullYear()} BookBound Mastery</p>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default App;
