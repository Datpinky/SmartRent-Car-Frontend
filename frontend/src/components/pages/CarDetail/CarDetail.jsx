import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaGasPump, FaHeart, FaShareAlt, FaChevronLeft, FaStore } from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar, MdVerified, MdShield } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';
import { cars } from '../../data/cars';
import './CarDetail.css';

const SpecItem = ({ icon, label, value }) => (
    <div className="detail-spec-item">
        <div className="detail-spec-icon">{icon}</div>
        <div>
            <div className="detail-spec-label">{label}</div>
            <div className="detail-spec-value">{value}</div>
        </div>
    </div>
);

const CarDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const car = cars.find(c => c.id === Number(id));

    if (!car) return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🚗</div>
            <h2>Không tìm thấy xe</h2>
            <button className="btn-book" style={{ maxWidth: 200, margin: '20px auto' }} onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
    );

    const hue = Math.abs(car.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;

    return (
        <div className="car-detail-page">
            <button className="car-detail-back" onClick={() => navigate(-1)}>
                <FaChevronLeft size={12} /> Quay lại danh sách xe
            </button>

            <div className="car-detail-layout">
                {/* Left: Gallery + Info */}
                <div>
                    {/* Image */}
                    <div className="car-gallery-main">
                        {car.image ? (
                            <img
                                src={car.image}
                                alt={car.name}
                                className="car-gallery-img"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className="car-gallery-placeholder" style={{
                            background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)`,
                            display: car.image ? 'none' : 'flex',
                        }}>
                            <MdDirectionsCar style={{
                                fontSize: '8rem',
                                color: car.color || `hsl(${hue},40%,50%)`,
                                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))',
                                transform: 'scaleX(-1)',
                            }} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 24 }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--gray-200)', borderRadius: 50, fontSize: '0.82rem', color: 'var(--gray-600)', cursor: 'pointer', background: 'white' }}>
                            <FaShareAlt size={13} /> Chia sẻ
                        </button>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--gray-200)', borderRadius: 50, fontSize: '0.82rem', color: 'var(--gray-600)', cursor: 'pointer', background: 'white' }}>
                            <FaHeart size={13} /> Yêu thích
                        </button>
                    </div>

                    {/* Info */}
                    <div className="car-detail-info">
                        <h1 className="car-detail-name">{car.name}</h1>

                        {/* Meta */}
                        <div className="car-detail-meta">
                            <div className="car-detail-meta-item">
                                <FaMapMarkerAlt size={12} color="var(--primary)" /> {car.location}
                            </div>
                            {car.showroom && (
                                <div className="car-detail-meta-item" style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>
                                    <FaStore size={12} color="var(--gray-400)" /> {car.showroom}
                                </div>
                            )}
                            <div className="car-detail-rating-row">
                                <div className="detail-stars">
                                    {[1, 2, 3, 4, 5].map(i => <FaStar key={i} size={13} color={i <= Math.round(car.rating) ? '#f59e0b' : '#e5e7eb'} />)}
                                </div>
                                <strong>{car.rating}</strong>
                                <span style={{ color: 'var(--gray-400)' }}>({car.trips} chuyến)</span>
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>
                                <MdVerified size={15} /> {car.type}
                            </span>
                        </div>

                        {/* Specs */}
                        <div>
                            <div className="car-detail-section-title">Thông số kỹ thuật</div>
                            <div className="car-detail-specs">
                                <SpecItem icon={<MdPeople size={18} />} label="Số chỗ" value={`${car.seats} chỗ ngồi`} />
                                <SpecItem icon={<MdSettings size={18} />} label="Hộp số" value={car.transmission} />
                                <SpecItem
                                    icon={car.fuel === 'Điện' ? <BsLightningChargeFill size={16} color="#2196f3" /> : <FaGasPump size={16} />}
                                    label="Nhiên liệu"
                                    value={car.fuel}
                                />
                                <SpecItem icon={<MdDirectionsCar size={18} />} label="Loại xe" value={car.category} />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="car-detail-section-title">Mô tả xe</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: 1.8 }}>
                                {car.name} là lựa chọn tuyệt vời cho những chuyến đi trong và ngoài thành phố.
                                Xe được bảo dưỡng định kỳ, đảm bảo an toàn và thoải mái cho người lái.
                                Xe có đầy đủ các tiện nghi hiện đại, điều hòa, camera lùi, hỗ trợ đỗ xe,
                                và hệ thống âm thanh chất lượng cao.
                            </p>
                        </div>

                        {/* Features */}
                        <div>
                            <div className="car-detail-section-title">Tiện nghi</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {['Điều hòa', 'Camera lùi', 'Cảm biến', 'GPS', 'Bluetooth', 'USB', 'Bản đồ', 'Túi khí'].map(f => (
                                    <span key={f} style={{
                                        padding: '4px 12px',
                                        background: 'var(--primary-light)',
                                        color: 'var(--primary)',
                                        borderRadius: 50,
                                        fontSize: '0.78rem',
                                        fontWeight: 500,
                                    }}>✓ {f}</span>
                                ))}
                            </div>
                        </div>

                        {/* Insurance */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f0f9f4', padding: 14, borderRadius: 10, border: '1px solid #c8ecd8' }}>
                            <MdShield size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-800)', marginBottom: 4 }}>Bảo hiểm toàn diện</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                                    Xe được bảo hiểm tai nạn toàn diện trong suốt chuyến đi. Mức bồi thường lên đến 1 tỷ đồng.
                                </div>
                            </div>
                        </div>

                        {/* Terms & Regulations */}
                        <div className="car-detail-terms">
                            <div className="car-detail-terms-title">Điều khoản</div>
                            <div className="car-detail-terms-subtitle">Quy định khác:</div>
                            <div className="car-detail-terms-body">
                                <p>– Sử dụng xe đúng mục đích.</p>
                                <p>– Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.</p>
                                <p>– Không sử dụng xe thuê để cầm cố, thế chấp.</p>
                                <p>– Không hút thuốc, nhả kẹo cao su, xả rác trong xe.</p>
                                <p>– Không chở hàng quốc cấm dễ cháy nổ.</p>
                                <p>– Không chở hoa quả, thực phẩm nặng mùi trong xe.</p>
                                <p>– Khi trả xe, nếu xe bẩn hoặc có mùi trong xe, khách hàng vui lòng vệ sinh xe sạch sẽ hoặc gửi phụ thu phí vệ sinh xe.</p>
                                <p>Trân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Booking card */}
                <div>
                    <div className="booking-card">
                        <div className="booking-price-row">
                            <span className="booking-price">{car.price.toLocaleString()}K</span>
                            <span className="booking-price-unit">/ngày</span>
                        </div>

                        <div className="booking-divider" />

                        <div className="booking-field">
                            <div className="booking-field-label">Thời gian nhận xe</div>
                            <input type="datetime-local" className="booking-field-input" defaultValue="2026-02-24T15:00" />
                        </div>
                        <div className="booking-field">
                            <div className="booking-field-label">Thời gian trả xe</div>
                            <input type="datetime-local" className="booking-field-input" defaultValue="2026-02-26T19:00" />
                        </div>

                        <div className="booking-divider" />

                        {/* Price breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                            {[
                                [`${car.price.toLocaleString()}K × 2 ngày`, `${(car.price * 2).toLocaleString()}K`],
                                ['Phí dịch vụ (5%)', `${Math.round(car.price * 2 * 0.05).toLocaleString()}K`],
                                ['Bảo hiểm', 'Miễn phí'],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: 'var(--gray-600)' }}>
                                    <span>{label}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{val}</span>
                                </div>
                            ))}
                            <div className="booking-divider" style={{ margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                                <span>Tổng cộng</span>
                                <span style={{ color: 'var(--primary)' }}>{(car.price * 2 + Math.round(car.price * 2 * 0.05)).toLocaleString()}K</span>
                            </div>
                        </div>

                        <button className="btn-book">Đặt xe ngay</button>
                        <div className="booking-note">Miễn phí hủy trước 1 giờ · Thanh toán sau</div>

                        {/* Owner */}
                        <div className="owner-card">
                            <div className="owner-avatar">{car.showroom ? car.showroom[0] : 'C'}</div>
                            <div>
                                <div className="owner-name">{car.showroom || 'Chủ xe SmartRent'}</div>
                                <div className="owner-meta">⭐ 4.9 · Phản hồi trong 5 phút</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarDetail;
