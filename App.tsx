
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Sun, 
  Moon, 
  Target,
  ChevronRight,
  BookMarked,
  LayoutDashboard
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ReadingData, ScheduleItem } from './types';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [data, setData] = useState<ReadingData>({
    bookTitle: '',
    totalPages: 0,
    pagesRead: 0,
    targetFinishDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    pagesPerDay: 20
  });

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

    let currentPagesRead = data.pagesRead;
    let dayCount = 1;

    while (currentPagesRead < data.totalPages) {
      const date = addDays(today, dayCount);
      const remainingForTarget = data.totalPages - currentPagesRead;
      const readToday = Math.min(data.pagesPerDay, remainingForTarget);
      
      const startPage = currentPagesRead + 1;
      const endPage = currentPagesRead + readToday;
      
      currentPagesRead += readToday;
      
      items.push({
        date: format(date, 'EEEE, MMM d'),
        pagesToReadToday: readToday,
        startPage,
        endPage,
        cumulativePagesRead: currentPagesRead,
        percentComplete: Math.round((currentPagesRead / data.totalPages) * 100)
      });

      dayCount++;
      if (dayCount > 365) break; // Limit to 1 year for performance
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
    <div className="min-h-screen transition-colors duration-500 bg-[#F2F2F7] dark:bg-black text-black dark:text-white font-sans selection:bg-blue-500 selection:text-white pb-12">
      {/* iOS Style Glass Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl border-b border-[#C6C6C8] dark:border-[#38383A] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-1.5 rounded-lg shadow-sm">
              <BookOpen className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">BookBound</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[13px] font-semibold text-[#8E8E93]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(today, 'MMM d, yyyy')}</span>
            </div>
            
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-6 h-6 text-blue-500" />
          <h2 className="text-3xl font-extrabold tracking-tight">Reading Dashboard</h2>
        </div>

        {/* Dashboard Top Row */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Planner Configuration - iOS Inset Group Style */}
          <div className="xl:col-span-5 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-[#C6C6C8] dark:border-[#38383A] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#C6C6C8] dark:border-[#38383A] bg-[#FAFAFA] dark:bg-[#242426]">
              <h3 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Book Configuration</h3>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#8E8E93] ml-1 uppercase">Title</label>
                  <input 
                    type="text" 
                    name="bookTitle"
                    value={data.bookTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-2 focus:ring-blue-500 transition-all text-[15px] placeholder:text-[#AEAeb2]"
                    placeholder="Enter book title..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#8E8E93] ml-1 uppercase">Total Pages</label>
                    <input 
                      type="number" 
                      name="totalPages"
                      value={data.totalPages === 0 ? '' : data.totalPages}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-2 focus:ring-blue-500 transition-all text-[15px]"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#8E8E93] ml-1 uppercase">Pages Read</label>
                    <input 
                      type="number" 
                      name="pagesRead"
                      value={data.pagesRead === 0 ? '' : data.pagesRead}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-2 focus:ring-blue-500 transition-all text-[15px]"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#8E8E93] ml-1 uppercase">Target Date</label>
                    <input 
                      type="date" 
                      name="targetFinishDate"
                      value={data.targetFinishDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-2 focus:ring-blue-500 transition-all text-[15px] [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#8E8E93] ml-1 uppercase">Daily Pace</label>
                    <input 
                      type="number" 
                      name="pagesPerDay"
                      value={data.pagesPerDay === 0 ? '' : data.pagesPerDay}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-2 focus:ring-blue-500 transition-all text-[15px]"
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Column - iOS Widgets Style */}
          <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm flex flex-col justify-between aspect-square md:aspect-auto xl:aspect-square">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-500 p-2 rounded-xl">
                    <BookMarked className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-tighter">Remaining</span>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-bold tabular-nums tracking-tighter">{pagesLeft}</div>
                  <div className="text-[13px] font-medium text-[#8E8E93]">pages left</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${data.totalPages > 0 ? Math.min(100, (data.pagesRead / data.totalPages) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm flex flex-col justify-between aspect-square md:aspect-auto xl:aspect-square">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 p-2 rounded-xl">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-tighter">Deadline</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold leading-tight tracking-tight min-h-[3rem] flex items-center">
                    {estimatedFinishDate === 'N/A' ? '--' : estimatedFinishDate}
                  </div>
                  <div className="text-[13px] font-medium text-[#8E8E93]">Estimated end</div>
                </div>
              </div>
              <div className="mt-4 text-[11px] font-bold text-blue-500 uppercase tracking-wide">
                @{data.pagesPerDay || 0} pgs/day
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm flex flex-col justify-between aspect-square md:aspect-auto xl:aspect-square">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500 p-2 rounded-xl">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-tighter">Status</span>
                </div>
                <div className="min-h-[3rem] flex flex-col justify-center">
                  {data.totalPages > 0 && pagesLeft <= 0 ? (
                    <div className="text-xl font-bold text-green-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Completed
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl font-bold tabular-nums tracking-tighter">
                        {data.pagesPerDay > 0 ? Math.ceil(pagesLeft / data.pagesPerDay) : '--'}
                      </div>
                      <div className="text-[13px] font-medium text-[#8E8E93]">days to go</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold py-1 px-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg uppercase">On Track</span>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule List - iOS Grouped List Style */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold tracking-tight">Reading Roadmap</h3>
            <span className="text-[13px] font-semibold text-blue-500">Starting Tomorrow</span>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm divide-y divide-[#C6C6C8]/50 dark:divide-[#38383A]/50 overflow-hidden">
            {schedule.length > 0 ? schedule.slice(0, 31).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-bold text-black dark:text-white leading-none">{item.date}</p>
                    <p className="text-[13px] font-medium text-[#8E8E93]">Pages {item.startPage} — {item.endPage}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-[13px] font-bold text-black dark:text-white">{item.cumulativePagesRead} / {data.totalPages}</p>
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase">Progress</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 min-w-[60px]">
                    <span className="text-[13px] font-black text-blue-500 tabular-nums">{item.percentComplete}%</span>
                    <div className="w-12 h-1 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${item.percentComplete}%` }}
                      ></div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C6C6C8] dark:text-[#38383A]" />
                </div>
              </div>
            )) : (
              <div className="p-16 text-center space-y-4">
                <div className="inline-flex items-center justify-center p-5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full">
                  <Target className="w-10 h-10 text-[#C6C6C8] dark:text-[#48484A]" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold">Plan Your Journey</p>
                  <p className="text-[15px] text-[#8E8E93]">Enter your book details above to generate a roadmap.</p>
                </div>
              </div>
            )}
            {schedule.length > 31 && (
              <div className="p-4 text-center bg-[#FAFAFA] dark:bg-[#242426]">
                <p className="text-[13px] font-semibold text-[#8E8E93]">Showing your first month of reading.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-center border-t border-[#C6C6C8] dark:border-[#38383A] mt-8">
        <p className="text-[13px] font-medium text-[#8E8E93]">BookBound: Your Companion for Reading Mastery</p>
      </footer>
    </div>
  );
};

export default App;
