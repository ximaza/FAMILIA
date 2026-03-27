import React from 'react';
import { TocItem } from '../hooks/useTableOfContents';

interface TableOfContentsProps {
  toc: TocItem[];
  title?: string;
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ toc, title = 'Índice de Contenidos', className = '' }) => {
  if (toc.length === 0) return null;

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl p-6 mb-12 shadow-sm max-w-lg mx-auto ${className}`}>
      <h4 className="text-lg font-bold text-slate-800 mb-4 font-serif border-b border-slate-200 pb-2">
        {title}
      </h4>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-slate-600 hover:text-turquoise-700 hover:underline transition-colors flex items-center gap-2 text-sm"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
