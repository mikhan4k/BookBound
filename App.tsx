
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
  Trophy
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ReadingData, ScheduleItem } from './types';

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
        const parsed = JSON.parse(savedData);
        if (parsed.startsFromToday === undefined) parsed.startsFromToday = false;
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return {
      bookTitle: '',
      totalPages: 0,
      pagesRead: 0,
      targetFinishDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      pagesPerDay: 20,
      startsFromToday: false
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

  const schedule = useMemo(() => {
    const items: ScheduleItem[] = [];
    if (pagesLeft <= 0 || data.pagesPerDay <= 0) return items;

    let currentPagesRead = Number(data.pagesRead);
    const total = Number(data.totalPages);
    const pace = Number(data.pagesPerDay);
    
    let dayOffset = data.startsFromToday ? 0 : 1;
    let dayCount = 0;

    while (currentPagesRead < total) {
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
      if (dayCount > 180) break;
    }

    return items;
  }, [data, pagesLeft, today]);

  const estimatedFinishDate = schedule.length > 0 
    ? schedule[schedule.length - 1].date 
    : 'N/A';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let newValue: string | number | boolean = value;
    
    if (type === 'checkbox') {
      newValue = checked;
    } else if (name !== 'bookTitle' && name !== 'targetFinishDate') {
      newValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    }
    
    setData(prev => ({ ...prev, [name]: newValue }));
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen transition-all duration-500 bg-[#F8F9FF] dark:bg-[#09090B] text-[#1A1A1E] dark:text-[#F4F4F5] font-sans selection:bg-violet-500 selection:text-white pb-10">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-pink-400 rounded-full blur-[100px]" />
      </div>

      {/* Vibrant Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#09090B]/70 backdrop-blur-xl border-b border-violet-100 dark:border-violet-900/30 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-[12px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(today, 'MMM d, yyyy')}</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 shadow-sm hover:scale-110 active:scale-95 transition-all text-amber-500 dark:text-indigo-400"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Dynamic Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </h2>
            </div>
            <h3 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              {data.bookTitle || "Your Current Read"}
            </h3>
          </div>
          <div className="text-[13px] font-bold px-3 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-4 h-4" /> {format(today, 'EEEE, MMM do')}
          </div>
        </div>

        {/* Input & Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Controls Card */}
          <div className="md:col-span-5">
            <div className="h-full bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-500/5 overflow-hidden relative">
              {/* Subtle Gradient Decor */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-indigo-500" /> Goal Settings
              </h3>
              
              <div className="space-y-5">
                <div className="relative">
                  <input 
                    type="text" 
                    name="bookTitle"
                    value={data.bookTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-[#18181B] transition-all text-[15px] font-semibold outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    placeholder="Book Title..."
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
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-purple-500 transition-all text-[15px] font-bold outline-none tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Read So Far</label>
                    <input 
                      type="number" 
                      name="pagesRead"
                      value={data.pagesRead || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-emerald-500 transition-all text-[15px] font-bold outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Deadline</label>
                    <input 
                      type="date" 
                      name="targetFinishDate"
                      value={data.targetFinishDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-pink-500 transition-all text-[14px] font-bold outline-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wide">Daily Pace</label>
                    <input 
                      type="number" 
                      name="pagesPerDay"
                      value={data.pagesPerDay || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#09090B] border-2 border-transparent focus:border-orange-500 transition-all text-[15px] font-bold outline-none tabular-nums"
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
                    <span className="text-[13px] font-bold text-violet-700 dark:text-violet-300">Start from today</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            <div className="group bg-gradient-to-br from-rose-500 to-pink-600 p-5 rounded-3xl shadow-lg shadow-rose-500/20 flex flex-col justify-between text-white overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="bg-white/20 p-2 rounded-xl w-fit">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Remaining</span>
                <div className="text-4xl font-black tabular-nums tracking-tighter">{pagesLeft}</div>
                <div className="text-[11px] font-bold opacity-90 mt-1">pages to go</div>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-orange-400 to-amber-500 p-5 rounded-3xl shadow-lg shadow-amber-500/20 flex flex-col justify-between text-white overflow-hidden relative">
              <div className="absolute bottom-[-20%] left-[-20%] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="bg-white/20 p-2 rounded-xl w-fit">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Daily Pace</span>
                <div className="text-4xl font-black tabular-nums tracking-tighter">{data.pagesPerDay}</div>
                <div className="text-[11px] font-bold opacity-90 mt-1">pages / day</div>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-3xl shadow-lg shadow-emerald-500/20 flex flex-col justify-between text-white overflow-hidden relative col-span-2 sm:col-span-1">
              <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="bg-white/20 p-2 rounded-xl w-fit">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Finish Date</span>
                <div className="text-xl font-black leading-tight mt-1">{estimatedFinishDate === 'N/A' ? '--' : estimatedFinishDate}</div>
                <div className="text-[11px] font-bold opacity-90 mt-1">Projected end</div>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="col-span-2 sm:col-span-3 bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-500/5">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" /> Progress Status
                  </h4>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {data.totalPages > 0 ? Math.round((data.pagesRead / data.totalPages) * 100) : 0}%
                  </span>
               </div>
               <div className="w-full h-4 bg-gray-100 dark:bg-[#09090B] rounded-full overflow-hidden border border-gray-200 dark:border-gray-800">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    style={{ width: `${data.totalPages > 0 ? Math.min(100, (data.pagesRead / data.totalPages) * 100) : 0}%` }}
                  />
               </div>
               <div className="flex justify-between mt-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  <span>Page {data.pagesRead}</span>
                  <span>Target {data.totalPages}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Colourful Schedule Section */}
        <section className="bg-white dark:bg-[#18181B] rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-500" /> Roadmap
              </h3>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Next 31 days of your reading adventure</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 shadow-sm transition-all ${
              data.startsFromToday 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-400' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/10 dark:border-indigo-900/30 dark:text-indigo-400'
            }`}>
              {data.startsFromToday ? 'Active: Today' : 'Scheduled: Tomorrow'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#09090B] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="pl-8 pr-4 py-4">Date</th>
                  <th className="px-4 py-4">Daily Goal</th>
                  <th className="px-4 py-4">Page Range</th>
                  <th className="px-4 py-4 text-right pr-8">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {schedule.length > 0 ? schedule.slice(0, 31).map((item, idx) => (
                  <tr key={idx} className="group hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all">
                    <td className="pl-8 pr-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full transition-transform group-hover:scale-150 ${
                          idx === 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-indigo-300 dark:bg-indigo-800'
                        }`} />
                        <span className="text-[14px] font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[11px] font-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
                        +{item.pagesToReadToday}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-black tabular-nums text-indigo-600 dark:text-indigo-400 tracking-tight">
                          {item.startPage}
                        </span>
                        <div className="h-[2px] w-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <span className="text-[14px] font-black tabular-nums text-purple-600 dark:text-purple-400 tracking-tight">
                          {item.endPage}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right pr-8">
                       <div className="flex flex-col items-end">
                         <span className="text-[13px] font-black tabular-nums text-gray-400 dark:text-gray-600">{item.percentComplete}%</span>
                         <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${item.percentComplete}%` }} />
                         </div>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30 grayscale">
                        <div className="bg-indigo-100 p-4 rounded-full">
                           <BookOpen className="w-12 h-12 text-indigo-500" />
                        </div>
                        <p className="text-lg font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest">No Adventure Log Yet</p>
                        <p className="text-sm font-bold max-w-xs mx-auto">Fill in your book stats to generate your custom reading roadmap!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {schedule.length > 31 && (
            <div className="px-8 py-4 bg-gray-50/50 dark:bg-[#09090B]/50 text-center border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Showing the next 31 chapters of your journey</p>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-10 max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-8 opacity-30" />
        <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.5em] mb-2">Developed with Passion</p>
        <p className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">© {new Date().getFullYear()} BookBound Planner</p>
      </footer>
    </div>
  );
};

export default App;
