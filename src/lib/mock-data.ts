export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: "available" | "checked-out" | "reserved" | "overdue";
  coverColor: string;
  publishYear: number;
  copies: number;
}

export interface Patron {
  name: string;
  avatar: string;
  action: string;
  book: string;
  time: string;
}

export const books: Book[] = [
  { id: "1", title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", isbn: "978-0-06-088328-7", category: "Fiction", status: "available", coverColor: "hsl(24 80% 30%)", publishYear: 1967, copies: 3 },
  { id: "2", title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0-553-38016-3", category: "Science", status: "checked-out", coverColor: "hsl(210 60% 50%)", publishYear: 1988, copies: 2 },
  { id: "3", title: "The Art of War", author: "Sun Tzu", isbn: "978-1-59030-225-9", category: "Philosophy", status: "available", coverColor: "hsl(0 72% 50%)", publishYear: -500, copies: 4 },
  { id: "4", title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0-06-231609-7", category: "History", status: "reserved", coverColor: "hsl(36 70% 55%)", publishYear: 2011, copies: 2 },
  { id: "5", title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0-7432-7356-5", category: "Fiction", status: "available", coverColor: "hsl(142 40% 35%)", publishYear: 1925, copies: 5 },
  { id: "6", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0-374-53355-7", category: "Psychology", status: "overdue", coverColor: "hsl(280 50% 45%)", publishYear: 2011, copies: 1 },
  { id: "7", title: "Dune", author: "Frank Herbert", isbn: "978-0-441-17271-9", category: "Sci-Fi", status: "available", coverColor: "hsl(36 90% 50%)", publishYear: 1965, copies: 3 },
  { id: "8", title: "1984", author: "George Orwell", isbn: "978-0-452-28423-4", category: "Fiction", status: "checked-out", coverColor: "hsl(24 15% 25%)", publishYear: 1949, copies: 4 },
];

export const recentActivity: Patron[] = [
  { name: "Elena Rodriguez", avatar: "ER", action: "Checked out", book: "Sapiens", time: "5 min ago" },
  { name: "James Chen", avatar: "JC", action: "Returned", book: "Dune", time: "12 min ago" },
  { name: "Priya Sharma", avatar: "PS", action: "Reserved", book: "1984", time: "28 min ago" },
  { name: "Marcus Johnson", avatar: "MJ", action: "Renewed", book: "A Brief History of Time", time: "1 hr ago" },
  { name: "Sofia Petrov", avatar: "SP", action: "Checked out", book: "The Great Gatsby", time: "2 hr ago" },
];

export const stats = {
  totalBooks: 12847,
  checkedOut: 1432,
  activePatrons: 3219,
  overdueItems: 87,
};

export const categories = ["All", "Fiction", "Science", "Philosophy", "History", "Psychology", "Sci-Fi"];
