import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { FaFileContract, FaCheckCircle, FaArrowLeft, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';
import { MdVerifiedUser } from 'react-icons/md';
import { MOCK_BOOKINGS, MOCK_SHOWROOM_VEHICLES, MOCK_USERS, MOCK_SHOWROOMS } from '../../../components/data/mockDashboard';
import { createContract, getContracts } from '../../../components/data/contractHelpers';

const STEPS = ['Tạo hợp đồng', 'Showroom ký', 'Khách thuê ký', 'Hoàn tất'];

const Stepper = ({ current }) => (
  <div className="flex flex-col gap-0 mb-6">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <div key={label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
              done ? 'bg-emerald-500 border-emerald-500 text-white' :
              active ? 'bg-primary border-primary text-white' :
              'bg-white border-gray-300 text-gray-400'
            }`}>
              {done ? <FaCheckCircle size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-0.5 h-7 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
          <div className="pb-7">
            <div className={`text-sm font-semibold ${done ? 'text-emerald-600' : active ? 'text-primary' : 'text-gray-400'}`}>
              {label}
            </div>
            {done && <div className="text-xs text-gray-400 mt-0.5">Hoàn tất</div>}
            {active && <div className="text-xs text-primary mt-0.5">Đang thực hiện</div>}
          </div>
        </div>
      );
    })}
  </div>
);

const Field = ({ label, value, highlight }) => (
  <div className={`flex justify-between py-2 border-b border-gray-100 ${highlight ? 'bg-green-50 rounded px-2 -mx-2' : ''}`}>
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-xs font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
  </div>
);

const ContractBuilder = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sigInput, setSigInput] = useState('');
  const [sigError, setSigError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [newContractId, setNewContractId] = useState(null);

  const booking = useMemo(() => MOCK_BOOKINGS.find(b => b.id === bookingId), [bookingId]);
  const vehicle = useMemo(() => booking
    ? MOCK_SHOWROOM_VEHICLES.find(v => v.name.includes(booking.vehicle.split(' ').slice(0, 3).join(' '))) || MOCK_SHOWROOM_VEHICLES[0]
    : null, [booking]);
  const renterUser = useMemo(() => booking
    ? MOCK_USERS.find(u => u.name === booking.renter) || null
    : null, [booking]);
  const showroom = useMemo(() => MOCK_SHOWROOMS[0], []);

  const existingContract = useMemo(() =>
    booking ? getContracts().find(c => c.bookingId === booking.id) : null,
  [booking]);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <FaExclamationTriangle className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Không tìm thấy booking</h2>
        <p className="text-sm text-gray-500">Mã booking <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{bookingId}</code> không tồn tại hoặc đã bị xóa.</p>
        <button className="btn-primary mt-2" onClick={() => navigate('/showroom/contracts')}>
          <FaArrowLeft /> Quay lại danh sách
        </button>
      </div>
    );
  }

  if (existingContract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <FaFileContract className="text-amber-500 text-2xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Hợp đồng đã tồn tại</h2>
        <p className="text-sm text-gray-500">
          Booking <strong>{bookingId}</strong> đã có hợp đồng <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{existingContract.id}</code>.
        </p>
        <div className="flex gap-3">
          <button className="btn-outline" onClick={() => navigate('/showroom/contracts')}>
            <FaArrowLeft /> Danh sách HĐ
          </button>
          <button className="btn-primary" onClick={() => navigate(`/contract/sign/${existingContract.id}`)}>
            <FaFileContract /> Xem hợp đồng
          </button>
        </div>
      </div>
    );
  }

  const deposit = Math.round(booking.total * 0.15 / 100000) * 100000;
  const contractData = {
    type: 'rental',
    renter: booking.renter,
    vehicle: booking.vehicle,
    bookingId: booking.id,
    from: booking.from,
    to: booking.to,
    total: booking.total,
    deposit,
    plate: vehicle?.plate || 'N/A',
    renterCCCD: renterUser?.cccd || '000000000000',
    renterPhone: renterUser?.phone || booking.renterPhone || 'N/A',
    showroomName: showroom.name,
    showroomAddress: showroom.address,
    showroomRep: showroom.owner,
    showroomSig: null,
  };

  const handleSign = () => {
    if (!sigInput.trim()) {
      setSigError('Vui lòng nhập họ tên người đại diện để ký.');
      return;
    }
    setSigError('');
    const now = new Date().toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const fullData = {
      ...contractData,
      showroomSig: { name: sigInput.trim(), time: now },
    };
    const created = createContract(fullData);
    setNewContractId(created.id);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-[dropIn_0.4s_ease]">
          <FaCheckCircle className="text-emerald-500 text-4xl" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-800">Đã ký & Gửi thành công!</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Hợp đồng <code className="bg-gray-100 px-1.5 py-0.5 rounded">{newContractId}</code> đã được tạo và gửi cho khách thuê ký.
        </p>
        <div className="flex gap-3 mt-2">
          <button className="btn-outline" onClick={() => navigate('/showroom/contracts')}>
            Danh sách hợp đồng
          </button>
          <button className="btn-primary" onClick={() => navigate(`/contract/sign/${newContractId}`)}>
            <FaFileContract /> Xem hợp đồng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tạo Hợp đồng Điện tử</h1>
          <p className="page-subtitle">Booking <strong>{bookingId}</strong> – {booking.vehicle}</p>
        </div>
        <button className="btn-outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Quay lại
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* LEFT: A4 contract preview */}
        <div className="w-full lg:w-[60%] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center gap-2">
            <FaFileContract className="text-primary text-sm" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bản xem trước hợp đồng</span>
          </div>

          <div className="p-8 font-serif text-[0.82rem] leading-relaxed text-gray-800">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
              <div className="text-xs text-gray-500 mb-4">Độc lập – Tự do – Hạnh phúc</div>
              <div className="text-xl font-extrabold uppercase tracking-wide text-gray-900">Hợp đồng thuê xe</div>
              <div className="text-xs text-gray-500 mt-1">Số: [Tự động cấp] – Ngày: {new Date().toLocaleDateString('vi-VN')}</div>
            </div>

            <p className="mb-4 text-justify">
              Hợp đồng này được lập giữa các bên dưới đây căn cứ vào Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam, các quy định của pháp luật hiện hành có liên quan và sự thỏa thuận của các bên.
            </p>

            {/* Party A */}
            <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="font-bold text-blue-800 mb-2 text-sm">BÊN A (Bên cho thuê / Showroom)</div>
              <Field label="Tên đơn vị" value={contractData.showroomName} />
              <Field label="Địa chỉ" value={contractData.showroomAddress} />
              <Field label="Người đại diện" value={contractData.showroomRep} />
            </div>

            {/* Party B */}
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="font-bold text-green-800 mb-2 text-sm">BÊN B (Bên thuê xe)</div>
              <Field label="Họ và tên" value={booking.renter} />
              <Field label="Số CCCD" value={contractData.renterCCCD} />
              <Field label="Số điện thoại" value={contractData.renterPhone} />
            </div>

            {/* Vehicle info */}
            <div className="mb-5">
              <div className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">Điều 1: Thông tin xe thuê</div>
              <Field label="Tên xe" value={booking.vehicle} highlight />
              <Field label="Biển số xe" value={contractData.plate} highlight />
              <Field label="Hãng xe" value={vehicle?.brand || 'N/A'} />
              <Field label="Loại xe" value={vehicle?.category || 'N/A'} />
              <Field label="Nhiên liệu" value={vehicle?.fuel || 'N/A'} />
            </div>

            {/* Time & Cost */}
            <div className="mb-5">
              <div className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">Điều 2: Thời gian & Chi phí</div>
              <Field label="Ngày nhận xe" value={booking.from} highlight />
              <Field label="Ngày trả xe" value={booking.to} highlight />
              <Field label="Số ngày thuê" value={`${booking.days} ngày`} />
              <Field label="Đơn giá/ngày" value={`${(vehicle?.price || 0).toLocaleString()}K VNĐ`} />
              <Field label="Tiền cọc" value={`${deposit.toLocaleString()} VNĐ`} highlight />
              <Field label="Tổng tiền thanh toán" value={`${booking.total.toLocaleString()} VNĐ`} highlight />
            </div>

            {/* Terms */}
            <div className="mb-6">
              <div className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">Điều 3: Điều khoản chung</div>
              <ul className="list-disc pl-5 space-y-1.5 text-[0.78rem] text-gray-600">
                <li>Bên B có trách nhiệm bảo quản xe, không sử dụng xe vào mục đích vi phạm pháp luật.</li>
                <li>Bên B chịu trách nhiệm về các hư hỏng phát sinh trong thời gian thuê (ngoài hao mòn tự nhiên).</li>
                <li>Trường hợp trả xe trễ, Bên B chịu phí phát sinh theo quy định của Bên A.</li>
                <li>Tiền cọc sẽ được hoàn trả trong vòng 48 giờ sau khi xe được trả về và kiểm định.</li>
                <li>Mọi tranh chấp sẽ được giải quyết thông qua thương lượng hoặc tòa án có thẩm quyền.</li>
              </ul>
            </div>

            {/* Signatures area */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="font-bold text-sm mb-1">Đại diện Bên A</div>
                <div className="text-xs text-gray-500 mb-4">(Ký, ghi rõ họ tên)</div>
                <div className="h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  {sigInput ? (
                    <div className="text-primary font-bold italic text-base">{sigInput}</div>
                  ) : (
                    <span className="text-xs text-gray-400">Chưa ký</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">Đại diện Bên B</div>
                <div className="text-xs text-gray-500 mb-4">(Ký, ghi rõ họ tên)</div>
                <div className="h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">Chờ khách ký</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">

          {/* Stepper */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaFileContract className="text-primary" /> Tiến trình hợp đồng
            </div>
            <Stepper current={1} />
          </div>

          {/* Auto-fill summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MdVerifiedUser className="text-primary text-base" /> Thông tin tự động điền
            </div>
            <div className="flex flex-col gap-1.5 text-[0.78rem]">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Mã booking</span>
                <span className="font-bold text-gray-800">{booking.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Khách thuê</span>
                <span className="font-semibold text-gray-800">{booking.renter}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Xe</span>
                <span className="font-semibold text-gray-800 text-right max-w-[55%]">{booking.vehicle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Biển số</span>
                <span className="font-bold text-primary">{contractData.plate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Thời gian</span>
                <span className="font-semibold text-gray-800">{booking.from} → {booking.to}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Tổng tiền</span>
                <span className="font-bold text-primary text-sm">{booking.total.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* Signature block */}
          <div className="bg-white rounded-2xl border border-primary/30 shadow-sm p-6">
            <div className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
              <FaFileContract className="text-primary" /> Chữ ký Showroom
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Nhập họ tên người đại diện Showroom. Chữ ký số này sẽ được ghi nhận bằng tài khoản eKYC của bạn (<strong>{user?.name}</strong>).
            </p>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Họ và tên người đại diện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sigInput}
              onChange={e => { setSigInput(e.target.value); setSigError(''); }}
              placeholder={contractData.showroomRep}
              className="w-full border-[1.5px] border-gray-200 rounded-[9px] px-3 py-2.5 text-sm outline-none text-gray-900 focus:border-primary transition-colors"
            />
            {sigError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <FaExclamationTriangle size={10} /> {sigError}
              </p>
            )}

            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <strong>Lưu ý:</strong> Sau khi ký, hợp đồng sẽ được gửi tới khách thuê để ký xác nhận. Trạng thái sẽ chuyển thành <strong>Chờ Khách ký</strong>.
            </div>

            <button
              onClick={handleSign}
              className="btn-primary w-full justify-center mt-4 py-3 text-sm"
            >
              <FaPaperPlane /> Ký & Gửi cho khách
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractBuilder;
