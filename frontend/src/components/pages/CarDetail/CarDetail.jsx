import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaGasPump, FaHeart, FaShareAlt, FaChevronLeft, FaStore } from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar, MdVerified, MdShield } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';
import { cars } from '../../data/cars';
import CarLocationMap from '../../Map/CarLocationMap';

const SpecItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary shrink-0">{icon}</div>
    <div>
      <div className="text-[0.72rem] text-gray-400 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[0.9rem] font-semibold text-gray-800">{value}</div>
    </div>
  </div>
);

const sectionTitle = "text-[0.9rem] font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100";

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const car = cars.find(c => c.id === Number(id));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (!car) return (
    <div className="text-center py-20 px-5">
      <div className="text-[4rem] mb-4">🚗</div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Không tìm thấy xe</h2>
      <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors" onClick={() => navigate('/')}>Về trang chủ</button>
    </div>
  );

  const hue = Math.abs(car.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;

  return (
    <div className="max-w-[1280px] mx-auto px-5 py-6">
      <button
        className="flex items-center gap-2 text-[0.82rem] text-gray-500 font-medium mb-5 hover:text-primary transition-colors"
        onClick={() => navigate(-1)}
      >
        <FaChevronLeft size={12} /> Quay lại danh sách xe
      </button>

      <div className="grid grid-cols-[1fr_360px] gap-8 items-start max-[900px]:grid-cols-1">
        {/* Left */}
        <div>
          {/* Gallery */}
          <div className="w-full rounded-2xl overflow-hidden bg-gray-100 relative" style={{ aspectRatio: '16/9' }}>
            {car.image ? (
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)`,
                display: car.image ? 'none' : 'flex',
              }}
            >
              <MdDirectionsCar style={{ fontSize: '8rem', color: car.color || `hsl(${hue},40%,50%)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))', transform: 'scaleX(-1)' }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-3 mb-6">
            {[{ icon: <FaShareAlt size={13} />, label: 'Chia sẻ' }, { icon: <FaHeart size={13} />, label: 'Yêu thích' }].map(({ icon, label }) => (
              <button key={label} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-[0.82rem] text-gray-600 cursor-pointer bg-white hover:border-primary hover:text-primary transition-colors">
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <h1 className="text-2xl font-extrabold text-gray-900">{car.name}</h1>

            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-[0.85rem] text-primary font-medium"><FaMapMarkerAlt size={12} /> {car.address}</span>
              {car.showroom && (
                <span className="flex items-center gap-1 text-[0.82rem] text-gray-500"><FaStore size={12} className="text-gray-400" /> {car.showroom}</span>
              )}
              <span className="flex items-center gap-1 text-[0.85rem]">
                {[1, 2, 3, 4, 5].map(i => <FaStar key={i} size={13} color={i <= Math.round(car.rating) ? '#f59e0b' : '#e5e7eb'} />)}
                <strong className="ml-1">{car.rating}</strong>
                <span className="text-gray-400">({car.trips} chuyến)</span>
              </span>
              <span className="flex items-center gap-1 text-primary font-semibold text-[0.85rem]"><MdVerified size={15} /> {car.type}</span>
            </div>

            {/* Specs */}
            <div>
              <div className={sectionTitle}>Thông số kỹ thuật</div>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <SpecItem icon={<MdPeople size={18} />} label="Số chỗ" value={`${car.seats} chỗ ngồi`} />
                <SpecItem icon={<MdSettings size={18} />} label="Hộp số" value={car.transmission} />
                <SpecItem icon={car.fuel === 'Điện' ? <BsLightningChargeFill size={16} color="#2196f3" /> : <FaGasPump size={16} />} label="Nhiên liệu" value={car.fuel} />
                <SpecItem icon={<MdDirectionsCar size={18} />} label="Loại xe" value={car.category} />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className={sectionTitle}>Mô tả xe</div>
              <p className="text-[0.875rem] text-gray-600 leading-[1.8]">
                {car.name} là lựa chọn tuyệt vời cho những chuyến đi trong và ngoài thành phố.
                Xe được bảo dưỡng định kỳ, đảm bảo an toàn và thoải mái cho người lái.
                Xe có đầy đủ các tiện nghi hiện đại, điều hòa, camera lùi, hỗ trợ đỗ xe, và hệ thống âm thanh chất lượng cao.
              </p>
            </div>

            {/* Car Location Map */}
            <div>
              <div className={sectionTitle}>Vị trí xe</div>
              <CarLocationMap
                locationText={car.address}
                carName={car.name}
              />
            </div>

            {/* Features */}
            <div>
              <div className={sectionTitle}>Tiện nghi</div>
              <div className="flex flex-wrap gap-2">
                {['Điều hòa', 'Camera lùi', 'Cảm biến', 'GPS', 'Bluetooth', 'USB', 'Bản đồ', 'Túi khí'].map(f => (
                  <span key={f} className="px-3 py-1 bg-primary-light text-primary rounded-full text-[0.78rem] font-medium">✓ {f}</span>
                ))}
              </div>
            </div>

            {/* Insurance */}
            <div className="flex items-start gap-2.5 bg-[#f0f9f4] p-3.5 rounded-xl border border-[#c8ecd8]">
              <MdShield size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[0.85rem] text-gray-800 mb-1">Bảo hiểm toàn diện</div>
                <div className="text-[0.78rem] text-gray-500">Xe được bảo hiểm tai nạn toàn diện trong suốt chuyến đi. Mức bồi thường lên đến 1 tỷ đồng.</div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="font-bold text-[0.88rem] text-gray-800 mb-2">Điều khoản</div>
              <div className="text-[0.8rem] font-semibold text-gray-600 mb-1.5">Quy định khác:</div>
              <div className="text-[0.8rem] text-gray-600 leading-[1.8] flex flex-col gap-0.5">
                {['Sử dụng xe đúng mục đích.', 'Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.', 'Không sử dụng xe thuê để cầm cố, thế chấp.', 'Không hút thuốc, nhả kẹo cao su, xả rác trong xe.', 'Không chở hàng quốc cấm dễ cháy nổ.', 'Trân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !'].map((t, i) => (
                  <p key={i}>– {t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking card */}
        <div className="sticky top-[76px]">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[1.8rem] font-extrabold text-primary">{car.price.toLocaleString()}K</span>
              <span className="text-[0.9rem] text-gray-500">/ngày</span>
            </div>
            <div className="h-px bg-gray-100 my-4" />

            {[{ label: 'Thời gian nhận xe', def: '2026-02-24T15:00' }, { label: 'Thời gian trả xe', def: '2026-02-26T19:00' }].map(({ label, def }) => (
              <div key={label} className="mb-3">
                <div className="text-[0.78rem] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</div>
                <input type="datetime-local" className="w-full border-[1.5px] border-gray-200 rounded-lg px-3 py-2.5 text-[0.85rem] text-gray-800 outline-none focus:border-primary transition-colors" defaultValue={def} />
              </div>
            ))}

            <div className="h-px bg-gray-100 my-4" />

            <div className="flex flex-col gap-2 mb-4">
              {[
                [`${car.price.toLocaleString()}K × 2 ngày`, `${(car.price * 2).toLocaleString()}K`],
                ['Phí dịch vụ (5%)', `${Math.round(car.price * 2 * 0.05).toLocaleString()}K`],
                ['Bảo hiểm', 'Miễn phí'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-[0.83rem] text-gray-600">
                  <span>{label}</span>
                  <span className="font-semibold text-gray-800">{val}</span>
                </div>
              ))}
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between font-extrabold text-[0.95rem] text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-primary">{(car.price * 2 + Math.round(car.price * 2 * 0.05)).toLocaleString()}K</span>
              </div>
            </div>

            <button 
              className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl text-[0.95rem] tracking-wide transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(135,206,235,0.35)]"
              onClick={() => navigate('/renter/checkout/' + car.id)}
            >
              Đặt xe ngay
            </button>
            <div className="text-center text-[0.75rem] text-gray-400 mt-3">Miễn phí hủy trước 1 giờ · Thanh toán sau</div>

            {/* Owner */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shrink-0">
                {car.showroom ? car.showroom[0] : 'C'}
              </div>
              <div>
                <div className="text-[0.85rem] font-semibold text-gray-800">{car.showroom || 'Chủ xe SmartRent'}</div>
                <div className="text-[0.75rem] text-gray-400">⭐ 4.9 · Phản hồi trong 5 phút</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;
