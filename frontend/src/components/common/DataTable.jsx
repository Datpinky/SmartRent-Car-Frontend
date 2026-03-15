import React, { useState, useMemo } from 'react';
import './DataTable.css';
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
    <div className="data-table-wrap">
      {(searchable || actions) && (
        <div className="data-table-toolbar">
          {searchable && (
            <div className="dt-search">
              <FaSearch className="dt-search-icon" />
              <input value={search} onChange={handleSearch} placeholder={searchPlaceholder} />
            </div>
          )}
          {actions && <div className="dt-actions">{actions}</div>}
        </div>
      )}
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={col.sortable ? () => handleSort(col.accessor || col.key) : undefined}
                  className={col.sortable ? 'sortable' : ''} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                  {col.sortable && sortKey === (col.accessor || col.key) && (
                    <span className="sort-indicator">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={columns.length} className="dt-empty">{emptyText}</td></tr>
            ) : pageData.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map(col => (
                  <td key={col.key} style={col.align ? { textAlign: col.align } : {}}>
                    {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dt-footer">
        <span className="dt-count">Hiển thị {pageData.length} / {sorted.length} kết quả</span>
        <div className="dt-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FaChevronLeft /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) => p === '...'
              ? <span key={i} className="dt-dots">…</span>
              : <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            )}
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><FaChevronRight /></button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
