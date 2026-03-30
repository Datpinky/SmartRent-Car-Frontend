import React, { useState, useMemo } from 'react';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PAGE_SIZE = 10;

const DataTable = ({ columns, data = [], searchable = true, searchPlaceholder = 'Tìm kiếm...', actions, emptyText = 'Không có dữ liệu' }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? row[col.accessor] : '';
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="bg-white rounded-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.07)] border border-[#f0f0f0] overflow-hidden">
      {(searchable || actions) && (
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 gap-3 flex-wrap">
          {searchable && (
            <div className="flex items-center gap-2 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg px-3 py-[7px] min-w-[240px] flex-1 max-w-[360px]">
              <FaSearch className="text-gray-400 text-[0.8rem] shrink-0" />
              <input
                value={search}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="border-none bg-transparent outline-none text-[0.85rem] text-gray-700 w-full"
              />
            </div>
          )}
          {actions && <div className="flex gap-2 items-center">{actions}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.accessor || col.key) : undefined}
                  className={`px-3.5 py-[11px] text-left text-[0.75rem] font-semibold text-gray-500 uppercase tracking-[0.04em] whitespace-nowrap border-b border-[#f0f0f0] ${col.sortable ? 'cursor-pointer select-none hover:text-primary' : ''}`}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                  {col.sortable && sortKey === (col.accessor || col.key) && (
                    <span className="text-primary">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-400 py-10 text-sm">
                  {emptyText}
                </td>
              </tr>
            ) : pageData.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="px-3.5 py-[11px] text-gray-700 align-middle"
                    style={col.align ? { textAlign: col.align } : {}}
                  >
                    {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-wrap gap-2.5">
        <span className="text-[0.8rem] text-gray-400">Hiển thị {pageData.length} / {sorted.length} kết quả</span>
        <div className="flex gap-1 items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="min-w-[30px] h-[30px] border-[1.5px] border-gray-200 bg-white rounded-[7px] flex items-center justify-center text-[0.8rem] text-gray-700 transition-all disabled:opacity-40 disabled:cursor-default hover:border-primary hover:text-primary"
          >
            <FaChevronLeft />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) => p === '...'
              ? <span key={i} className="text-gray-400 text-[0.85rem] px-0.5">…</span>
              : <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[30px] h-[30px] border-[1.5px] rounded-[7px] flex items-center justify-center text-[0.8rem] transition-all
                    ${page === p
                      ? 'bg-primary border-primary text-white font-semibold'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                    }`}
                >{p}</button>
            )}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="min-w-[30px] h-[30px] border-[1.5px] border-gray-200 bg-white rounded-[7px] flex items-center justify-center text-[0.8rem] text-gray-700 transition-all disabled:opacity-40 disabled:cursor-default hover:border-primary hover:text-primary"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
