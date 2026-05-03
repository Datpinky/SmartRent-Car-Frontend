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
  const startLabel = flowState.hasStarted ? 'Đã đến giờ thuê xe' : 'Chưa đến giờ thuê xe';

  if (flowState.isAwaitingPayment) {
    const needsRetry = ['failed', 'declined'].includes(paymentStatus);
    return {
      headline: needsRetry ? 'Chờ thanh toán lại' : 'Chờ thanh toán',
      waitingFor: needsRetry
        ? 'Hệ thống đang cho bạn tạo lại và hoàn tất phiên thanh toán.'
        : 'Hệ thống đang cho bạn hoàn tất thanh toán cho booking này.',
      owner: 'Bên cần xử lý: Bạn',
      nextStep: 'Sau khi thanh toán thành công, booking sẽ chuyển sang Chờ showroom xử lý.',
      renterAction: needsRetry ? 'Thanh toán lại để tiếp tục quy trình đặt xe.' : 'Hoàn tất thanh toán để showroom tiếp tục xử lý.',
      menuKey: 'pending-payments',
    };
  }

  if (flowState.isAwaitingShowroomProcessing) {
    const isConfirmed = booking.status === 'confirmed';
    return {
      headline: isConfirmed ? 'Chờ showroom chuẩn bị giao xe' : 'Chờ showroom xác nhận',
      waitingFor: isConfirmed
        ? 'Đang cho showroom chuẩn bị xe và chuyển booking sang bước Chờ giao xe.'
        : 'Đang cho showroom tiếp nhận booking đã thanh toán và xác nhận xử lý.',
      owner: 'Bên cần xử lý: Showroom',
      nextStep: 'Khi showroom chuyển booking sang Chờ giao xe, bạn sẽ thấy ở menu Chờ nhận xe.',
      renterAction: 'Theo dõi cập nhật từ showroom hoặc liên hệ nếu cần.',
      menuKey: 'pending-showroom-processing',
    };
  }

  if (flowState.isAwaitingPickup) {
    return {
      headline: 'Chờ showroom hoàn tất giao xe',
      waitingFor: `Booking đã ở mục Chờ giao xe. ${startLabel}. Showroom cần hoàn tất bước giao xe trên hệ thống trước khi booking được chuyển vào Chuyển đi của bạn.`,
      owner: 'Bên cần xử lý: Showroom',
      nextStep: 'Khi showroom cập nhật đã giao xe, booking sẽ rời khỏi menu này và chuyển vào Chuyển đi của bạn.',
      renterAction: 'Đến điểm giao nhận đúng hẹn, kiểm tra xe và liên hệ showroom nếu cần bổ sung thông tin giao xe.',
      menuKey: 'pending-pickups',
    };
  }

  if (booking.status === 'waiting_return_confirmation') {
    return {
      headline: 'Chờ showroom xác nhận đã trả xe',
      waitingFor: 'Bạn đã gửi yêu cầu trả xe. Đang cho showroom đối chỉnh ảnh và xác nhận hoàn tất.',
      owner: 'Bên cần xử lý: Showroom',
      nextStep: 'Sau khi showroom xác nhận, booking sẽ chuyển sang Hoàn thành.',
      renterAction: 'Theo dõi cập nhật hoàn tất hoặc liên hệ showroom nếu cần.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isActive) {
    return {
      headline: flowState.hasEnded ? 'Đến hẹn trả xe' : 'Đang trong thời gian thuê xe',
      waitingFor: flowState.hasEnded
        ? 'Hệ thống đang cho bạn mở quy trình trả xe và lưu bộ hồ sơ đối chỉnh.'
        : 'Booking đang ở giai đoạn thuê xe. Bạn chủ động sử dụng xe và bảo sử của bạn.',
      owner: 'Bên cần xử lý: Bạn',
      nextStep: flowState.hasEnded
        ? 'Mở Nhận / Trả xe để upload ảnh trả xe và lưu bộ hồ sơ đối chỉnh cho showroom.'
        : 'Khi đến hẹn, bạn sẽ mở Nhận / Trả xe để thực hiện bước trả xe.',
      renterAction: flowState.hasEnded ? 'Lưu biên bản và bộ ảnh trả xe, sau đó liên hệ showroom xác nhận.' : 'Theo dõi hẹn thuê và giữ xe đúng hiện trạng.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isCompleted) {
    return {
      headline: 'Đã hoàn thành',
      waitingFor: 'Booking này đã kết thúc quy trình trả xe và không còn bước nào đang chờ xử lý.',
      owner: 'Trạng thái: Hoàn tất',
      nextStep: 'Bạn có thể xem biên bản, báo cáo AI local và đánh giá xe nếu đủ điều kiện.',
      renterAction: 'Kiểm tra lại lịch sử hoặc để lại đánh giá.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isCancelled) {
    return {
      headline: 'Đã hủy booking',
      waitingFor: 'Booking này không còn tiếp tục trong quy trình đặt xe hiện tại.',
      owner: 'Trạng thái: Đã hủy',
      nextStep: paymentStatus === 'refunded'
        ? 'Khoản hoàn trả đã được ghi nhận trong lịch sử giao dịch.'
        : 'Nếu cần đặt lại xe, bạn có thể tạo booking mới.',
      renterAction: 'Kiểm tra lịch sử giao dịch nếu cần đối chỉnh thanh toán.',
      menuKey: 'bookings',
    };
  }

  return {
    headline: 'Đang xử lý booking',
    waitingFor: 'Booking đang được hệ thống theo dõi theo trạng thái hiện tại.',
    owner: 'Bên cần xử lý: Đang cập nhật',
    nextStep: 'Theo dõi tiếp cập nhật trên từng menu của renter.',
    renterAction: 'Kiểm tra chi tiết booking nếu cần.',
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
