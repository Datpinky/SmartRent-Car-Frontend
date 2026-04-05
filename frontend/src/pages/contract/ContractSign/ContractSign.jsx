import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaFileContract, FaCheckCircle, FaArrowLeft, FaExclamationTriangle,
  FaLock, FaDownload, FaTimesCircle,
} from 'react-icons/fa';
import { MdVerifiedUser } from 'react-icons/md';
import { getContractById, signContract } from '../../../components/data/contractHelpers';
import StatusBadge from '../../../components/common/StatusBadge';

const STEPS = ['Tạo hợp đồng', 'Showroom ký', 'Khách thuê ký', 'Hoàn tất'];

const stepForStatus = (status) => {
  if (status === 'draft') return 0;
  if (status === 'pending_renter_sign' || status === 'pending_owner_sign') return 2;
  if (status === 'active' || status === 'signed') return 4;
  return 1;
};

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

const SigBlock = ({ label, sig }) => (
  <div className="text-center">
    <div className="font-bold text-sm mb-1">{label}</div>
    <div className="text-xs text-gray-500 mb-3">(Ký, ghi rõ họ tên)</div>
    <div className="h-16 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-0.5">
      {sig ? (
        <>
          <div className="text-primary font-bold italic text-base leading-tight">{sig.name}</div>
          <div className="text-[0.65rem] text-gray-400">{sig.time}</div>
        </>
      ) : (
        <span className="text-xs text-gray-400">Chưa ký</span>
      )}
    </div>
  </div>
);

const Field = ({ label, value, highlight }) => (
  <div className={`flex justify-between py-2 border-b border-gray-100 ${highlight ? 'bg-green-50 rounded px-2 -mx-2' : ''}`}>
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-xs font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
  </div>
);

const ContractSign = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [sigInput, setSigInput] = useState('');
  const [sigError, setSigError] = useState('');
  const [signed, setSigned] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const c = getContractById(contractId);
    if (!c) { setNotFound(true); return; }
    setContract(c);
    if (user && !sigInput) setSigInput(user.name || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <FaTimesCircle className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Hợp đồng không tồn tại</h2>
        <p className="text-sm text-gray-500">
          Mã hợp đồng <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{contractId}</code> không hợp lệ hoặc đã bị xóa.
        </p>
        <button className="btn-primary mt-2" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Quay lại
        </button>
      </div>
    );
  }

  if (!contract) return null;

  const canSign = user && (user.role === 'renter' || user.role === 'owner');
  const isShowroom = user && (user.role === 'showroom' || user.role === 'admin');
  const isFullySigned = contract.status === 'active' || contract.status === 'signed';
  const alreadySigned = canSign && !!contract.renterSig;
  const wrongRole = !canSign && !isShowroom;

  const stepCurrent = signed ? 4 : stepForStatus(contract.status);

  const handleSign = () => {
    if (!sigInput.trim()) {
      setSigError('Vui lòng nhập họ tên đầy đủ để ký.');
      return;
    }
    setSigError('');
    const updated = signContract(contract.id, user.role, sigInput.trim());
    setContract(updated);
    setSigned(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hợp đồng Điện tử</h1>
          <p className="page-subtitle flex items-center gap-2">
            Mã: <strong>{contract.id}</strong>
            <StatusBadge status={signed ? 'active' : contract.status} />
          </p>
        </div>
        <button className="btn-outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Quay lại
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* LEFT: A4 preview */}
        <div className="w-full lg:w-[60%] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center gap-2">
            <FaFileContract className="text-primary text-sm" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bản xem trước hợp đồng</span>
            <span className="ml-auto"><StatusBadge status={signed ? 'active' : contract.status} /></span>
          </div>

          <div className="p-8 font-serif text-[0.82rem] leading-relaxed text-gray-800">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
              <div className="text-xs text-gray-500 mb-4">Độc lập – Tự do – Hạnh phúc</div>
              <div className="text-xl font-extrabold uppercase tracking-wide text-gray-900">Hợp đồng thuê xe</div>
              <div className="text-xs text-gray-500 mt-1">Số: {contract.id} – Ngày: {contract.createdAt}</div>
            </div>

            <p className="mb-4 text-justify">
              Hợp đồng này được lập giữa các bên dưới đây căn cứ vào Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam, các quy định của pháp luật hiện hành có liên quan và sự thỏa thuận của các bên.
            </p>

            {/* Party A */}
            <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="font-bold text-blue-800 mb-2 text-sm">BÊN A (Bên cho thuê / Showroom)</div>
              <Field label="Tên đơn vị" value={contract.showroomName} />
              <Field label="Địa chỉ" value={contract.showroomAddress} />
              <Field label="Người đại diện" value={contract.showroomRep} />
            </div>

            {/* Party B */}
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="font-bold text-green-800 mb-2 text-sm">BÊN B (Bên thuê xe)</div>
              <Field label="Họ và tên" value={contract.renter} />
              <Field label="Số CCCD" value={contract.renterCCCD} />
              <Field label="Số điện thoại" value={contract.renterPhone} />
            </div>

            {/* Vehicle */}
            <div className="mb-5">
              <div className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">Điều 1: Thông tin xe thuê</div>
              <Field label="Tên xe" value={contract.vehicle} highlight />
              <Field label="Biển số xe" value={contract.plate} highlight />
            </div>

            {/* Time & Cost */}
            <div className="mb-5">
              <div className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">Điều 2: Thời gian & Chi phí</div>
              <Field label="Ngày nhận xe" value={contract.from} highlight />
              <Field label="Ngày trả xe" value={contract.to} highlight />
              <Field label="Tiền cọc" value={`${(contract.deposit || 0).toLocaleString()} VNĐ`} highlight />
              <Field label="Tổng tiền thanh toán" value={`${contract.total.toLocaleString()} VNĐ`} highlight />
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

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <SigBlock label="Đại diện Bên A" sig={contract.showroomSig} />
              <SigBlock
                label="Đại diện Bên B"
                sig={signed && sigInput ? { name: sigInput, time: new Date().toLocaleString('vi-VN') } : contract.renterSig}
              />
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
            <Stepper current={stepCurrent} />
          </div>

          {/* Showroom sig status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Trạng thái chữ ký</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Showroom</span>
                {contract.showroomSig ? (
                  <div className="flex items-center gap-1.5">
                    <FaCheckCircle className="text-emerald-500 text-xs" />
                    <span className="text-xs font-semibold text-emerald-600">{contract.showroomSig.name}</span>
                  </div>
                ) : (
                  <StatusBadge status="draft" />
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500 font-medium">Khách thuê</span>
                {(signed || contract.renterSig) ? (
                  <div className="flex items-center gap-1.5">
                    <FaCheckCircle className="text-emerald-500 text-xs" />
                    <span className="text-xs font-semibold text-emerald-600">
                      {signed ? sigInput : contract.renterSig?.name}
                    </span>
                  </div>
                ) : (
                  <StatusBadge status="pending_renter_sign" />
                )}
              </div>
            </div>
          </div>

          {/* --- SIGNED: fully executed --- */}
          {(isFullySigned || signed) && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <FaCheckCircle className="text-emerald-500 text-2xl" />
              </div>
              <div className="font-extrabold text-emerald-700 text-base">Hợp đồng có hiệu lực</div>
              <p className="text-xs text-gray-500">Cả hai bên đã ký xác nhận. Hợp đồng này có giá trị pháp lý kể từ thời điểm ký.</p>
              <button className="btn-primary w-full justify-center mt-1">
                <FaDownload /> Tải PDF hợp đồng
              </button>
            </div>
          )}

          {/* --- WRONG ROLE --- */}
          {wrongRole && !isFullySigned && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FaLock className="text-red-500 text-lg" />
              </div>
              <div className="font-bold text-red-700 text-sm">Không có quyền ký</div>
              <p className="text-xs text-gray-500">Tài khoản của bạn không có quyền ký hợp đồng này. Vui lòng đăng nhập bằng tài khoản Khách thuê hoặc Chủ xe.</p>
            </div>
          )}

          {/* --- ALREADY SIGNED (renter signed before) --- */}
          {alreadySigned && !signed && !isFullySigned && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 text-center">
              <FaCheckCircle className="text-amber-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-amber-700">Bạn đã ký hợp đồng này</div>
              <p className="text-xs text-gray-500 mt-1">Chữ ký của bạn đã được ghi nhận. Đang chờ phía còn lại xác nhận.</p>
            </div>
          )}

          {/* --- SIGN BLOCK: renter/owner can sign --- */}
          {canSign && !isFullySigned && !alreadySigned && !signed && (
            <div className="bg-white rounded-2xl border border-primary/30 shadow-sm p-6">
              <div className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <MdVerifiedUser className="text-primary text-base" /> Ký xác nhận
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Nhập họ tên đầy đủ để ký. Tương đương xác thực bằng tài khoản eKYC (<strong>{user?.name}</strong>).
              </p>

              {!contract.showroomSig && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <FaExclamationTriangle className="shrink-0 mt-0.5" />
                  Showroom chưa ký. Hợp đồng phải được Showroom ký trước.
                </div>
              )}

              {contract.showroomSig && (
                <>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sigInput}
                    onChange={e => { setSigInput(e.target.value); setSigError(''); }}
                    placeholder="Nguyễn Văn A"
                    className="w-full border-[1.5px] border-gray-200 rounded-[9px] px-3 py-2.5 text-sm outline-none text-gray-900 focus:border-primary transition-colors"
                  />
                  {sigError && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <FaExclamationTriangle size={10} /> {sigError}
                    </p>
                  )}
                  <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                    Sau khi ký, hợp đồng sẽ có hiệu lực ngay lập tức và không thể thay đổi.
                  </div>
                  <button onClick={handleSign} className="btn-primary w-full justify-center mt-4 py-3">
                    <FaCheckCircle /> Ký xác nhận
                  </button>
                </>
              )}
            </div>
          )}

          {/* Showroom viewing mode */}
          {isShowroom && !isFullySigned && !signed && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <FaFileContract className="text-gray-400 mx-auto mb-2 text-2xl" />
              <div className="text-sm font-semibold text-gray-700">Đang chờ khách thuê ký</div>
              <p className="text-xs text-gray-400 mt-1">Bạn đã ký hợp đồng này. Hợp đồng sẽ có hiệu lực khi khách thuê xác nhận.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractSign;
