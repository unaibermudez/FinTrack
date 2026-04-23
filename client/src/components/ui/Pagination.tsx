import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}

export const Pagination = ({ page, pages, total, onPage }: PaginationProps) => {
  if (pages <= 1 && total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t ft-border">
      <span className="text-xs ft-text-3 tabular-nums">
        {total} result{total !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg ft-text-2 hover:ft-text hover:ft-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="text-xs ft-text-2 px-2 tabular-nums">
          {page} / {pages}
        </span>

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="h-7 w-7 flex items-center justify-center rounded-lg ft-text-2 hover:ft-text hover:ft-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
