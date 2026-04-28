import { sanitizeImageList } from './media';
import { canReviewBooking, resolveBookingVehicleId } from './bookingReviewEligibility';
import {
  CANCELLABLE_STATUSES,
  getBookingFlowState,
  getBookingPaymentStatus,
} from './bookingFlowState';
import { getRentalWorkflow } from './rentalWorkflowStorage';

export const PAYMENT_LABELS = {
  pending: 'Chờ thanh toán',
  successful: 'Thành công',
  refunded: 'Đã hoàn trả',
  declined: 'Bị từ chối',
  failed: 'Thất bại',
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
  if (!rawNote) return 'Tự đến lấy';
  return rawNote;
};

const getCoordinationMeta = (booking, flowState, paymentStatus) => {
  const startLabel = flowState.hasStarted ? 'Đã đến giờ nhận xe' : 'Chưa đến giờ nhận xe';

  if (flowState.isAwaitingPayment) {
    const needsRetry = ['failed', 'declined'].includes(paymentStatus);
    return {
      headline: needsRetry ? 'Chờ bạn thanh toán lại' : 'Chờ bạn thanh toán',
      waitingFor: needsRetry
        ? 'Hệ thống đang chờ bạn tạo lại và hoàn tất phiên thanh toán.'
        : 'Hệ thống đang chờ bạn hoàn tất thanh toán cho booking này.',
      owner: 'Bên cần xử lý: Bạn',
      nextStep: 'Sau khi thanh toán thành công, booking sẽ chuyển sang Chờ showroom xử lý.',
      renterAction: needsRetry ? 'Thanh toán lại để tiếp tục quy trình đặt xe.' : 'Hoàn tất thanh toán để showroom tiếp tục xử lý.',
      menuKey: 'pending-payments',
    };
  }

  if (flowState.isAwaitingShowroomProcessing) {
    const isConfirmed = booking.status === 'confirmed';
    return {
      headline: isConfirmed ? 'Chờ showroom chuẩn bị bàn giao' : 'Chờ showroom xác nhận',
      waitingFor: isConfirmed
        ? 'Đang chờ showroom chuẩn bị xe và chuyển booking sang bước Chờ bàn giao.'
        : 'Đang chờ showroom tiếp nhận booking đã thanh toán và xác nhận xử lý.',
      owner: 'Bên cần xử lý: Showroom',
      nextStep: 'Khi showroom chuyển booking sang Chờ bàn giao, bạn sẽ thấy ở menu Chờ nhận xe.',
      renterAction: 'Theo dõi cập nhật từ showroom hoặc liên hệ nếu cần.',
      menuKey: 'pending-showroom-processing',
    };
  }

  if (flowState.isAwaitingPickup) {
    if (flowState.canConfirmPickup) {
      return {
        headline: 'Chờ bạn xác nhận đã nhận xe',
        waitingFor: 'Showroom đã sẵn sàng bàn giao và đang chờ bạn xác nhận đã nhận xe.',
        owner: 'Bên cần xử lý: Bạn',
        nextStep: 'Sau khi xác nhận, booking sẽ được chuyển vào Chuyến đi của tôi.',
        renterAction: 'Xác nhận đã nhận xe khi bạn đã kiểm tra xong việc bàn giao.',
        menuKey: 'pending-pickups',
      };
    }

    return {
      headline: 'Chờ đến giờ nhận xe',
      waitingFor: `Showroom da san sang ban giao. ${startLabel}.`,
      owner: 'Bên cần xử lý: Bạn',
      nextStep: 'Nút xác nhận sẽ mở khi đến giờ nhận xe hợp lệ.',
      renterAction: 'Đến điểm giao nhận đúng hẹn và sẵn sàng xác nhận nhận xe.',
      menuKey: 'pending-pickups',
    };
  }

  if (booking.status === 'waiting_return_confirmation') {
    return {
      headline: 'Chờ showroom xác nhận đã trả xe',
      waitingFor: 'Bạn đã gửi yêu cầu trả xe. Đang chờ showroom đối chiếu ảnh và xác nhận hoàn tất.',
      owner: 'Bên cần xử lý: Showroom',
      nextStep: 'Sau khi showroom xác nhận, booking sẽ chuyển sang Hoàn thành.',
      renterAction: 'Theo dõi cập nhật hoàn tất hoặc liên hệ showroom nếu cần.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isActive) {
    return {
      headline: flowState.hasEnded ? 'Đến hạn trả xe' : 'Đang trong thời gian thuê',
      waitingFor: flowState.hasEnded
        ? 'Hệ thống đang chờ bạn mở quy trình trả xe và gửi yêu cầu trả xe.'
        : 'Booking đang ở giai đoạn thuê xe. Bạn chủ động sử dụng xe và báo sự cố nếu cần.',
      owner: 'Bên cần xử lý: Bạn',
      nextStep: flowState.hasEnded
        ? 'Mở Nhận / Trả xe để upload ảnh trả xe và gửi yêu cầu xác nhận.'
        : 'Khi đến hạn, bạn sẽ mở Nhận / Trả xe để thực hiện bước trả xe.',
      renterAction: flowState.hasEnded ? 'Gửi yêu cầu trả xe' : 'Theo dõi hạn thuê và giữ xe đúng hiện trạng.',
      menuKey: 'bookings',
    };
  }

  if (flowState.isCompleted) {
    return {
      headline: 'Đã hoàn thành',
      waitingFor: 'Booking này đã khớp quy trình trả xe và không còn bước nào đang chờ xử lý.',
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
      renterAction: 'Kiểm tra lịch sử giao dịch nếu cần đối chiếu thanh toán.',
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
    vehicleName: booking.vehicle?.name || booking.vehicle_id?.vehicle_name || 'Xe không tên',
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
    paymentMethod: booking.payment?.payment_method || 'Chưa có',
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
    rentalActionLabel: flowState.rentalActionLabel || 'Nhận / Trả xe',
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
