import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import StatusBadge from '../../../components/common/StatusBadge';
import {
  FaMoneyBillWave, FaDownload, FaCar, FaSpinner,
  FaFileContract, FaRobot, FaInfoCircle, FaUniversity,
  FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Divider, Chip, Snackbar, Alert,
  TextField, Select, FormControl, InputLabel, MenuItem,
  CircularProgress,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  MOCK_OWNER_VEHICLES,
  MOCK_REVENUE_BY_VEHICLE,
  MOCK_STATS_BY_VEHICLE,
} from '../../../components/data/mockDashboard';

/* ── Helpers ─────────────────────────────────────────────── */
const fmtM = (n) => (n / 1_000_000).toFixed(1) + 'M';
const fmtVN = (n) => n.toLocaleString('vi-VN') + 'đ';
const genId = () => 'PT' + String(Date.now()).slice(-5);

/* ── Mock bank accounts (từ hồ sơ chủ xe — thay bằng API thực) ── */
const MOCK_BANK_ACCOUNTS = [
  { id: 'ba1', bankName: 'Vietcombank', accountNo: '0012345678910', accountName: 'NGUYEN VAN KHOA', primary: true },
  { id: 'ba2', bankName: 'Techcombank', accountNo: '19034567891', accountName: 'NGUYEN VAN KHOA', primary: false },
  { id: 'ba3', bankName: 'MB Bank', accountNo: '07712345678', accountName: 'NGUYEN VAN KHOA', primary: false },
];

/* ── Static payout history (mock) ───────────────────────── */
const INITIAL_PAYOUTS = [
  {
    id: 'PT001', month: 'T2/2026', amount: 5220000,
    method: 'Vietcombank ****8910', date: '05/03/2026', status: 'paid',
    detail: {
      rentalId: 'BK-2026-02-001', vehicle: 'Honda CR-V L 2023 – 51H-23456',
      renter: 'Nguyễn Văn An', period: '01/02/2026 → 28/02/2026',
      gross: 5800000, platformFee: 580000, damagePenalty: 0, net: 5220000,
      aiDamages: [],
    },
    contractUrl: 'https://smartrent.vn/contracts/HD-2026-02-001',
    aiReportUrl: 'https://smartrent.vn/ai-reports/AI-RPT-2026-02-001',
  },
  {
    id: 'PT002', month: 'T1/2026', amount: 5490000,
    method: 'Vietcombank ****8910', date: '05/02/2026', status: 'paid',
    detail: {
      rentalId: 'BK-2026-01-003', vehicle: 'Honda CR-V L 2023 – 51H-23456',
      renter: 'Trần Thị Bình', period: '01/01/2026 → 31/01/2026',
      gross: 6100000, platformFee: 610000, damagePenalty: 0, net: 5490000,
      aiDamages: [],
    },
    contractUrl: 'https://smartrent.vn/contracts/HD-2026-01-003',
    aiReportUrl: 'https://smartrent.vn/ai-reports/AI-RPT-2026-01-003',
  },
  {
    id: 'PT003', month: 'T12/2025', amount: 6480000,
    method: 'Vietcombank ****8910', date: '05/01/2026', status: 'paid',
    detail: {
      rentalId: 'BK-2025-12-007', vehicle: 'Honda CR-V L 2023 – 51H-23456',
      renter: 'Lê Minh Cường', period: '01/12/2025 → 31/12/2025',
      gross: 8000000, platformFee: 800000, damagePenalty: 720000, net: 6480000,
      aiDamages: [
        { item: 'Trầy xước cản sau', severity: 'Nhẹ', cost: 350000 },
        { item: 'Vết lõm cánh cửa sau trái', severity: 'Trung bình', cost: 370000 },
      ],
    },
    contractUrl: 'https://smartrent.vn/contracts/HD-2025-12-007',
    aiReportUrl: 'https://smartrent.vn/ai-reports/AI-RPT-2025-12-007',
  },
  {
    id: 'PT004', month: 'T3/2026', amount: 1980000,
    method: 'Vietcombank ****8910', date: 'Chờ xử lý', status: 'processing',
    detail: {
      rentalId: 'BK-2026-03-002', vehicle: 'Honda CR-V L 2023 – 51H-23456',
      renter: 'Phạm Văn Đức', period: '01/03/2026 → 15/03/2026',
      gross: 2200000, platformFee: 220000, damagePenalty: 0, net: 1980000,
      aiDamages: [],
    },
    contractUrl: 'https://smartrent.vn/contracts/HD-2026-03-002',
    aiReportUrl: 'https://smartrent.vn/ai-reports/AI-RPT-2026-03-002',
  },
];

/* ── Simulated API calls ─────────────────────────────────── */
const fetchVehicles = () => new Promise(r => setTimeout(() => r(MOCK_OWNER_VEHICLES), 600));
const fetchStats = (k) => new Promise(r => setTimeout(() => r(MOCK_STATS_BY_VEHICLE[k] ?? MOCK_STATS_BY_VEHICLE.all), 400));
const fetchChartData = (k) => new Promise(r => setTimeout(() => r(MOCK_REVENUE_BY_VEHICLE[k] ?? MOCK_REVENUE_BY_VEHICLE.all), 500));

/* Simulate POST /api/withdrawals */
const postWithdrawal = ({ amount, bankAccountId }) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!amount || Number(amount) <= 0) reject(new Error('Số tiền không hợp lệ.'));
      else if (!bankAccountId) reject(new Error('Vui lòng chọn tài khoản ngân hàng.'));
      else resolve({ id: genId(), status: 'processing' });
    }, 1200)
  );

/* ══════════════════════════════════════════════════════════ */
const Revenue = () => {
  /* ── Vehicle filter state ── */
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('all');
  const [stats, setStats] = useState(MOCK_STATS_BY_VEHICLE.all);
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartData, setChartData] = useState(MOCK_REVENUE_BY_VEHICLE.all);
  const [chartLoading, setChartLoading] = useState(false);

  /* ── Payout table ── */
  const [payouts, setPayouts] = useState(INITIAL_PAYOUTS);
  const [detailTx, setDetailTx] = useState(null);

  /* ── Withdraw dialog ── */
  const [wOpen, setWOpen] = useState(false);
  const [wAmount, setWAmount] = useState('');
  const [wAmtErr, setWAmtErr] = useState('');
  const [wBankId, setWBankId] = useState(MOCK_BANK_ACCOUNTS[0]?.id ?? '');
  const [wLoading, setWLoading] = useState(false);

  /* ── MUI Snackbar (fallback) ── */
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const prevId = useRef(null);

  /* ── Load vehicles ── */
  useEffect(() => {
    fetchVehicles().then(d => { setVehicles(d); setVehiclesLoading(false); });
  }, []);

  /* ── Refresh stats + chart on vehicle change ── */
  useEffect(() => {
    if (prevId.current === selectedId) return;
    prevId.current = selectedId;
    const key = selectedId === 'all' ? 'all' : Number(selectedId);
    setStatsLoading(true);
    fetchStats(key).then(d => { setStats(d); setStatsLoading(false); });
    setChartLoading(true);
    fetchChartData(key).then(d => { setChartData(d); setChartLoading(false); });
  }, [selectedId]);

  /* ── Open withdraw dialog ── */
  const openWithdraw = () => {
    setWAmount('');
    setWAmtErr('');
    setWBankId(MOCK_BANK_ACCOUNTS.find(b => b.primary)?.id ?? MOCK_BANK_ACCOUNTS[0]?.id ?? '');
    setWOpen(true);
  };

  /* ── Amount validator ── */
  const validateAmt = (val) => {
    const n = Number(String(val).replace(/\D/g, ''));
    const avail = stats?.pending ?? 0;
    if (!val || isNaN(n) || n <= 0) return 'Vui lòng nhập số tiền muốn rút.';
    if (n < 100_000) return 'Số tiền tối thiểu là 100,000đ.';
    if (n > avail) return `Vượt quá số dư (${fmtVN(avail)}).`;
    return '';
  };

  /* ── Submit withdrawal ── */
  const handleWithdraw = async () => {
    const err = validateAmt(wAmount);
    if (err) { setWAmtErr(err); return; }
    if (!wBankId) { toast.error('Vui lòng chọn tài khoản ngân hàng.'); return; }

    const rawAmt = Number(String(wAmount).replace(/\D/g, ''));
    const bankAcc = MOCK_BANK_ACCOUNTS.find(b => b.id === wBankId);

    setWLoading(true);
    try {
      const result = await postWithdrawal({ amount: rawAmt, bankAccountId: wBankId });

      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      const newRow = {
        id: result.id,
        month: `T${today.getMonth() + 1}/${today.getFullYear()}`,
        amount: rawAmt,
        method: `${bankAcc?.bankName} ****${bankAcc?.accountNo.slice(-4)}`,
        date: dateStr,
        status: 'processing',
        detail: {
          rentalId: '—', vehicle: '—', renter: '—', period: '—',
          gross: rawAmt, platformFee: 0, damagePenalty: 0, net: rawAmt,
          aiDamages: [],
        },
        contractUrl: '#',
        aiReportUrl: '#',
      };

      setPayouts(prev => [newRow, ...prev]);
      setWOpen(false);
      toast.success(`✅ Yêu cầu rút ${fmtVN(rawAmt)} đã được gửi thành công!`, {
        position: 'top-right', autoClose: 5000,
      });
    } catch (e) {
      toast.error(`❌ Lỗi: ${e.message}`, { position: 'top-right', autoClose: 4000 });
    } finally {
      setWLoading(false);
    }
  };

  /* ── Derived ── */
  const selectedVehicle = vehicles.find(v => String(v.id) === selectedId);
  const vehicleLabel = selectedVehicle
    ? `${selectedVehicle.name} – ${selectedVehicle.plate}`
    : 'Tất cả phương tiện';

  const STAT_CARDS = [
    { label: 'Tổng doanh thu', val: fmtM(stats?.total ?? 0), color: '#0891b2', sub: vehicleLabel },
    { label: 'Đã nhận', val: fmtM(stats?.received ?? 0), color: '#059669', sub: '90% tỷ lệ chi trả' },
    { label: 'Đang chờ rút', val: fmtM(stats?.pending ?? 0), color: '#d97706', sub: 'Số dư khả dụng' },
    { label: 'Tỷ lệ chia sẻ', val: '90%', color: '#7c3aed', sub: 'Chủ xe / SmartRent' },
  ];

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2, fontSize: '0.85rem',
      '&.Mui-focused fieldset': { borderColor: '#059669' },
    },
    '& label.Mui-focused': { color: '#059669' },
  };

  /* ════════════ RENDER ════════════ */
  return (
    <div>
      <ToastContainer theme="light" />

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Doanh thu &amp; Rút tiền</h1>
          <p className="page-subtitle">Theo dõi dòng tiền và yêu cầu rút tiền về tài khoản</p>
        </div>
        <button className="btn-primary" onClick={openWithdraw}>
          <FaMoneyBillWave /> Yêu cầu rút tiền
        </button>
      </div>

      {/* ── 1. Vehicle filter ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f0f0f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MdDirectionsCar style={{ fontSize: '1.1rem', color: '#059669' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Lọc theo phương tiện</span>
        </div>
        {vehiclesLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: '0.82rem' }}>
            <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Đang tải…
          </span>
        ) : (
          <div style={{ position: 'relative', minWidth: 280 }}>
            <FaCar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem', pointerEvents: 'none' }} />
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, paddingRight: 28, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#111827', cursor: 'pointer', boxSizing: 'border-box', appearance: 'none' }}
            >
              <option value="all"> Tất cả phương tiện</option>
              {vehicles.map(v => <option key={v.id} value={String(v.id)}>{v.name} – {v.plate}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af', fontSize: '0.7rem' }}>▼</span>
          </div>
        )}
        {selectedVehicle && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0', borderRadius: 50, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
            <MdDirectionsCar /> {selectedVehicle.name}
            <button onClick={() => setSelectedId('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        )}
      </div>

      {/* ── 2. Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        {STAT_CARDS.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden', opacity: statsLoading ? 0.55 : 1, transition: 'opacity 0.25s' }}>
            {statsLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)' }}>
                <FaSpinner style={{ color: '#059669', fontSize: '1.2rem', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{k.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 3. Bar chart ── */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="chart-title">
            Doanh thu &amp; Chi trả (VND)
            {selectedVehicle && <span style={{ marginLeft: 10, fontSize: '0.75rem', fontWeight: 500, color: '#059669' }}>— {selectedVehicle.name}</span>}
          </div>
          {chartLoading && <FaSpinner style={{ color: '#059669', animation: 'spin 0.8s linear infinite', marginRight: 4 }} />}
        </div>
        <div style={{ opacity: chartLoading ? 0.45 : 1, transition: 'opacity 0.25s' }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} />
              <Tooltip formatter={(v, n) => [fmtVN(v), n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#0891b2" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payouts" name="Đã chi trả" fill="#00b14f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. Payout history ── */}
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Lịch sử chi trả</div>
          <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
            <FaDownload /> Xuất CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Mã GD</th><th>Tháng</th><th>Số tiền</th>
                <th>Tài khoản</th><th>Ngày chi trả</th><th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td><span className="code-badge">{p.id}</span></td>
                  <td style={{ fontWeight: 600 }}>{p.month}</td>
                  <td style={{ fontWeight: 700, color: '#00b14f' }}>{p.amount.toLocaleString()}đ</td>
                  <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.method}</td>
                  <td>{p.date}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button
                      onClick={() => setDetailTx(p)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <FaInfoCircle /> Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════ MUI: Withdraw Dialog ════════ */}
      <Dialog
        open={wOpen}
        onClose={() => !wLoading && setWOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <DialogTitle sx={{ background: 'linear-gradient(135deg,#064e3b,#059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.8, px: 2.5 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaMoneyBillWave /> Yêu cầu rút tiền
          </span>
          <IconButton size="small" onClick={() => !wLoading && setWOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}>✕</IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
          {/* Balance card */}
          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 12, padding: '14px 18px', marginBottom: 22, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 2 }}>Số dư khả dụng</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>
                {fmtVN(stats?.pending ?? 0)}
              </div>
            </div>
            <FaCheckCircle style={{ fontSize: '2rem', color: '#86efac' }} />
          </div>

          {/* Amount input */}
          <TextField
            fullWidth
            label="Số tiền muốn rút (đ)"
            placeholder="Ví dụ: 1000000"
            value={wAmount}
            onChange={e => { setWAmount(e.target.value); setWAmtErr(validateAmt(e.target.value)); }}
            error={Boolean(wAmtErr)}
            helperText={wAmtErr || `Tối thiểu 100,000đ — Tối đa ${fmtVN(stats?.pending ?? 0)}`}
            inputProps={{ inputMode: 'numeric' }}
            size="small"
            sx={{ ...inputSx, mb: 2.5 }}
          />

          {/* Bank account select */}
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel id="bank-label">Tài khoản ngân hàng nhận tiền</InputLabel>
            <Select
              labelId="bank-label"
              value={wBankId}
              label="Tài khoản ngân hàng nhận tiền"
              onChange={e => setWBankId(e.target.value)}
              renderValue={val => {
                const acc = MOCK_BANK_ACCOUNTS.find(b => b.id === val);
                if (!acc) return 'Chọn tài khoản…';
                return (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FaUniversity style={{ color: '#059669', fontSize: '0.85rem' }} />
                    <strong>{acc.bankName}</strong>
                    <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>****{acc.accountNo.slice(-4)}</span>
                    {acc.primary && <Chip label="Mặc định" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />}
                  </span>
                );
              }}
            >
              {MOCK_BANK_ACCOUNTS.map(acc => (
                <MenuItem key={acc.id} value={acc.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaUniversity style={{ color: '#059669', fontSize: '0.8rem' }} />
                      <strong style={{ fontSize: '0.85rem' }}>{acc.bankName}</strong>
                      {acc.primary && <Chip label="Mặc định" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', paddingLeft: 20 }}>
                      {acc.accountNo} — {acc.accountName}
                    </div>
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: '10px 12px', background: '#eff6ff', borderRadius: 9, border: '1px solid #bfdbfe' }}>
            <FaExclamationTriangle style={{ color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#1d4ed8', lineHeight: 1.5 }}>
              Yêu cầu xử lý trong <strong>1–3 ngày làm việc</strong>. Bạn sẽ nhận thông báo qua email khi hoàn tất.
            </span>
          </div>
        </DialogContent>

        <Divider sx={{ mt: 2 }} />
        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => !wLoading && setWOpen(false)}
            disabled={wLoading}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#e5e7eb', color: '#6b7280' }}
          >
            Huỷ
          </Button>
          <Button
            variant="contained"
            onClick={handleWithdraw}
            disabled={wLoading || !wBankId}
            startIcon={wLoading ? <CircularProgress size={15} color="inherit" /> : <FaMoneyBillWave />}
            sx={{ textTransform: 'none', borderRadius: 2, background: '#059669', '&:hover': { background: '#047857' }, '&.Mui-disabled': { background: '#d1fae5', color: '#6b7280' } }}
          >
            {wLoading ? 'Đang gửi…' : 'Xác nhận rút tiền'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════ MUI: Detail Dialog ════════ */}
      <Dialog
        open={Boolean(detailTx)}
        onClose={() => setDetailTx(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {detailTx && (
          <>
            <DialogTitle sx={{ background: 'linear-gradient(135deg,#064e3b,#059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, px: 2.5 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📊 Bảng kê chi tiết — {detailTx.id}</span>
              <IconButton size="small" onClick={() => setDetailTx(null)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}>✕</IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18, background: '#f9fafb', borderRadius: 10, padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                {[['Mã chuyến thuê', detailTx.detail.rentalId], ['Phương tiện', detailTx.detail.vehicle], ['Khách thuê', detailTx.detail.renter], ['Thời gian', detailTx.detail.period]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Finance breakdown */}
              <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>💰 Bảng kê tài chính</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: 4 }}>
                <tbody>
                  {[
                    { label: 'Doanh thu gộp', value: fmtVN(detailTx.detail.gross), color: '#059669' },
                    { label: 'Phí nền tảng (10%)', value: `-${fmtVN(detailTx.detail.platformFee)}`, color: '#dc2626' },
                    ...(detailTx.detail.damagePenalty > 0
                      ? [{ label: 'Khấu trừ hư hỏng (AI)', value: `-${fmtVN(detailTx.detail.damagePenalty)}`, color: '#d97706' }]
                      : []),
                    { label: 'Thực nhận (chủ xe)', value: fmtVN(detailTx.detail.net), color: '#059669', bold: true },
                  ].map(row => (
                    <tr key={row.label}>
                      <td style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6', color: row.bold ? '#111827' : '#6b7280', fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                      <td style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: row.color, fontWeight: row.bold ? 800 : 600 }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* AI damages */}
              {detailTx.detail.aiDamages.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>🤖 Chi tiết hư hỏng do AI phát hiện</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#fef9ec' }}>
                        {['Hạng mục', 'Mức độ', 'Chi phí'].map((h, i) => (
                          <th key={h} style={{ textAlign: i === 2 ? 'right' : 'left', padding: '7px 10px', fontWeight: 600, color: '#92400e', fontSize: '0.75rem' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailTx.detail.aiDamages.map((d, i) => (
                        <tr key={i}>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6' }}>{d.item}</td>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6' }}>
                            <Chip label={d.severity} size="small" color={d.severity === 'Nhẹ' ? 'warning' : 'error'} sx={{ fontSize: '0.7rem', height: 20 }} />
                          </td>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>-{fmtVN(d.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </DialogContent>

            <Divider />
            <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1, justifyContent: 'flex-start' }}>
              <Button variant="outlined" startIcon={<FaFileContract />} href={detailTx.contractUrl} target="_blank" rel="noopener noreferrer"
                sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.8rem', borderColor: '#bfdbfe', color: '#2563eb', '&:hover': { background: '#eff6ff' } }}>
                Xem hợp đồng số
              </Button>
              <Button variant="outlined" startIcon={<FaRobot />} href={detailTx.aiReportUrl} target="_blank" rel="noopener noreferrer"
                sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.8rem', borderColor: '#ddd6fe', color: '#7c3aed', '&:hover': { background: '#f5f3ff' } }}>
                Xem báo cáo hư hỏng AI
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar fallback */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snack.msg}</Alert>
      </Snackbar>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Revenue;
