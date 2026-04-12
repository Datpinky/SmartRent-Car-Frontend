import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaGasPump, FaHeart, FaRegHeart, FaShareAlt, FaChevronLeft, FaChevronRight, FaStore } from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar, MdVerified, MdShield } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';
import CarLocationMap from '../../Map/CarLocationMap';
import Modal from '../../common/Modal';
import vehicleService from '../../../services/vehicleService';
import vehicleLocationService from '../../../services/vehicleLocationService';
import reviewService from '../../../services/reviewService';
import favoriteService from '../../../services/favoriteService';
import { useAuth } from '../../../contexts/AuthContext';

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

const StarRow = ({ rating, count }) => (
  <span className="flex items-center gap-1 text-[0.85rem]">
    {[1, 2, 3, 4, 5].map(i => (
      <FaStar key={i} size={13} color={i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'} />
    ))}
    <strong className="ml-1">{rating}</strong>
    {count !== undefined && <span className="text-gray-400">({count} đánh giá)</span>}
  </span>
);

const isMongoId = (str) => /^[a-f\d]{24}$/i.test(str);

/* ─── Booking sidebar card ──────────────────────────────────────────── */
const BookingCard = ({ car, id, avgRating, navigate, user }) => {
  const createDefaultPickup = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const createDefaultReturn = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(10, 0, 0, 0);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const defaultPickup = createDefaultPickup();
  const defaultReturn = createDefaultReturn();
  const [pickupDate, setPickupDate] = useState(defaultPickup);
  const [returnDate, setReturnDate] = useState(defaultReturn);

  const days = useMemo(() => Math.max(1,
    Math.round((new Date(returnDate) - new Date(pickupDate)) / 86_400_000)
  ), [pickupDate, returnDate]);

  const unitPrice = car.price || 0;
  const subtotal = unitPrice * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;
  const currency = car.currency === 'VND' ? 'đ' : 'K';

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/renter/checkout/${id}`, {
      state: {
        car: {
          ...car,
          id: car._id,
          _id: car._id,
        },
        pickupDate,
        returnDate,
      }
    });
  };

  return (
    <div className="sticky top-[76px]">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[1.8rem] font-extrabold text-primary">
            {unitPrice ? unitPrice.toLocaleString() : '—'}{currency}
          </span>
          <span className="text-[0.9rem] text-gray-500">/ngày</span>
        </div>
        <div className="text-[0.72rem] text-gray-400 italic mb-3">Giá tạm tính chưa bao gồm VAT</div>
        <div className="h-px bg-gray-100 mb-4" />

        {/* Date pickers */}
        {[
          { label: 'Thời gian nhận xe', value: pickupDate, onChange: setPickupDate },
          { label: 'Thời gian trả xe',  value: returnDate, onChange: setReturnDate },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="mb-3">
            <div className="text-[0.75rem] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</div>
            <input
              type="datetime-local"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full border-[1.5px] border-gray-200 rounded-lg px-3 py-2.5 text-[0.85rem] text-gray-800 outline-none focus:border-primary transition-colors"
            />
          </div>
        ))}

        <div className="h-px bg-gray-100 my-3" />

        {/* Price breakdown */}
        <div className="flex flex-col gap-2 mb-4">
          {[
            [`${unitPrice.toLocaleString()}${currency} × ${days} ngày`, `${subtotal.toLocaleString()}${currency}`],
            ['Phí dịch vụ (5%)', `${serviceFee.toLocaleString()}${currency}`],
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
            <span className="text-primary">{total.toLocaleString()}{currency}</span>
          </div>
        </div>

        {/* Book button */}
        <button
          id="btn-book-car"
          onClick={handleBook}
          className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl text-[0.95rem] tracking-wide transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,177,79,0.35)] active:scale-[0.98]"
        >
          🚗 Đặt xe ngay
        </button>
        <div className="text-center text-[0.75rem] text-gray-400 mt-3">Miễn phí hủy trước 1 giờ · Thanh toán an toàn</div>

        {/* Owner info */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shrink-0">
            {car.showroom ? car.showroom[0] : 'C'}
          </div>
          <div>
            <div className="text-[0.85rem] font-semibold text-gray-800">{car.showroom || 'Chủ xe SmartRent'}</div>
            <div className="text-[0.75rem] text-gray-400">⭐ {avgRating} · Phản hồi trong 5 phút</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({ total: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);

  // New review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState({});

  const loadCar = useCallback(async () => {
    setLoading(true);
    try {
      const apiCar = await vehicleService.getById(id);
      setCar(apiCar || null);
    } catch (err) {
      console.error('Error loading car:', err.message);
      setCar(null);
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

  const loadVehicleLocation = useCallback(async () => {
    if (!isMongoId(id) || !localStorage.getItem('smartrent_token')) {
      setVehicleLocation(null);
      return;
    }

    try {
      const locationData = await vehicleLocationService.getByVehicleId(id);
      setVehicleLocation(locationData || null);
    } catch {
      setVehicleLocation(null);
    }
  }, [id]);

  useEffect(() => {
    loadCar();
    loadReviews();
    loadVehicleLocation();
  }, [loadCar, loadReviews, loadVehicleLocation]);

  useEffect(() => {
    setActiveImageIndex(0);
    setGalleryOpen(false);
    setBrokenImages({});
    setImgError(false);
  }, [car?._id]);

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

  const carName = car?.name || '';
  const hue = Math.abs(carName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (car?.rating || 0);
  const tripCount = reviewsMeta.total || car?.trips || 0;
  const vehicleAddress = vehicleLocation?.address?.trim() || '';
  const vehicleLat = Number(vehicleLocation?.latitude);
  const vehicleLng = Number(vehicleLocation?.longitude);
  const hasVehicleMapData = Boolean(
    vehicleAddress &&
    Number.isFinite(vehicleLat) &&
    Number.isFinite(vehicleLng)
  );
  const displayAddress = vehicleAddress || car?.address || car?.location || 'Chua co dia chi';
  const galleryImages = useMemo(() => {
    const images = Array.isArray(car?.images) ? car.images.filter(Boolean) : [];
    if (images.length > 0) {
      return images;
    }
    return car?.image ? [car.image] : [];
  }, [car?.image, car?.images]);
  const visibleGalleryImages = useMemo(
    () => galleryImages.filter((imageUrl) => !brokenImages[imageUrl]),
    [brokenImages, galleryImages]
  );
  const activeImage =
    visibleGalleryImages[activeImageIndex]
    || visibleGalleryImages[0]
    || '';

  useEffect(() => {
    if (!visibleGalleryImages.length) {
      if (activeImageIndex !== 0) {
        setActiveImageIndex(0);
      }
      return;
    }

    if (activeImageIndex > visibleGalleryImages.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, visibleGalleryImages.length]);

  useEffect(() => {
    setImgError(false);
  }, [activeImageIndex, visibleGalleryImages.length]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 py-20 text-center">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Đang tải thông tin xe...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-20 px-5">
        <div className="text-[4rem] mb-4">🚗</div>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Không tìm thấy xe</h2>
        <button
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const markImageBroken = (imageUrl) => {
    if (!imageUrl) {
      return;
    }

    setBrokenImages((current) => {
      if (current[imageUrl]) {
        return current;
      }
      return { ...current, [imageUrl]: true };
    });
  };

  const openGalleryAt = (index) => {
    setActiveImageIndex(index);
    setGalleryOpen(true);
  };

  const moveGallery = (direction) => {
    if (visibleGalleryImages.length <= 1) {
      return;
    }

    setActiveImageIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0) {
        return visibleGalleryImages.length - 1;
      }
      if (nextIndex >= visibleGalleryImages.length) {
        return 0;
      }
      return nextIndex;
    });
  };

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
            {(activeImage && !imgError) ? (
              <img
                src={activeImage}
                alt={car.name}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => openGalleryAt(Math.min(activeImageIndex, Math.max(visibleGalleryImages.length - 1, 0)))}
                onError={() => {
                  markImageBroken(activeImage);
                  setImgError(true);
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)`,
                }}
              >
                <MdDirectionsCar style={{ fontSize: '8rem', color: car.color || `hsl(${hue},40%,50%)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))', transform: 'scaleX(-1)' }} />
              </div>
            )}

            {visibleGalleryImages.length > 1 && (
              <div className="absolute right-4 bottom-4 px-3 py-1.5 rounded-full bg-black/55 text-white text-[0.78rem] font-semibold backdrop-blur-sm">
                {Math.min(activeImageIndex + 1, visibleGalleryImages.length)}/{visibleGalleryImages.length} anh
              </div>
            )}
          </div>

          {visibleGalleryImages.length > 1 && (
            <div className="grid grid-cols-5 gap-3 mt-3 max-[640px]:grid-cols-4 max-[480px]:grid-cols-3">
              {visibleGalleryImages.map((imageUrl, index) => {
                const isActiveImage = index === activeImageIndex;
                return (
                  <button
                    key={imageUrl}
                    type="button"
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      isActiveImage
                        ? 'border-primary shadow-[0_8px_20px_rgba(0,177,79,0.18)]'
                        : 'border-gray-200 hover:border-primary/60'
                    }`}
                    style={{ aspectRatio: '4/3' }}
                    onClick={() => {
                      setImgError(false);
                      setActiveImageIndex(index);
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`${car.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => markImageBroken(imageUrl)}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-3 mb-6">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-[0.82rem] text-gray-600 cursor-pointer bg-white hover:border-primary hover:text-primary transition-colors">
              <FaShareAlt size={13} /> Chia sẻ
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-[0.82rem] cursor-pointer bg-white transition-colors
                ${liked ? 'border-red-400 text-red-500 hover:border-red-500' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
            >
              {liked ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
              {liked ? 'Đã yêu thích' : 'Yêu thích'}
            </button>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <h1 className="text-2xl font-extrabold text-gray-900">{car.name}</h1>

            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-[0.85rem] text-primary font-medium">
                <FaMapMarkerAlt size={12} /> {displayAddress}
              </span>
              {car.showroom && (
                <span className="flex items-center gap-1 text-[0.82rem] text-gray-500">
                  <FaStore size={12} className="text-gray-400" /> {car.showroom}
                </span>
              )}
              <StarRow rating={avgRating} count={tripCount} />
              <span className="flex items-center gap-1 text-primary font-semibold text-[0.85rem]">
                <MdVerified size={15} /> {car.type || car.category}
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

            {/* Map */}
            <div>
              <div className={sectionTitle}>Vị trí nhận xe</div>
              {hasVehicleMapData ? (
                <CarLocationMap
                  locationText={vehicleAddress}
                  lat={vehicleLat}
                  lng={vehicleLng}
                  plusCode={vehicleLocation?.plusCode}
                  city=""
                />
              ) : (
                <div className="h-[340px] rounded-2xl border border-gray-200 bg-white" />
              )}
            </div>

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
              <MdShield size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[0.85rem] text-gray-800 mb-1">Bảo hiểm toàn diện</div>
                <div className="text-[0.78rem] text-gray-500">Xe được bảo hiểm tai nạn toàn diện trong suốt chuyến đi. Mức bồi thường lên đến 1 tỷ đồng.</div>
              </div>
            </div>

            {/* Reviews section */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="text-[0.9rem] font-bold text-gray-800">
                  Đánh giá {reviewsMeta.total > 0 && `(${reviewsMeta.total})`}
                </span>
                {user && isMongoId(id) && (
                  <button
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
                        onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      >
                        <FaStar size={20} color={n <= reviewForm.rating ? '#f59e0b' : '#e5e7eb'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Nhận xét của bạn..."
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
                    {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </form>
              )}

              {reviewsLoading && <p className="text-gray-400 text-[0.82rem] py-2">Đang tải đánh giá...</p>}

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
        <BookingCard car={car} id={id} avgRating={avgRating} navigate={navigate} user={user} />
      </div>

      <Modal
        isOpen={galleryOpen && visibleGalleryImages.length > 0}
        onClose={() => setGalleryOpen(false)}
        title={`${car.name} - Thu vien anh`}
        width={980}
      >
        {visibleGalleryImages.length > 0 && (
          <div className="flex flex-col gap-4">
            <div
              className="relative rounded-2xl overflow-hidden bg-gray-100"
              style={{ aspectRatio: '16/9' }}
            >
              <img
                src={visibleGalleryImages[activeImageIndex] || visibleGalleryImages[0]}
                alt={`${car.name} ${activeImageIndex + 1}`}
                className="w-full h-full object-contain bg-black/95"
                onError={() => markImageBroken(visibleGalleryImages[activeImageIndex])}
              />

              {visibleGalleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    onClick={() => moveGallery(-1)}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    onClick={() => moveGallery(1)}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>

            {visibleGalleryImages.length > 1 && (
              <div className="grid grid-cols-6 gap-3 max-[900px]:grid-cols-4 max-[560px]:grid-cols-3">
                {visibleGalleryImages.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      index === activeImageIndex ? 'border-primary' : 'border-gray-200 hover:border-primary/60'
                    }`}
                    style={{ aspectRatio: '4/3' }}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`${car.name} thumb ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => markImageBroken(imageUrl)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CarDetail;
