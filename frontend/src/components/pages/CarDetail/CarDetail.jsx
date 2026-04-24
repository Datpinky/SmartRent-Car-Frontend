import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaStar,
  FaMapMarkerAlt,
  FaGasPump,
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaChevronLeft,
  FaChevronRight,
  FaStore,
} from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar, MdVerified, MdShield } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';
import CarLocationMap from '../../Map/CarLocationMap';
import Modal from '../../common/Modal';
import bookingService from '../../../services/bookingService';
import vehicleService from '../../../services/vehicleService';
import vehicleLocationService from '../../../services/vehicleLocationService';
import reviewService from '../../../services/reviewService';
import favoriteService from '../../../services/favoriteService';
import { useAuth } from '../../../contexts/AuthContext';
import { canReviewBooking, resolveBookingVehicleId } from '../../../utils/bookingReviewEligibility';
import { buildRentalWindowQuery, resolveRentalWindow } from '../../../utils/rentalWindow';

const ROLE_DEFAULT_PATHS = {
  admin: '/admin/dashboard',
  showroom: '/showroom/dashboard',
  owner: '/owner/dashboard',
  renter: '/renter/profile',
};

const SpecItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary"
      aria-hidden="true"
    >
      {icon}
    </div>
    <div>
      <div className="text-[0.72rem] font-medium uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-[0.9rem] font-semibold text-gray-800">{value}</div>
    </div>
  </div>
);

const sectionTitle = 'text-[0.9rem] font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100';

const StarRow = ({ rating, count }) => (
  <span className="flex items-center gap-1 text-[0.85rem]">
    {[1, 2, 3, 4, 5].map((index) => (
      <FaStar
        key={index}
        size={13}
        color={index <= Math.round(Number(rating || 0)) ? '#f59e0b' : '#e5e7eb'}
        aria-hidden="true"
      />
    ))}
    <strong className="ml-1 tabular-nums">{rating}</strong>
    {count !== undefined && <span className="tabular-nums text-gray-400">({count} đánh giá)</span>}
  </span>
);

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

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

const BookingCard = ({ car, id, avgRating, navigate, user, initialRentalWindow }) => {
  const initialPickup = initialRentalWindow?.pickupDate || createDefaultPickup();
  const initialReturn = initialRentalWindow?.returnDate || createDefaultReturn();
  const [pickupDate, setPickupDate] = useState(initialPickup);
  const [returnDate, setReturnDate] = useState(initialReturn);

  useEffect(() => {
    setPickupDate(initialPickup);
    setReturnDate(initialReturn);
  }, [initialPickup, initialReturn]);

  const days = useMemo(
    () =>
      Math.max(
        1,
        Math.round((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86_400_000)
      ),
    [pickupDate, returnDate]
  );

  const unitPrice = Number(car.price || 0);
  const subtotal = unitPrice * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;
  const currency = car.currency === 'VND' ? 'đ' : car.currency || '';
  const isRenter = user?.role === 'renter';
  const roleRedirect = ROLE_DEFAULT_PATHS[user?.role] || '/';

  const handleBook = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isRenter) {
      navigate(roleRedirect, { replace: true });
      return;
    }

    const vehicleId = car._id || car.id || id;

    navigate(`/renter/checkout/${id}${buildRentalWindowQuery(pickupDate, returnDate)}`, {
      state: {
        car: {
          ...car,
          id: vehicleId,
          _id: vehicleId,
        },
        pickupDate,
        returnDate,
        rentalSearch: {
          pickupDate,
          returnDate,
        },
      },
    });
  };

  return (
    <div className="sticky top-[76px]">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-[1.8rem] font-extrabold text-primary">
            {unitPrice ? unitPrice.toLocaleString('vi-VN') : '—'}
            {currency}
          </span>
          <span className="text-[0.9rem] text-gray-500">/ngày</span>
        </div>
        <div className="mb-3 text-[0.72rem] italic text-gray-400">Giá tạm tính chưa bao gồm VAT</div>
        <div className="mb-4 h-px bg-gray-100" />

        {[
          { label: 'Thời gian nhận xe', value: pickupDate, onChange: setPickupDate },
          { label: 'Thời gian trả xe', value: returnDate, onChange: setReturnDate },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="mb-3">
            <div className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </div>
            <input
              type="datetime-local"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-[0.85rem] text-gray-800 outline-none transition-colors focus:border-primary"
            />
          </div>
        ))}

        <div className="my-3 h-px bg-gray-100" />

        <div className="mb-4 flex flex-col gap-2">
          {[
            [
              `${unitPrice.toLocaleString('vi-VN')}${currency} × ${days} ngày`,
              `${subtotal.toLocaleString('vi-VN')}${currency}`,
            ],
            ['Phí dịch vụ (5%)', `${serviceFee.toLocaleString('vi-VN')}${currency}`],
            ['Bảo hiểm', 'Miễn phí'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-[0.83rem] text-gray-600">
              <span>{label}</span>
              <span className="font-semibold text-gray-800">{value}</span>
            </div>
          ))}
          <div className="my-1 h-px bg-gray-100" />
          <div className="flex justify-between text-[0.95rem] font-extrabold text-gray-900">
            <span>Tổng cộng</span>
            <span className="text-primary">
              {total.toLocaleString('vi-VN')}
              {currency}
            </span>
          </div>
        </div>

        <button
          id="btn-book-car"
          type="button"
          onClick={handleBook}
          className="w-full rounded-xl bg-gradient-to-br from-primary to-primary-dark py-3.5 text-[0.95rem] font-bold tracking-wide text-white transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,177,79,0.35)] active:scale-[0.98]"
        >
          {isRenter || !user ? 'Đặt xe ngay' : 'Đi đến trang quản lý'}
        </button>
        <div className="mt-3 text-center text-[0.75rem] text-gray-400">
          {user && !isRenter
            ? 'Tài khoản hiện tại không thể tạo booking theo luồng khách thuê.'
            : 'Miễn phí hủy trước 1 giờ · Thanh toán an toàn'}
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
            {car.showroom ? car.showroom[0] : 'C'}
          </div>
          <div>
            <div className="text-[0.85rem] font-semibold text-gray-800">
              {car.showroom || 'Chủ xe SmartRent'}
            </div>
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
  const location = useLocation();
  const { user } = useAuth();
  const initialRentalWindow = useMemo(
    () => resolveRentalWindow({ state: location.state, search: location.search }),
    [location.search, location.state]
  );

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({ total: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState('');
  const [reviewAccessLoading, setReviewAccessLoading] = useState(false);
  const [reviewAccess, setReviewAccess] = useState({ canReview: false, eligibleBookings: 0 });
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
    } catch (error) {
      console.error('Error loading car:', error.message);
      setCar(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!isMongoId(id)) {
      setReviews([]);
      setReviewsMeta({ total: 0 });
      return;
    }

    setReviewsLoading(true);
    try {
      const response = await reviewService.getByVehicleId(id);
      setReviews(response.data || []);
      setReviewsMeta(response.pagination || { total: 0 });
    } catch {
      setReviews([]);
      setReviewsMeta({ total: 0 });
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

  const loadReviewAccess = useCallback(async () => {
    if (user?.role !== 'renter' || !isMongoId(id)) {
      setReviewAccess({ canReview: false, eligibleBookings: 0 });
      setReviewAccessLoading(false);
      return;
    }

    setReviewAccessLoading(true);
    try {
      const myBookings = await bookingService.getMyBookings();
      const eligibleBookings = (myBookings || []).filter(
        (booking) => resolveBookingVehicleId(booking) === id && canReviewBooking(booking)
      );

      setReviewAccess({
        canReview: eligibleBookings.length > 0,
        eligibleBookings: eligibleBookings.length,
      });
    } catch {
      setReviewAccess({ canReview: false, eligibleBookings: 0 });
    } finally {
      setReviewAccessLoading(false);
    }
  }, [id, user?.role]);

  useEffect(() => {
    loadCar();
    loadReviews();
    loadVehicleLocation();
    loadReviewAccess();
  }, [loadCar, loadReviews, loadVehicleLocation, loadReviewAccess]);

  useEffect(() => {
    setActiveImageIndex(0);
    setGalleryOpen(false);
    setBrokenImages({});
    setImgError(false);
  }, [car?._id, car?.id]);

  const handleToggleFavorite = async (event) => {
    event.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isMongoId(id)) {
      setLiked((current) => !current);
      return;
    }

    setLikeLoading(true);
    try {
      const response = await favoriteService.toggle(id);
      setLiked(response.favorited);
    } catch {
      setLiked((current) => !current);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!canReviewThisVehicle) {
      setReviewError('Bạn chỉ có thể đánh giá sau khi hoàn tất ít nhất một booking cho chiếc xe này.');
      return;
    }

    setReviewError('');
    setReviewSubmitting(true);
    try {
      if (editingReviewId) {
        await reviewService.update({ review_id: editingReviewId, ...reviewForm });
      } else {
        await reviewService.create({ vehicle_id: id, ...reviewForm });
      }
      resetReviewComposer();
      await loadReviews();
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const carName = car?.name || '';
  const hue = Math.abs(carName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360;
  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : Number(car?.rating || 0).toFixed(1);
  const tripCount = reviewsMeta.total || car?.trips || 0;
  const vehicleAddress = vehicleLocation?.address?.trim() || '';
  const vehicleLat = Number(vehicleLocation?.latitude);
  const vehicleLng = Number(vehicleLocation?.longitude);
  const hasVehicleMapData = Boolean(
    vehicleAddress && Number.isFinite(vehicleLat) && Number.isFinite(vehicleLng)
  );
  const displayAddress =
    vehicleAddress || car?.pickupAddress || car?.address || car?.location || 'Chưa có địa chỉ';

  const galleryImages = useMemo(() => {
    const images = Array.isArray(car?.images) ? car.images.filter(Boolean) : [];
    return images.length > 0 ? images : car?.image ? [car.image] : [];
  }, [car?.image, car?.images]);

  const visibleGalleryImages = useMemo(
    () => galleryImages.filter((imageUrl) => !brokenImages[imageUrl]),
    [brokenImages, galleryImages]
  );

  const activeImage =
    visibleGalleryImages[activeImageIndex] || visibleGalleryImages[0] || '';

  const currentUserId = user?._id || user?.id || '';
  const canManageReviews = user?.role === 'renter' && isMongoId(id);
  const canReviewThisVehicle = canManageReviews && reviewAccess.canReview;
  const hasReviews = reviews.length > 0;
  const isEditingReview = Boolean(editingReviewId);

  const getReviewUserId = useCallback((review) => {
    const reviewUser = review?.user;
    if (!reviewUser) {
      return '';
    }

    if (typeof reviewUser === 'string') {
      return reviewUser;
    }

    return reviewUser._id || reviewUser.id || '';
  }, []);

  const isOwnReview = useCallback(
    (review) => Boolean(currentUserId) && getReviewUserId(review) === currentUserId,
    [currentUserId, getReviewUserId]
  );

  const resetReviewComposer = useCallback(() => {
    setShowReviewForm(false);
    setEditingReviewId('');
    setReviewForm({ rating: 5, comment: '' });
    setReviewError('');
  }, []);

  const openCreateReviewForm = useCallback(() => {
    setReviewError('');
    setEditingReviewId('');
    setReviewForm({ rating: 5, comment: '' });
    setShowReviewForm((current) => (isEditingReview ? true : !current));
  }, [isEditingReview]);

  const openEditReviewForm = useCallback((review) => {
    setReviewError('');
    setEditingReviewId(review?._id || '');
    setReviewForm({
      rating: Number(review?.rating) || 5,
      comment: review?.comment || '',
    });
    setShowReviewForm(true);
  }, []);

  const formatReviewDate = useCallback((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('vi-VN');
  }, []);

  useEffect(() => {
    if (!location.state?.openReviewComposer || reviewAccessLoading) {
      return;
    }

    if (canReviewThisVehicle) {
      setShowReviewForm(true);
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [canReviewThisVehicle, location.pathname, location.state, navigate, reviewAccessLoading]);

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
      <div className="mx-auto max-w-[1280px] px-5 py-20 text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-gray-500">Đang tải thông tin xe...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="px-5 py-20 text-center">
        <div className="mb-4 text-[4rem]">🚗</div>
        <h2 className="mb-5 text-xl font-bold text-gray-800">Không tìm thấy xe</h2>
        <button
          type="button"
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
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
    <div className="mx-auto max-w-[1280px] px-5 py-6">
      <button
        type="button"
        className="mb-5 flex items-center gap-2 text-[0.82rem] font-medium text-gray-500 transition-colors hover:text-primary"
        onClick={() => navigate(-1)}
      >
        <FaChevronLeft size={12} aria-hidden="true" /> Quay lại danh sách xe
      </button>

      <div className="grid grid-cols-[1fr_360px] items-start gap-8 max-[900px]:grid-cols-1">
        <div>
          <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: '16/9' }}>
            {activeImage && !imgError ? (
              <img
                src={activeImage}
                alt={car.name}
                className="h-full w-full cursor-zoom-in object-cover"
                onClick={() =>
                  openGalleryAt(Math.min(activeImageIndex, Math.max(visibleGalleryImages.length - 1, 0)))
                }
                onError={() => {
                  markImageBroken(activeImage);
                  setImgError(true);
                }}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)`,
                }}
              >
                <MdDirectionsCar
                  style={{
                    fontSize: '8rem',
                    color: car.color || `hsl(${hue},40%,50%)`,
                    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))',
                    transform: 'scaleX(-1)',
                  }}
                />
              </div>
            )}

            {visibleGalleryImages.length > 1 && (
              <div className="absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1.5 text-[0.78rem] font-semibold text-white backdrop-blur-sm">
                {Math.min(activeImageIndex + 1, visibleGalleryImages.length)}/{visibleGalleryImages.length} ảnh
              </div>
            )}
          </div>

          {visibleGalleryImages.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3 max-[640px]:grid-cols-4 max-[480px]:grid-cols-3">
              {visibleGalleryImages.map((imageUrl, index) => {
                const isActiveImage = index === activeImageIndex;
                return (
                  <button
                    key={imageUrl}
                    type="button"
                    className={`overflow-hidden rounded-xl border-2 transition-all ${
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
                      className="h-full w-full object-cover"
                      onError={() => markImageBroken(imageUrl)}
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="mb-6 mt-3 flex gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-[0.82rem] text-gray-600 transition-colors hover:border-primary hover:text-primary"
              onClick={() =>
                navigator.share?.({ title: document.title, url: window.location.href })
                || navigator.clipboard?.writeText(window.location.href)
              }
            >
              <span className="inline-flex items-center gap-1.5">
                <FaShareAlt size={13} aria-hidden="true" /> Chia sẻ
              </span>
            </button>
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={likeLoading}
              className={`cursor-pointer rounded-full border bg-white px-4 py-2 text-[0.82rem] transition-colors ${
                liked
                  ? 'border-red-400 text-red-500 hover:border-red-500'
                  : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {liked ? <FaHeart size={13} aria-hidden="true" /> : <FaRegHeart size={13} aria-hidden="true" />}
                {liked ? 'Đã yêu thích' : 'Yêu thích'}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-extrabold text-gray-900">{car.name}</h1>

            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-[0.85rem] font-medium text-primary">
                <FaMapMarkerAlt size={12} aria-hidden="true" /> {displayAddress}
              </span>
              {car.showroom && (
                <span className="flex items-center gap-1 text-[0.82rem] text-gray-500">
                  <FaStore size={12} className="text-gray-400" aria-hidden="true" /> {car.showroom}
                </span>
              )}
              <StarRow rating={avgRating} count={tripCount} />
              <span className="flex items-center gap-1 text-[0.85rem] font-semibold text-primary">
                <MdVerified size={15} aria-hidden="true" /> {car.type || car.category}
              </span>
            </div>

            <div>
              <div className={sectionTitle}>Thông số kỹ thuật</div>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <SpecItem icon={<MdPeople size={18} />} label="Số chỗ" value={`${car.seats || 5} chỗ ngồi`} />
                <SpecItem icon={<MdSettings size={18} />} label="Hộp số" value={car.transmission || 'Số tự động'} />
                <SpecItem
                  icon={
                    car.fuel === 'Điện'
                      ? <BsLightningChargeFill size={16} color="#2196f3" />
                      : <FaGasPump size={16} />
                  }
                  label="Nhiên liệu"
                  value={car.fuel || 'Xăng'}
                />
                <SpecItem
                  icon={<MdDirectionsCar size={18} />}
                  label="Loại xe"
                  value={car.category || car.type || 'Sedan'}
                />
              </div>
            </div>

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
                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-5 text-center text-[0.82rem] text-gray-500">
                  {displayAddress === 'Chưa có địa chỉ'
                    ? 'Chủ xe chưa cập nhật vị trí nhận xe.'
                    : `Địa chỉ nhận xe: ${displayAddress}`}
                </div>
              )}
            </div>

            {car.description && (
              <div>
                <div className={sectionTitle}>Mô tả xe</div>
                <p className="text-[0.875rem] leading-[1.8] text-gray-600">{car.description}</p>
              </div>
            )}

            {Array.isArray(car.amenities) && car.amenities.length > 0 && (
              <div>
                <div className={sectionTitle}>Tiện nghi</div>
                <div className="flex flex-wrap gap-2">
                  {car.amenities.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full bg-primary-light px-3 py-1 text-[0.78rem] font-medium text-primary"
                    >
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <MdShield size={20} className="mt-0.5 shrink-0 text-gray-500" aria-hidden="true" />
              <div>
                <div className="mb-1 text-[0.85rem] font-bold text-gray-800">Bảo hiểm & trách nhiệm</div>
                <div className="text-[0.78rem] leading-relaxed text-gray-500">
                  Điều kiện bảo hiểm và mức khấu trừ theo hợp đồng thuê tại thời điểm đặt xe. Vui lòng đọc kỹ hợp đồng
                  và trao đổi với chủ xe nếu cần xác nhận thêm quyền lợi áp dụng cho chuyến đi.
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[0.9rem] font-bold text-gray-800">
                  Đánh giá {reviewsMeta.total > 0 && <span className="tabular-nums">({reviewsMeta.total})</span>}
                </span>
                {canReviewThisVehicle && (
                  <button
                    type="button"
                    onClick={openCreateReviewForm}
                    className="text-[0.8rem] font-semibold text-primary hover:underline"
                  >
                    {showReviewForm && !isEditingReview
                      ? 'Hủy'
                      : hasReviews
                        ? '+ Thêm đánh giá'
                        : '+ Viết đánh giá'}
                  </button>
                )}
              </div>

              {user && user.role !== 'renter' && isMongoId(id) && (
                <p className="mb-2 text-[0.78rem] text-gray-500">
                  Chỉ tài khoản <strong>khách thuê</strong> mới có thể gửi đánh giá.
                </p>
              )}

              {canManageReviews && reviewAccessLoading && (
                <p className="mb-3 text-[0.8rem] text-gray-400">Đang kiểm tra điều kiện đánh giá...</p>
              )}

              {canManageReviews && !reviewAccessLoading && !canReviewThisVehicle && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.8rem] leading-6 text-amber-800">
                  Bạn có thể xem đánh giá của những renter khác tại đây. Quyền viết đánh giá chỉ mở sau khi bạn hoàn tất
                  ít nhất một booking cho chiếc xe này.
                </div>
              )}

              {showReviewForm && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[0.86rem] font-bold text-gray-800">
                        {isEditingReview ? 'Chỉnh sửa đánh giá của bạn' : 'Chia sẻ cảm nhận về chiếc xe này'}
                      </div>
                      <div className="mt-1 text-[0.76rem] text-gray-500">
                        {isEditingReview
                          ? 'Cập nhật lại điểm số hoặc nhận xét để người thuê sau có thêm thông tin.'
                          : 'Đánh giá chất lượng xe, mức độ sạch sẽ và trải nghiệm thuê xe của bạn.'}
                      </div>
                    </div>

                    {isEditingReview && (
                      <button
                        type="button"
                        onClick={resetReviewComposer}
                        className="text-[0.78rem] font-semibold text-gray-500 transition-colors hover:text-primary"
                      >
                        Hủy sửa
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[0.82rem] font-medium text-gray-600">Điểm:</span>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} sao`}
                        onClick={() => setReviewForm((current) => ({ ...current, rating: value }))}
                      >
                        <FaStar
                          size={20}
                          color={value <= reviewForm.rating ? '#f59e0b' : '#e5e7eb'}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Nhận xét của bạn..."
                    value={reviewForm.comment}
                    onChange={(event) =>
                      setReviewForm((current) => ({ ...current, comment: event.target.value }))
                    }
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[0.85rem] outline-none focus:border-primary"
                  />
                  {reviewError && <p className="text-[0.8rem] text-red-500">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="self-end rounded-lg bg-primary px-5 py-2 text-[0.85rem] font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {reviewSubmitting
                      ? isEditingReview
                        ? 'Đang lưu...'
                        : 'Đang gửi...'
                      : isEditingReview
                        ? 'Lưu thay đổi'
                        : 'Gửi đánh giá'}
                  </button>
                </form>
              )}

              {reviewsLoading && <p className="py-2 text-[0.82rem] text-gray-400">Đang tải đánh giá...</p>}

              {!reviewsLoading && reviews.length === 0 && (
                <p className="py-2 text-[0.82rem] text-gray-400">Chưa có đánh giá nào.</p>
              )}

              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-100 py-3 last:border-0">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[0.75rem] font-bold text-white">
                        {(review.user?.name || 'U')[0]}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.85rem] font-semibold text-gray-800">
                            {review.user?.name || 'Ẩn danh'}
                          </span>
                          {isOwnReview(review) && (
                            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[0.68rem] font-semibold text-primary">
                              Đánh giá của bạn
                            </span>
                          )}
                          <StarRow rating={review.rating} />
                        </div>
                        {review.createdAt && (
                          <div className="mt-1 text-[0.72rem] text-gray-400">
                            {formatReviewDate(review.createdAt)}
                            {review.updatedAt && review.updatedAt !== review.createdAt ? ' · Đã chỉnh sửa' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {canReviewThisVehicle && isOwnReview(review) && (
                      <button
                        type="button"
                        onClick={() => openEditReviewForm(review)}
                        className="shrink-0 text-[0.76rem] font-semibold text-primary hover:underline"
                      >
                        Sửa
                      </button>
                    )}
                  </div>

                  <div className="ml-9">
                    {review.comment ? (
                      <p className="text-[0.82rem] text-gray-600">{review.comment}</p>
                    ) : (
                      <p className="text-[0.8rem] italic text-gray-400">
                        Người dùng chưa để lại nhận xét chi tiết.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 text-[0.88rem] font-bold text-gray-800">Điều khoản</div>
              <div className="flex flex-col gap-0.5 text-[0.8rem] leading-[1.8] text-gray-600">
                {[
                  'Sử dụng xe đúng mục đích.',
                  'Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.',
                  'Không sử dụng xe thuê để cầm cố, thế chấp.',
                  'Không hút thuốc, nhả kẹo cao su, xả rác trong xe.',
                  'Không chở hàng quốc cấm dễ cháy nổ.',
                  'Trân trọng cảm ơn, chúc quý khách hàng có những chuyến đi tuyệt vời !',
                ].map((term, index) => (
                  <p key={index}>– {term}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <BookingCard
          car={car}
          id={id}
          avgRating={avgRating}
          navigate={navigate}
          user={user}
          initialRentalWindow={initialRentalWindow}
        />
      </div>

      <Modal
        isOpen={galleryOpen && visibleGalleryImages.length > 0}
        onClose={() => setGalleryOpen(false)}
        title={`${car.name} - Thu vien anh`}
        width={980}
      >
        {visibleGalleryImages.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <img
                src={visibleGalleryImages[activeImageIndex] || visibleGalleryImages[0]}
                alt={`${car.name} ${activeImageIndex + 1}`}
                className="h-full w-full bg-black/95 object-contain"
                onError={() => markImageBroken(visibleGalleryImages[activeImageIndex])}
              />

              {visibleGalleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition-colors hover:bg-white"
                    onClick={() => moveGallery(-1)}
                  >
                    <FaChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition-colors hover:bg-white"
                    onClick={() => moveGallery(1)}
                  >
                    <FaChevronRight aria-hidden="true" />
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
                    className={`overflow-hidden rounded-xl border-2 transition-all ${
                      index === activeImageIndex ? 'border-primary' : 'border-gray-200 hover:border-primary/60'
                    }`}
                    style={{ aspectRatio: '4/3' }}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`${car.name} thumb ${index + 1}`}
                      className="h-full w-full object-cover"
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
