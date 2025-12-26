
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
  LayoutDashboard
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
        // Migration: Ensure startsFromToday exists
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
    
    // Start counting from 0 if startsFromToday is true, otherwise start from 1 (tomorrow)
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
      if (dayCount > 180) break; // Limit to 6 months
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
    <div className="min-h-screen transition-colors duration-300 bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans selection:bg-blue-500 selection:text-white pb-6">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border-b border-[#C6C6C8] dark:border-[#38383A] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-1 rounded-lg">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">BookBound</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[12px] font-semibold text-[#8E8E93]">
              <Calendar className="w-3 h-3" />
              <span>{format(today, 'MMM d, yyyy')}</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="p-1.5 rounded-full hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        
        {/* Title and Date Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold">Planner</h2>
          </div>
          <div className="text-[12px] font-medium text-[#8E8E93] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Today: {format(today, 'EEEE, MMM do')}
          </div>
        </div>

        {/* Form and Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Inputs Section */}
          <div className="md:col-span-5 space-y-3">
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm">
              <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase mb-3 tracking-widest">Book Stats</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <input 
                    type="text" 
                    name="bookTitle"
                    value={data.bookTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-1 focus:ring-blue-500 text-[14px]"
                    placeholder="Book Title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8E8E93] uppercase ml-1">Total Pages</label>
                    <input 
                      type="number" 
                      name="totalPages"
                      value={data.totalPages || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-1 focus:ring-blue-500 text-[14px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8E8E93] uppercase ml-1">Pages Read</label>
                    <input 
                      type="number" 
                      name="pagesRead"
                      value={data.pagesRead || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-1 focus:ring-blue-500 text-[14px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8E8E93] uppercase ml-1">Target End Date</label>
                    <input 
                      type="date" 
                      name="targetFinishDate"
                      value={data.targetFinishDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-1 focus:ring-blue-500 text-[13px] [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8E8E93] uppercase ml-1">Daily Goal</label>
                    <input 
                      type="number" 
                      name="pagesPerDay"
                      value={data.pagesPerDay || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none focus:ring-1 focus:ring-blue-500 text-[14px]"
                    />
                  </div>
                </div>
                {/* Starts from today checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="startsFromToday"
                    name="startsFromToday"
                    checked={data.startsFromToday}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded-md border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="startsFromToday" className="text-[12px] font-medium text-[#48484A] dark:text-[#AEAEB2] cursor-pointer select-none">
                    Start reading schedule from today
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-2xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Left</span>
              <div className="text-2xl font-black tabular-nums">{pagesLeft}</div>
              <span className="text-[10px] text-[#8E8E93]">pages</span>
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-2xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Pace</span>
              <div className="text-2xl font-black tabular-nums">{data.pagesPerDay}</div>
              <span className="text-[10px] text-[#8E8E93]">daily</span>
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-2xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm flex flex-col justify-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase">End Date</span>
              <div className="text-[14px] font-bold leading-none mt-1">{estimatedFinishDate === 'N/A' ? '--' : estimatedFinishDate}</div>
              <span className="text-[10px] text-blue-500 font-semibold uppercase mt-1">Projected</span>
            </div>
          </div>
        </div>

        {/* Simple Schedule Table */}
        <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#C6C6C8] dark:border-[#38383A] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#C6C6C8] dark:border-[#38383A] bg-[#FAFAFA] dark:bg-[#242426] flex items-center justify-between">
            <h3 className="text-[13px] font-bold">Daily Reading Plan</h3>
            <span className="text-[11px] font-bold text-blue-500 uppercase">
              {data.startsFromToday ? 'Starts Today' : 'Starts Tomorrow'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2F2F7] dark:bg-[#1C1C1E] text-[11px] font-bold text-[#8E8E93] uppercase">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Goal</th>
                  <th className="px-4 py-2">Page Range</th>
                  <th className="px-4 py-2 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C6C6C8]/50 dark:divide-[#38383A]/50">
                {schedule.length > 0 ? schedule.slice(0, 31).map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-bold whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 text-[13px] tabular-nums font-medium">+{item.pagesToReadToday}</td>
                    <td className="px-4 py-3 text-[13px] tabular-nums font-semibold text-blue-500 whitespace-nowrap">
                      {item.startPage} — {item.endPage}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-right tabular-nums text-[#8E8E93]">{item.percentComplete}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[#8E8E93] text-[14px]">
                      Enter book stats to see your roadmap.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {schedule.length > 31 && (
            <div className="px-4 py-2 bg-[#FAFAFA] dark:bg-[#242426] text-center">
              <p className="text-[11px] font-semibold text-[#8E8E93]">Showing next 31 days</p>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">© {new Date().getFullYear()} BookBound Planner</p>
      </footer>
    </div>
  );
};

export default App;
