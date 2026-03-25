import { useState, useEffect } from 'react';

export interface TocItem {
  id: string;
  text: string;
}

export const useTableOfContents = (contentDependency: any, selector: string = 'h3.toc-target') => {
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    // A small delay to ensure DOM is updated after React render
    const timeoutId = setTimeout(() => {
      const headings = Array.from(document.querySelectorAll(selector));

      const tocItems: TocItem[] = [];

      headings.forEach((heading) => {
        const text = heading.textContent;
        if (text) {
          const id = text
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with -
            .replace(/(^-|-$)+/g, ''); // remove leading/trailing -

          heading.id = id;
          tocItems.push({ id, text });
        }
      });

      setToc(tocItems);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [contentDependency, selector]);

  return toc;
};
