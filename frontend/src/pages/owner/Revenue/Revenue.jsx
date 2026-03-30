import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaMoneyBillWave, FaDownload, FaPaperPlane } from 'react-icons/fa';
import { MOCK_OWNER_REVENUE } from '../../../components/data/mockDashboard';

const PAYOUT_HISTORY = [
  { id: 'PT001', month: 'T2/2026', amount: 5220000, method: 'Vietcombank ****1234', date: '05/03/2026', status: 'paid' },
  { id: 'PT002', month: 'T1/2026', amount: 5490000, method: 'Vietcombank ****1234', date: '05/02/2026', status: 'paid' },
  { id: 'PT003', month: 'T12/2025', amount: 6480000, method: 'Vietcombank ****1234', date: '05/01/2026', status: 'paid' },
  { id: 'PT004', month: 'T3/2026', amount: 1980000, method: 'Vietcombank ****1234', date: 'Chờ xử lý', status: 'processing' },
];

const Revenue = () => {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('Vietcombank');
  const [accountNo, setAccountNo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalRevenue = MOCK_OWNER_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalPayout  = MOCK_OWNER_REVENUE.reduce((s, m) => s + m.payouts, 0);
  const pending = 2200000;

  const handleWithdraw = () => { setSubmitted(true); setTimeout(() => { setWithdrawModal(false); setSubmitted(false); }, 1500); };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Doanh thu & Rút tiền</h1>
          <p className="page-subtitle">Theo dõi dòng tiền và yêu cầu rút tiền về tài khoản</p>
        </div>
        <button className="btn-primary" onClick={() => setWithdrawModal(true)}><FaMoneyBillWave /> Yêu cầu rút tiền</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Tổng doanh thu', val: (totalRevenue / 1000000).toFixed(1) + 'M', color: '#0891b2', sub: '7 tháng gần nhất' },
          { label: 'Đã nhận', val: (totalPayout / 1000000).toFixed(1) + 'M', color: '#059669', sub: '90% tỷ lệ chi trả' },
          { label: 'Đang chờ rút', val: (pending / 1000).toLocaleString() + 'K', color: '#d97706', sub: 'Tháng 3/2026' },
          { label: 'Tỷ lệ chia sẻ', val: '90%', color: '#7c3aed', sub: 'Chủ xe / SmartRent' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{k.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-header"><div className="chart-title">Doanh thu & Chi trả (VND)</div></div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MOCK_OWNER_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
            <Tooltip formatter={(v, n) => [(v / 1000).toLocaleString() + 'K', n]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
            <Bar dataKey="revenue" name="Doanh thu"  fill="#0891b2" radius={[4,4,0,0]} />
            <Bar dataKey="payouts" name="Đã chi trả" fill="#00b14f" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payout history */}
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Lịch sử chi trả</div>
          <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}><FaDownload /> Xuất CSV</button>
        </div>
        <table className="simple-table">
          <thead><tr><th>Mã GD</th><th>Tháng</th><th>Số tiền</th><th>Tài khoản</th><th>Ngày chi trả</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {PAYOUT_HISTORY.map(p => (
              <tr key={p.id}>
                <td><span className="code-badge">{p.id}</span></td>
                <td style={{ fontWeight: 600 }}>{p.month}</td>
                <td style={{ fontWeight: 700, color: '#00b14f' }}>{p.amount.toLocaleString()}đ</td>
                <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.method}</td>
                <td>{p.date}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModal} onClose={() => setWithdrawModal(false)} title="Yêu cầu rút tiền" width={460}
        footer={submitted ? null : <><button className="btn-outline" onClick={() => setWithdrawModal(false)}>Hủy</button><button className="btn-primary" onClick={handleWithdraw}><FaPaperPlane /> Gửi yêu cầu</button></>}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Yêu cầu đã được gửi!</div>
            <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>Tiền sẽ được chuyển trong 1-3 ngày làm việc.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Số dư có thể rút</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00b14f' }}>{(pending / 1000).toLocaleString()}K VND</div>
            </div>
            {[['Số tiền rút (đ)', 'amount'], ['Số tài khoản', 'accountNo']].map(([label, key]) => (
              <div key={key}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                <input value={key === 'amount' ? amount : accountNo} onChange={e => key === 'amount' ? setAmount(e.target.value) : setAccountNo(e.target.value)}
                  placeholder={key === 'amount' ? '0' : 'VD: 0123456789'}
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ngân hàng</label>
              <select value={bank} onChange={e => setBank(e.target.value)} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {['Vietcombank','VietinBank','Agribank','BIDV','Techcombank','MB Bank','VPBank'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Revenue;
