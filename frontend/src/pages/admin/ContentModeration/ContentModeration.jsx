import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import { FaCheck, FaTimes, FaStar, FaFlag, FaSpinner } from 'react-icons/fa';
import adminService from '../../../services/adminService';

const ContentModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.listReviews('all');
      setReviews(data);
    } catch {
      setError('Không thể tải danh sách đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    setActionLoading(id + '_approve');
    try {
      await adminService.approveReview(id);
      setReviews(prev => prev.map(r => String(r.id) === String(id) ? { ...r, status: 'approved' } : r));
    } catch {
      alert('Không thể duyệt đánh giá này. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm('Bạn có chắc muốn từ chối đánh giá này?')) return;
    setActionLoading(id + '_reject');
    try {
      await adminService.rejectReview(id);
      setReviews(prev => prev.map(r => String(r.id) === String(id) ? { ...r, status: 'rejected' } : r));
    } catch {
      alert('Không thể từ chối đánh giá này. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all'
    ? reviews
    : filter === 'reported'
    ? reviews.filter(r => r.reported)
    : reviews.filter(r => r.status === filter);

  const reportedCount = reviews.filter(r => r.reported).length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Kiểm duyệt nội dung</h1>
          <p className="page-subtitle">Xem xét và phê duyệt đánh giá, bình luận của người dùng</p>
        </div>
        {reportedCount > 0 && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
            {reportedCount} nội dung bị báo cáo
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'pending', 'reported', 'approved'].map(f => {
          const count = f === 'all' ? reviews.length
            : f === 'reported' ? reportedCount
            : reviews.filter(r => r.status === f).length;
          return (
            <button key={f} type="button" onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 50, border: '1.5px solid', borderColor: filter === f ? '#00b14f' : '#e5e7eb', background: filter === f ? '#00b14f' : '#fff', color: filter === f ? '#fff' : '#374151', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ duyệt' : f === 'reported' ? '⚠ Bị báo cáo' : 'Đã duyệt'}
              <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 50, padding: '0 6px', fontSize: '0.72rem' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: '#6b7280' }}>
          <FaSpinner aria-hidden="true" className="animate-spin" /> Đang tải đánh giá…
        </div>
      )}

      {error && !loading && (
        <div role="alert" style={{ padding: 24, textAlign: 'center', color: '#dc2626', background: '#fff', borderRadius: 14, marginBottom: 16 }}>
          {error}
          <button type="button" onClick={fetchReviews} style={{ marginLeft: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Thử lại</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => (
            <div key={String(r.id)} style={{ background: '#fff', borderRadius: 14, padding: 16, border: `1px solid ${r.reported ? '#fde68a' : '#f0f0f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {r.user?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{r.user}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>→ {r.vehicle}</span>
                    <div style={{ display: 'flex', gap: 2 }} aria-label={`${r.rating} sao`}>
                      {Array.from({ length: 5 }).map((_, i) => <FaStar key={i} aria-hidden="true" size={11} color={i < r.rating ? '#f59e0b' : '#e5e7eb'} />)}
                    </div>
                    <StatusBadge status={r.status} />
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r.date}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>"{r.comment}"</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  {r.reported && (
                    <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 50, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FaFlag size={10} aria-hidden="true" /> Bị báo cáo
                    </span>
                  )}
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn-success"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        onClick={() => approve(r.id)}
                        aria-label="Duyệt đánh giá"
                        disabled={!!actionLoading}
                      >
                        {actionLoading === r.id + '_approve' ? <FaSpinner aria-hidden="true" className="animate-spin" /> : <FaCheck aria-hidden="true" />}
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        onClick={() => reject(r.id)}
                        aria-label="Từ chối đánh giá"
                        disabled={!!actionLoading}
                      >
                        {actionLoading === r.id + '_reject' ? <FaSpinner aria-hidden="true" className="animate-spin" /> : <FaTimes aria-hidden="true" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', background: '#fff', borderRadius: 14 }}>
              Không có nội dung nào
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentModeration;
