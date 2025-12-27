
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
  Zap,
  Flame,
  Star,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { format, addDays, differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns';
import { ReadingData, ScheduleItem } from './types';

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
        const parsed = JSON.parse(savedData);
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return {
      bookTitle: '',
      totalPages: 0,
      pagesRead: 0,
      targetFinishDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      pagesPerDay: 10, // Default set to 10 as requested
      startsFromToday: true
    };
  });

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
  const pagesLeft = Math.max(0, data.totalPages - data.pagesRead);

  // Calculate schedule based on pages left and daily pace
  const schedule = useMemo(() => {
    const items: ScheduleItem[] = [];
    if (pagesLeft <= 0 || data.pagesPerDay <= 0 || data.totalPages <= 0) return items;

    let currentPagesRead = Number(data.pagesRead);
    const total = Number(data.totalPages);
    const pace = Number(data.pagesPerDay);
    
    let dayOffset = data.startsFromToday ? 0 : 1;
    let dayCount = 0;

    // Safety limit to prevent infinite loops
    while (currentPagesRead < total && dayCount < 365) {
      const date = addDays(today, dayOffset + dayCount);
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
    }

    return items;
  }, [data, pagesLeft, today]);

  const estimatedFinishDate = schedule.length > 0 
    ? schedule[schedule.length - 1].date 
    : 'N/A';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = checked;
    } else if (name === 'bookTitle' || name === 'targetFinishDate') {
      newValue = value;
    } else {
      newValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    }

    setData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Auto-calculate pace if deadline is changed or total pages change
      if (name === 'targetFinishDate' || name === 'totalPages' || name === 'pagesRead') {
        try {
          const deadline = parseISO(name === 'targetFinishDate' ? (newValue as string) : prev.targetFinishDate);
          const tPages = name === 'totalPages' ? (newValue as number) : prev.totalPages;
          const rPages = name === 'pagesRead' ? (newValue as number) : prev.pagesRead;
          const pLeft = Math.max(0, tPages - rPages);
          
          const daysToDeadline = differenceInDays(deadline, startOfDay(today)) + (prev.startsFromToday ? 1 : 0);
          
          if (daysToDeadline > 0 && pLeft > 0) {
            updated.pagesPerDay = Math.ceil(pLeft / daysToDeadline);
          }
        } catch (err) {
          console.warn("Could not calculate auto-pace", err);
        }
      }

      return updated;
    });
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const todaysTarget = schedule.find(item => item.date === format(today, 'MMM dd, EEE'));

  return (
    <div className="min-h-screen transition-all duration-500 bg-[#F8F9FF] dark:bg-[#09090B] text-[#1A1A1E] dark:text-[#F4F4F5] font-sans selection:bg-violet-500 selection:text-white pb-20">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-pink-400 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#09090B]/70 backdrop-blur-xl border-b border-violet-100 dark:border-violet-900/30 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-xl shadow-lg shadow-purple-500/20">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">BookBound</h1>
              <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 uppercase tracking-widest leading-none">Reading Planner</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 shadow-sm hover:scale-110 active:scale-95 transition-all text-amber-500 dark:text-indigo-400"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Date & Quick Focus Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  <span>Current Schedule</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  {format(today, 'EEEE, MMMM do')}
                </h2>
             </div>
             
             {/* Today's Reading Highlight */}
             <div className="bg-white dark:bg-[#18181B] border border-violet-100 dark:border-violet-900/30 rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Today's Reading Goal</p>
                    {todaysTarget ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{todaysTarget.pagesToReadToday}</span>
                        <span className="text-xl font-bold text-gray-500">pages</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">All caught up!</span>
                    )}
                  </div>
                  
                  {todaysTarget && (
                    <div className="flex items-center gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                       <div className="text-center">
                          <p className="text-[10px] font-black text-indigo-400 uppercase">Start</p>
                          <p className="text-xl font-black text-indigo-600 dark:text-indigo-300">{todaysTarget.startPage}</p>
                       </div>
                       <ArrowRight className="w-5 h-5 text-indigo-300" />
                       <div className="text-center">
                          <p className="text-[10px] font-black text-indigo-400 uppercase">Finish</p>
                          <p className="text-xl font-black text-indigo-600 dark:text-indigo-300">{todaysTarget.endPage}</p>
                       </div>
                    </div>
                  )}

                  <div className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                      Mark as Done
                    </button>
                  </div>
                </div>
             </div>
          </div>

          {/* Current Book Mini Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#18181B] dark:to-[#09090B] rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.3),transparent)]" />
            <div className="relative z-10">
              <BookMarked className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-2xl font-black tracking-tight leading-tight mb-1">{data.bookTitle || "No Title Set"}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Adventure</p>
            </div>
            
            <div className="relative z-10 pt-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black tabular-nums">{data.totalPages > 0 ? Math.round((data.pagesRead / data.totalPages) * 100) : 0}%</span>
                <span className="text-[10px] font-black text-gray-500 uppercase">{data.pagesRead} / {data.totalPages} pages</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${data.totalPages > 0 ? Math.min(100, (data.pagesRead / data.totalPages) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Input & Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Controls Card */}
          <div className="md:col-span-5">
            <div className="h-full bg-white dark:bg-[#18181B] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-500/5 overflow-hidden relative">
              <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-6 tracking-[0.2em] flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-indigo-500" /> Plan Adjustments
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Book Title</label>
                  <input 
                    type="text" 
                    name="bookTitle"
                    value={data.bookTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-[#18181B] transition-all text-[15px] font-bold outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700"
                    placeholder="E.g. The Great Gatsby"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Total Pages</label>
                    <input 
                      type="number" 
                      name="totalPages"
                      value={data.totalPages || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-purple-500 transition-all text-[15px] font-black outline-none tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Read So Far</label>
                    <input 
                      type="number" 
                      name="pagesRead"
                      value={data.pagesRead || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-emerald-500 transition-all text-[15px] font-black outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Target Deadline</label>
                    <input 
                      type="date" 
                      name="targetFinishDate"
                      value={data.targetFinishDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-pink-500 transition-all text-[14px] font-bold outline-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Daily Goal</label>
                    <input 
                      type="number" 
                      name="pagesPerDay"
                      value={data.pagesPerDay || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-orange-500 transition-all text-[15px] font-black outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="group flex items-center gap-3 p-3 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        name="startsFromToday"
                        checked={data.startsFromToday}
                        onChange={handleInputChange}
                        className="peer h-5 w-5 rounded-lg border-2 border-violet-300 dark:border-violet-700 appearance-none checked:bg-violet-500 checked:border-violet-500 transition-all cursor-pointer"
                      />
                      <CheckCircle2 className="absolute w-5 h-5 text-white scale-0 peer-checked:scale-75 transition-transform pointer-events-none" />
                    </div>
                    <span className="text-[13px] font-bold text-violet-700 dark:text-violet-300">Goal active from today</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-4">
            
            <div className="group bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-[2rem] shadow-lg shadow-rose-500/20 flex flex-col justify-between text-white overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="bg-white/20 p-2 rounded-xl w-fit">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="mt-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Remaining</span>
                <div className="text-5xl font-black tabular-nums tracking-tighter">{pagesLeft}</div>
                <div className="text-[11px] font-bold opacity-90 mt-1">pages until finish</div>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-orange-400 to-amber-500 p-6 rounded-[2rem] shadow-lg shadow-amber-500/20 flex flex-col justify-between text-white overflow-hidden relative">
              <div className="absolute bottom-[-20%] left-[-20%] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="bg-white/20 p-2 rounded-xl w-fit">
                <Flame className="w-5 h-5" />
              </div>
              <div className="mt-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Current Pace</span>
                <div className="text-5xl font-black tabular-nums tracking-tighter">{data.pagesPerDay}</div>
                <div className="text-[11px] font-bold opacity-90 mt-1">pages per day</div>
              </div>
            </div>

            <div className="col-span-2 group bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] shadow-lg shadow-emerald-500/20 flex flex-col justify-between text-white overflow-hidden relative">
              <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="bg-white/20 p-2 rounded-xl w-fit">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex items-end justify-between mt-8">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Projected Finish</span>
                  <div className="text-3xl font-black leading-tight mt-1">{estimatedFinishDate === 'N/A' ? '--' : estimatedFinishDate}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Days Left</span>
                  <div className="text-3xl font-black tabular-nums">{schedule.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Section */}
        <section className="bg-white dark:bg-[#18181B] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50/30 to-transparent dark:from-indigo-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Star className="w-6 h-6 text-indigo-500" /> Reading Roadmap
              </h3>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">A day-by-day guide to your reading goal</p>
            </div>
            <div className="hidden sm:block px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-[11px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-widest">
              Generated Automatically
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#09090B] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="pl-10 pr-4 py-5">Scheduled Date</th>
                  <th className="px-4 py-5">Daily Target</th>
                  <th className="px-4 py-5">Page Range</th>
                  <th className="px-4 py-5 text-right pr-10">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {schedule.length > 0 ? schedule.slice(0, 45).map((item, idx) => (
                  <tr key={idx} className={`group transition-all hover:bg-indigo-50/40 dark:hover:bg-indigo-900/5 ${item.date === format(today, 'MMM dd, EEE') ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                    <td className="pl-10 pr-4 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full transition-transform group-hover:scale-125 ${
                          item.date === format(today, 'MMM dd, EEE') 
                            ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]' 
                            : 'bg-indigo-200 dark:bg-indigo-800'
                        }`} />
                        <span className={`text-[15px] font-bold whitespace-nowrap ${item.date === format(today, 'MMM dd, EEE') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.date} {item.date === format(today, 'MMM dd, EEE') && <span className="ml-2 text-[10px] font-black uppercase text-orange-500">Today</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-xs font-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
                        +{item.pagesToReadToday}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-black tabular-nums text-gray-900 dark:text-white tracking-tight">
                          {item.startPage}
                        </span>
                        <div className="h-[2px] w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <span className="text-[15px] font-black tabular-nums text-indigo-600 dark:text-indigo-400 tracking-tight">
                          {item.endPage}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-right pr-10">
                       <div className="flex flex-col items-end">
                         <span className="text-[14px] font-black tabular-nums text-gray-500 dark:text-gray-400">{item.percentComplete}%</span>
                         <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${item.percentComplete}%` }} />
                         </div>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                        <div className="bg-indigo-100 dark:bg-indigo-950 p-6 rounded-full">
                           <BookOpen className="w-16 h-16 text-indigo-500" />
                        </div>
                        <p className="text-xl font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest">No Adventure Log Yet</p>
                        <p className="text-sm font-bold max-w-xs mx-auto text-gray-500">Fill in your book stats and a deadline to generate your custom reading roadmap!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {schedule.length > 45 && (
            <div className="px-8 py-5 bg-gray-50/50 dark:bg-[#09090B]/50 text-center border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Showing the next 45 days of your journey</p>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-10 opacity-20" />
        <p className="text-[12px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.6em] mb-3">Master Your Reading</p>
        <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">© {new Date().getFullYear()} BookBound Planner • Smart Scheduling</p>
      </footer>
    </div>
  );
};

export default App;
