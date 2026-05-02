import { sanitizeImageList } from './media';
import { canReviewBooking, resolveBookingVehicleId } from './bookingReviewEligibility';
import {
  CANCELLABLE_STATUSES,
  getBookingFlowState,
  getBookingPaymentStatus,
} from './bookingFlowState';
import { getRentalWorkflow } from './rentalWorkflowStorage';

export const PAYMENT_LABELS = {
  pending: 'Cho thanh toan',
  successful: 'Thanh cong',
  refunded: 'Da hoan tra',
  declined: 'Bi tu choi',
  failed: 'That bai',
};

const RETRY_PAYMENT_BOOKING_STATUSES = ['pending', 'waiting_payment'];

export const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
};

export const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const getDurationDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / 86400000));
};

const getLocationLabel = (note) => {
  const rawNote = String(note || '').trim();
  if (!rawNote) return 'Tu den lay';
  return rawNote;
};

const getCoordinationMeta = (booking, flowState, paymentStatus) => {
  const startLabel = flowState.hasStarted ? 'Da den gio nhan xe' : 'Chua den gio nhan xe';

  if (flowState.isAwaitingPayment) {
    const needsRetry = ['failed', 'declined'].includes(paymentStatus);
    return {
      headline: needsRetry ? 'Cho ban thanh toan lai' : 'Cho ban thanh toan',
      waitingFor: needsRetry
        ? 'He thong dang cho ban tao lai va hoan tat phien thanh toan.'
        : 'He thong dang cho ban hoan tat thanh toan cho booking nay.',
      owner: 'Ben can xu ly: Ban',
      nextStep: 'Sau khi thanh toan thanh cong, booking se chuyen sang Cho showroom xu ly.',
      renterAction: needsRetry ? 'Thanh toan lai de tiep tuc quy trinh dat xe.' : 'Hoan tat thanh toan de showroom tiep tuc xu ly.',
      menuKey: 'pending-payments',
    };
  }

  if (flowState.isAwaitingShowroomProcessing) {
    const isConfirmed = booking.status === 'confirmed';
    return {
      headline: isConfirmed ? 'Cho showroom chuan bi ban giao' : 'Cho showroom xac nhan',
      waitingFor: isConfirmed
        ? 'Dang cho showroom chuan bi xe va chuyen booking sang buoc Cho ban giao.'
        : 'Dang cho showroom tiep nhan booking da thanh toan va xac nhan xu ly.',
      owner: 'Ben can xu ly: Showroom',
      nextStep: 'Khi showroom chuyen booking sang Cho ban giao, ban se thay o menu Cho nhan xe.',
      renterAction: 'Theo doi cap nhat tu showroom hoac lien he neu can.',
      menuKey: 'pending-showroom-processing',
    };
  }

  if (flowState.isAwaitingPickup) {
    return {
      headline: 'Cho showroom hoan tat ban giao',
      waitingFor: `Booking da o muc Cho ban giao. ${startLabel}. Showroom can hoan tat buoc ban giao tren he thong truoc khi booking duoc chuyen vao Chuyen di cua toi.`,
      owner: 'Ben can xu ly: Showroom',
      nextStep: 'Khi showroom cap nhat da ban giao, booking se roi khoi menu nay va chuyen vao Chuyen di cua toi.',
      renterAction: 'Den diem giao nhan dung hen, kiem tra xe va lien he showroom neu can bo sung thong tin ban giao.',
      menuKey: 'pending-pickups',
    };
  }

  if (booking.status === 'waiting_return_confirmation') {
    return {
      headline: 'Cho showroom xac nhan da tra xe',
      waitingFor: 'Ban da gui yeu cau tra xe. Dang cho showroom doi chieu anh va xac nhan hoan tat.',
      owner: 'Ben can xu ly: Showroom',
      nextStep: 'Sau khi showroom xac nhan, booking se chuyen sang Hoan thanh.',
      renterAction: 'Theo doi cap nhat hoan tat hoac lien he showroom neu can.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isActive) {
    return {
      headline: flowState.hasEnded ? 'Den han tra xe' : 'Dang trong thoi gian thue',
      waitingFor: flowState.hasEnded
        ? 'He thong dang cho ban mo quy trinh tra xe va luu bo ho so doi chieu.'
        : 'Booking dang o giai doan thue xe. Ban chu dong su dung xe va bao su co neu can.',
      owner: 'Ben can xu ly: Ban',
      nextStep: flowState.hasEnded
        ? 'Mo Nhan / Tra xe de upload anh tra xe va luu bo ho so doi chieu cho showroom.'
        : 'Khi den han, ban se mo Nhan / Tra xe de thuc hien buoc tra xe.',
      renterAction: flowState.hasEnded ? 'Luu bien ban va bo anh tra xe, sau do lien he showroom xac nhan.' : 'Theo doi han thue va giu xe dung hien trang.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isCompleted) {
    return {
      headline: 'Da hoan thanh',
      waitingFor: 'Booking nay da khop quy trinh tra xe va khong con buoc nao dang cho xu ly.',
      owner: 'Trang thai: Hoan tat',
      nextStep: 'Ban co the xem bien ban, bao cao AI local va danh gia xe neu du dieu kien.',
      renterAction: 'Kiem tra lai lich su hoac de lai danh gia.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isCancelled) {
    return {
      headline: 'Da huy booking',
      waitingFor: 'Booking nay khong con tiep tuc trong quy trinh dat xe hien tai.',
      owner: 'Trang thai: Da huy',
      nextStep: paymentStatus === 'refunded'
        ? 'Khoan hoan tra da duoc ghi nhan trong lich su giao dich.'
        : 'Neu can dat lai xe, ban co the tao booking moi.',
      renterAction: 'Kiem tra lich su giao dich neu can doi chieu thanh toan.',
      menuKey: 'bookings',
    };
  }

  return {
    headline: 'Dang xu ly booking',
    waitingFor: 'Booking dang duoc he thong theo doi theo trang thai hien tai.',
    owner: 'Ben can xu ly: Dang cap nhat',
    nextStep: 'Theo doi tiep cap nhat tren tung menu cua renter.',
    renterAction: 'Kiem tra chi tiet booking neu can.',
    menuKey: 'bookings',
  };
};

export const mapRenterBooking = (booking) => {
  const images = sanitizeImageList([
    ...(booking.vehicle?.images || []),
    ...(booking.vehicle_id?.vehicle_images_paths || []),
    ...(booking.vehicle_id?.images || []),
  ]);

  const paymentStatus = getBookingPaymentStatus(booking);
  const flowState = getBookingFlowState(booking, paymentStatus);
  const workflow = getRentalWorkflow(booking._id);
  const coordination = getCoordinationMeta(booking, flowState, paymentStatus);

  return {
    id: booking._id,
    vehicleId: resolveBookingVehicleId(booking),
    vehicleName: booking.vehicle?.name || booking.vehicle_id?.vehicle_name || 'Xe khong ten',
    showroomName: booking.showroom?.name || booking.showroom_id?.name || 'SmartRent',
    showroomEmail: booking.showroom?.email || booking.showroom_id?.email || '',
    startDate: booking.start_date,
    endDate: booking.end_date,
    durationDays: getDurationDays(booking.start_date, booking.end_date),
    locationLabel: getLocationLabel(booking.note),
    status: booking.status,
    totalPrice: booking.total_price,
    note: booking.note || '',
    image: images[0] || '',
    paymentStatus,
    paymentMethod: booking.payment?.payment_method || 'Chua co',
    paymentRecord: booking.payment || null,
    canRetryPayment:
      RETRY_PAYMENT_BOOKING_STATUSES.includes(booking.status)
      && ['pending', 'failed', 'declined'].includes(paymentStatus),
    canCancel: CANCELLABLE_STATUSES.includes(booking.status),
    canReviewVehicle: canReviewBooking(booking),
    canConfirmPickup: flowState.canConfirmPickup,
    canOpenRentalFlow: flowState.canOpenRentalFlow,
    canReportIssue: flowState.isActive,
    hasRentalEnded: flowState.hasEnded,
    hasRentalStarted: flowState.hasStarted,
    isActive: flowState.isActive,
    isAwaitingPayment: flowState.isAwaitingPayment,
    isAwaitingShowroomProcessing: flowState.isAwaitingShowroomProcessing,
    isAwaitingPickup: flowState.isAwaitingPickup,
    isCancelled: flowState.isCancelled,
    isCompleted: flowState.isCompleted,
    isUpcoming: flowState.isUpcoming,
    hasAiInspectionReport: Boolean(workflow.aiInspection?.result),
    pickupConfirmationHint: flowState.pickupConfirmationHint,
    rentalAccessHint: flowState.rentalAccessHint,
    rentalActionLabel: flowState.rentalActionLabel || 'Nhan / Tra xe',
    statusHeadline: coordination.headline,
    waitingForLabel: coordination.waitingFor,
    waitingOwnerLabel: coordination.owner,
    nextStepLabel: coordination.nextStep,
    renterActionHint: coordination.renterAction,
    menuKey: coordination.menuKey,
    workflow,
    raw: booking,
  };
};
