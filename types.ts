
export interface ReadingData {
  bookTitle: string;
  totalPages: number;
  pagesRead: number;
  targetFinishDate: string;
  pagesPerDay: number;
}

export interface ScheduleItem {
  date: string;
  pagesToReadToday: number;
  startPage: number;
  endPage: number;
  cumulativePagesRead: number;
  percentComplete: number;
}
