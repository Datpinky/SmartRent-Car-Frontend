import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaGasPump, FaHeart, FaRegHeart, FaShareAlt, FaChevronLeft, FaStore } from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar, MdVerified, MdShield } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';
import { cars as MOCK_CARS } from '../../data/cars';
import MapView from '../../Map/MapView';
import vehicleService from '../../../services/vehicleService';
import vehicleLocationService from '../../../services/vehicleLocationService';
import reviewService from '../../../services/reviewService';
import favoriteService from '../../../services/favoriteService';
import { useAuth } from '../../../contexts/AuthContext';
import { LOCATIONIQ_API_KEY } from '../../Map/mapConfig';
import '../../../pages/renter/Map/MapPage.css';
import '../../Map/CarLocationMap.css';

const SpecItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary shrink-0" aria-hidden="true">{icon}</div>
    <div>
      <div className="text-[0.72rem] text-gray-400 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[0.9rem] font-semibold text-gray-800">{value}</div>
    </div>
  </div>
);

const sectionTitle = "text-[0.9rem] font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100";

const StarRow = ({ rating, count }) => (
  <span className="flex items-center gap-1 text-[0.85rem]">
    {[1, 2, 3, 4, 5].map(i => (
      <FaStar key={i} size={13} color={i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'} aria-hidden="true" />
    ))}
    <strong className="ml-1 tabular-nums">{rating}</strong>
    {count !== undefined && <span className="text-gray-400 tabular-nums">({count} đánh giá)</span>}
  </span>
);

const isMongoId = (str) => /^[a-f\d]{24}$/i.test(str);

/** Sau khi đăng nhập — chủ xe / showroom: khu vực quản lý tương ứng (renter đi thẳng vào checkout) */
const BOOK_NOW_DESTINATIONS = {
  owner: '/owner/dashboard',
  showroom: '/showroom/bookings',
};

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({ total: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // New review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  /** Tọa độ để hiển thị MapView (cùng stack với /map) */
  const [pickupCoords, setPickupCoords] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [coordsLoading, setCoordsLoading] = useState(false);
  const [coordsError, setCoordsError] = useState(null);

  const loadCar = useCallback(async () => {
    setLoading(true);
    try {
      if (isMongoId(id)) {
        const apiCar = await vehicleService.getById(id);
        setCar(apiCar || null);
      } else {
        // Numeric id from mock data
        const mockCar = MOCK_CARS.find(c => c.id === Number(id));
        setCar(mockCar || null);
      }
    } catch {
      const mockCar = MOCK_CARS.find(c => c.id === Number(id));
      setCar(mockCar || null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!isMongoId(id)) return;
    setReviewsLoading(true);
    try {
      const res = await reviewService.getByVehicleId(id);
      setReviews(res.data || []);
      setReviewsMeta(res.pagination || { total: 0 });
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCar();
    loadReviews();
  }, [loadCar, loadReviews]);

  useEffect(() => {
    let cancelled = false;
    if (!car) return undefined;

    const run = async () => {
      setCoordsLoading(true);
      setCoordsError(null);
      setPickupCoords(null);

      const directLat = car.latitude ?? car.lat;
      const directLng = car.longitude ?? car.lng;
      if (directLat != null && directLng != null) {
        if (!cancelled) {
          setPickupCoords({ lat: Number(directLat), lng: Number(directLng) });
          setResolvedAddress(car.address || car.location || '');
          setCoordsLoading(false);
        }
        return;
      }

      if (isMongoId(id)) {
        try {
          const loc = await vehicleLocationService.getByVehicleId(id);
          if (!cancelled && loc?.latitude != null && loc?.longitude != null) {
            setPickupCoords({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
            setResolvedAddress(loc.address || car.address || car.location || '');
            setCoordsLoading(false);
            return;
          }
        } catch {
          /* 401 hoặc chưa có bản ghi — geocode tiếp */
        }
      }

      const text = car.address || car.location;
      if (!text) {
        if (!cancelled) setCoordsLoading(false);
        return;
      }

      const query = encodeURIComponent(`${text}, Việt Nam`);
      try {
        const r = await fetch(
          `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${query}&format=json&limit=1&accept-language=vi`
        );
        if (!r.ok) throw new Error('Không geocode được địa chỉ.');
        const data = await r.json();
        if (!data?.length) throw new Error('Không tìm thấy vị trí.');
        const { lat, lon, display_name } = data[0];
        if (!cancelled) {
          setPickupCoords({ lat: parseFloat(lat), lng: parseFloat(lon) });
          setResolvedAddress(display_name);
        }
      } catch (e) {
        if (!cancelled) setCoordsError(e.message || 'Lỗi bản đồ');
      } finally {
        if (!cancelled) setCoordsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [car, id]);

  const mapCarsForView = useMemo(() => {
    if (!car || !pickupCoords) return [];
    return [
      {
        id: car.id || car._id,
        name: car.name,
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        price: car.price,
        seats: car.seats,
        fuel: car.fuel,
        category: car.category || car.type,
        image: car.image,
      },
    ];
  }, [car, pickupCoords]);

  const googleMapsHref = pickupCoords
    ? `https://www.google.com/maps?q=${pickupCoords.lat},${pickupCoords.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(car?.address || car?.location || '')}`;

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (!isMongoId(id)) { setLiked(p => !p); return; }
    setLikeLoading(true);
    try {
      const res = await favoriteService.toggle(id);
      setLiked(res.favorited);
    } catch {
      setLiked(p => !p);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login', { state: { from: location, bookNow: true } });
      return;
    }
    // Renter and admin go directly to checkout with vehicle id
    if (user.role === 'renter' || user.role === 'admin') {
      navigate(`/renter/checkout/${id}`);
      return;
    }
    const dest = BOOK_NOW_DESTINATIONS[user.role] || '/renter/bookings';
    navigate(dest);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewError('');
    setReviewSubmitting(true);
    try {
      await reviewService.create({ vehicle_id: id, ...reviewForm });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
      loadReviews();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 py-20 text-center">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-4" />
        <p className="text-gray-500">Đang tải thông tin xe…</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-20 px-5">
        <div className="text-[4rem] mb-4">🚗</div>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Không tìm thấy xe</h2>
        <button
          type="button"
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const hue = Math.abs(car.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (car.rating || 0);
  const tripCount = reviewsMeta.total || car.trips || 0;

  return (
    <div className="max-w-[1280px] mx-auto px-5 py-6">
      <button
        type="button"
        className="flex items-center gap-2 text-[0.82rem] text-gray-500 font-medium mb-5 hover:text-primary transition-colors"
        onClick={() => navigate(-1)}
      >
        <FaChevronLeft size={12} aria-hidden="true" /> Quay lại danh sách xe
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
                width={600}
                height={400}
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
              <MdDirectionsCar aria-hidden="true" style={{ fontSize: '8rem', color: car.color || `hsl(${hue},40%,50%)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))', transform: 'scaleX(-1)' }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-3 mb-6">
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-[0.82rem] text-gray-600 cursor-pointer bg-white hover:border-primary hover:text-primary transition-colors"
              onClick={() => navigator.share?.({ title: document.title, url: window.location.href }) || navigator.clipboard?.writeText(window.location.href)}
            >
              <FaShareAlt size={13} aria-hidden="true" /> Chia sẻ
            </button>
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-[0.82rem] cursor-pointer bg-white transition-colors
                ${liked ? 'border-red-400 text-red-500 hover:border-red-500' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
            >
              {liked ? <FaHeart size={13} aria-hidden="true" /> : <FaRegHeart size={13} aria-hidden="true" />}
              {liked ? 'Đã yêu thích' : 'Yêu thích'}
            </button>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <h1 className="text-2xl font-extrabold text-gray-900">{car.name}</h1>

            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-[0.85rem] text-primary font-medium">
                <FaMapMarkerAlt size={12} aria-hidden="true" /> {car.address || car.location || 'Chưa có địa chỉ'}
              </span>
              {car.showroom && (
                <span className="flex items-center gap-1 text-[0.82rem] text-gray-500">
                  <FaStore size={12} className="text-gray-400" aria-hidden="true" /> {car.showroom}
                </span>
              )}
              <StarRow rating={avgRating} count={tripCount} />
              <span className="flex items-center gap-1 text-primary font-semibold text-[0.85rem]">
                <MdVerified size={15} aria-hidden="true" /> {car.type || car.category}
              </span>
            </div>

            {/* Specs */}
            <div>
              <div className={sectionTitle}>Thông số kỹ thuật</div>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <SpecItem icon={<MdPeople size={18} />} label="Số chỗ" value={`${car.seats || 5} chỗ ngồi`} />
                <SpecItem icon={<MdSettings size={18} />} label="Hộp số" value={car.transmission || 'Số tự động'} />
                <SpecItem
                  icon={car.fuel === 'Điện' ? <BsLightningChargeFill size={16} color="#2196f3" /> : <FaGasPump size={16} />}
                  label="Nhiên liệu"
                  value={car.fuel || 'Xăng'}
                />
                <SpecItem icon={<MdDirectionsCar size={18} />} label="Loại xe" value={car.category || car.type || 'Sedan'} />
              </div>
            </div>

            {/* Map — MapView embed + style MapPage.css (cùng /map) */}
            {(car.address || car.location || isMongoId(id)) && (
              <div>
                <div className={sectionTitle}>Vị trí nhận xe</div>
                <div className="clm-root">
                  <div className="clm-address-bar">
                    <span className="clm-address-icon">📍</span>
                    <span className="clm-address-text">
                      {coordsLoading
                        ? 'Đang tải vị trí…'
                        : coordsError
                          ? car.address || car.location || '—'
                          : resolvedAddress || car.address || car.location || '—'}
                    </span>
                    <a href={googleMapsHref} target="_blank" rel="noreferrer" className="clm-open-maps-btn">
                      Mở trong Maps ↗
                    </a>
                  </div>
                  <div className="map-page-map-container car-detail-map-wrap relative min-h-[280px]">
                    {coordsLoading && (
                      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-white/90 rounded-xl">
                        <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-2" />
                        <p className="text-[0.82rem] text-gray-500">Đang tải bản đồ…</p>
                      </div>
                    )}
                    {!coordsLoading && coordsError && (
                      <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
                        <span className="text-2xl mb-2">⚠️</span>
                        <p className="text-[0.85rem] text-gray-600">{coordsError}</p>
                      </div>
                    )}
                    {!coordsLoading && !coordsError && pickupCoords && mapCarsForView.length > 0 && (
                      <MapView embed height="340px" cars={mapCarsForView} />
                    )}
                    {!coordsLoading && !coordsError && !pickupCoords && (car.address || car.location) && (
                      <div className="flex items-center justify-center min-h-[120px] bg-gray-50 rounded-xl text-[0.82rem] text-gray-500">
                        Không xác định được tọa độ từ địa chỉ.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {car.description && (
              <div>
                <div className={sectionTitle}>Mô tả xe</div>
                <p className="text-[0.875rem] text-gray-600 leading-[1.8]">{car.description}</p>
              </div>
            )}

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
              <MdShield size={20} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-bold text-[0.85rem] text-gray-800 mb-1">Bảo hiểm toàn diện</div>
                <div className="text-[0.78rem] text-gray-500">Xe được bảo hiểm tai nạn toàn diện trong suốt chuyến đi. Mức bồi thường lên đến 1 tỷ đồng.</div>
              </div>
            </div>

            {/* Reviews section */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="text-[0.9rem] font-bold text-gray-800">
                  Đánh giá {reviewsMeta.total > 0 && <span className="tabular-nums">({reviewsMeta.total})</span>}
                </span>
                {user && isMongoId(id) && (
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(p => !p)}
                    className="text-[0.8rem] text-primary font-semibold hover:underline"
                  >
                    {showReviewForm ? 'Hủy' : '+ Viết đánh giá'}
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-3 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.82rem] text-gray-600 font-medium">Điểm:</span>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n} sao`}
                        onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      >
                        <FaStar size={20} color={n <= reviewForm.rating ? '#f59e0b' : '#e5e7eb'} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Nhận xét của bạn…"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[0.85rem] outline-none focus:border-primary resize-none"
                  />
                  {reviewError && <p className="text-red-500 text-[0.8rem]">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="self-end px-5 py-2 bg-primary text-white rounded-lg text-[0.85rem] font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {reviewSubmitting ? 'Đang gửi…' : 'Gửi đánh giá'}
                  </button>
                </form>
              )}

              {reviewsLoading && <p className="text-gray-400 text-[0.82rem] py-2">Đang tải đánh giá…</p>}

              {!reviewsLoading && reviews.length === 0 && (
                <p className="text-gray-400 text-[0.82rem] py-2">Chưa có đánh giá nào.</p>
              )}

              {reviews.map(r => (
                <div key={r._id} className="border-b border-gray-100 py-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[0.75rem] font-bold shrink-0">
                      {(r.user?.name || 'U')[0]}
                    </div>
                    <span className="text-[0.85rem] font-semibold text-gray-800">{r.user?.name || 'Ẩn danh'}</span>
                    <StarRow rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-[0.82rem] text-gray-600 ml-9">{r.comment}</p>}
                </div>
              ))}
            </div>

            {/* Terms */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="font-bold text-[0.88rem] text-gray-800 mb-2">Điều khoản</div>
              <div className="text-[0.8rem] text-gray-600 leading-[1.8] flex flex-col gap-0.5">
                {[
                  'Sử dụng xe đúng mục đích.',
                  'Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.',
                  'Không sử dụng xe thuê để cầm cố, thế chấp.',
                  'Không hút thuốc, nhả kẹo cao su, xả rác trong xe.',
                  'Không chở hàng quốc cấm dễ cháy nổ.',
                  'Trân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !',
                ].map((t, i) => <p key={i}>– {t}</p>)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking card */}
        <div className="sticky top-[76px]">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[1.8rem] font-extrabold text-primary tabular-nums">
                {car.price ? car.price.toLocaleString() : '—'}
                {car.currency === 'VND' ? 'đ' : car.currency || 'K'}
              </span>
              <span className="text-[0.9rem] text-gray-500">/{car.chargeUnit === 'day' ? 'ngày' : car.chargeUnit}</span>
            </div>
            <div className="h-px bg-gray-100 my-4" />

            {[
              { label: 'Thời gian nhận xe', id: 'pickup-time', def: '2026-04-02T15:00' },
              { label: 'Thời gian trả xe', id: 'return-time', def: '2026-04-04T19:00' },
            ].map(({ label, id: inputId, def }) => (
              <div key={inputId} className="mb-3">
                <label htmlFor={inputId} className="text-[0.78rem] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide block">{label}</label>
                <input id={inputId} type="datetime-local" className="w-full border-[1.5px] border-gray-200 rounded-lg px-3 py-2.5 text-[0.85rem] text-gray-800 outline-none focus:border-primary transition-colors" defaultValue={def} />
              </div>
            ))}

            <div className="h-px bg-gray-100 my-4" />

            <div className="flex flex-col gap-2 mb-4">
              {[
                [`${car.price ? car.price.toLocaleString() : 0} × 2 ngày`, `${car.price ? (car.price * 2).toLocaleString() : 0}`],
                ['Phí dịch vụ (5%)', `${car.price ? Math.round(car.price * 2 * 0.05).toLocaleString() : 0}`],
                ['Bảo hiểm', 'Miễn phí'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-[0.83rem] text-gray-600">
                  <span>{label}</span>
                  <span className="font-semibold text-gray-800 tabular-nums">{val}</span>
                </div>
              ))}
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between font-extrabold text-[0.95rem] text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-primary tabular-nums">
                  {car.price ? (car.price * 2 + Math.round(car.price * 2 * 0.05)).toLocaleString() : 0}
                  {car.currency === 'VND' ? 'đ' : 'K'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBookNow}
              className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl text-[0.95rem] tracking-wide transition-[transform,box-shadow,background-color] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,177,79,0.35)]"
            >
              Đặt xe ngay
            </button>
            <div className="text-center text-[0.75rem] text-gray-400 mt-3">Miễn phí hủy trước 1 giờ · Thanh toán sau</div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shrink-0">
                {car.showroom ? car.showroom[0] : 'C'}
              </div>
              <div>
                <div className="text-[0.85rem] font-semibold text-gray-800">{car.showroom || 'Chủ xe SmartRent'}</div>
                <div className="text-[0.75rem] text-gray-400">⭐ <span className="tabular-nums">{avgRating}</span> · Phản hồi trong 5 phút</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;
