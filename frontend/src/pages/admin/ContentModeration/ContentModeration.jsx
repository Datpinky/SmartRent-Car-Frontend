import React, { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import { FaCheck, FaTimes, FaStar, FaFlag } from 'react-icons/fa';

const MOCK_REVIEWS = [
  { id: 1, user: 'Nguyễn Văn An', vehicle: 'Toyota Camry 2.5Q', rating: 5, comment: 'Xe rất sạch và mới, showroom phục vụ tận tình. Sẽ thuê lại lần sau!', status: 'pending', date: '10/03/2026', reported: false },
  { id: 2, user: 'Trần Thị Bình', vehicle: 'Honda CR-V L 2023', rating: 2, comment: 'Xe có mùi hôi, điều hòa không lạnh. Rất thất vọng với dịch vụ này!!!', status: 'pending', date: '09/03/2026', reported: true },
  { id: 3, user: 'Hoàng Văn Em',  vehicle: 'VinFast VF8 Eco',   rating: 4, comment: 'Xe điện rất êm và tiết kiệm. Showroom giao xe đúng giờ.', status: 'approved', date: '08/03/2026', reported: false },
  { id: 4, user: 'Đinh Văn Inh',  vehicle: 'Honda CR-V L 2023', rating: 1, comment: 'Nội thất bẩn, có vết xước chưa được thông báo trước. Tệ!!!', status: 'pending', date: '07/03/2026', reported: true },
  { id: 5, user: 'Vũ Thị Phương', vehicle: 'Hyundai Tucson', rating: 5, comment: 'Dịch vụ xuất sắc, xe đẹp, giao nhận rất chuyên nghiệp.', status: 'approved', date: '06/03/2026', reported: false },
];

const ContentModeration = () => {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [filter, setFilter] = useState('all');

  const approve = (id) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  const remove  = (id) => {
    if (!window.confirm('Bạn có chắc muốn từ chối nội dung này?')) return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const filtered = filter === 'all' ? reviews : filter === 'reported' ? reviews.filter(r => r.reported) : reviews.filter(r => r.status === filter);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Kiểm duyệt nội dung</h1>
          <p className="page-subtitle">Xem xét và phê duyệt đánh giá, bình luận của người dùng</p>
        </div>
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
          {reviews.filter(r => r.reported).length} nội dung bị báo cáo
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'reported', 'approved'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 50, border: '1.5px solid', borderColor: filter === f ? '#00b14f' : '#e5e7eb', background: filter === f ? '#00b14f' : '#fff', color: filter === f ? '#fff' : '#374151', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ duyệt' : f === 'reported' ? '⚠ Bị báo cáo' : 'Đã duyệt'}
            <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 50, padding: '0 6px', fontSize: '0.72rem' }}>
              {f === 'all' ? reviews.length : f === 'reported' ? reviews.filter(r => r.reported).length : reviews.filter(r => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: `1px solid ${r.reported ? '#fde68a' : '#f0f0f0'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                {r.user[0]}
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
                    <FaFlag size={10} /> Bị báo cáo
                  </span>
                )}
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => approve(r.id)} title="Duyệt" aria-label="Duyệt nội dung"><FaCheck /></button>
                    <button type="button" className="btn-danger"  style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => remove(r.id)} title="Từ chối" aria-label="Từ chối nội dung"><FaTimes /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', background: '#fff', borderRadius: 14 }}>Không có nội dung nào</div>
        )}
      </div>
    </div>
  );
};

export default ContentModeration;
