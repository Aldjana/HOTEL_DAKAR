import Badge from '../../ui/Badge/Badge';
import * as S from '../../../constants/status';

// Rendu d'origine (pastille pleine en majuscules). Les libellés viennent de constants/status.js.
const MAPS = {
  reservation: [S.RESERVATION_STATUS_LABELS, S.RESERVATION_STATUS_COLORS],
  reservation_payment: [S.RESERVATION_PAYMENT_LABELS, S.RESERVATION_PAYMENT_COLORS],
  room: [S.ROOM_STATUS_LABELS, S.ROOM_STATUS_COLORS],
  payment: [S.PAYMENT_STATUS_LABELS, S.PAYMENT_STATUS_COLORS],
  invoice: [S.INVOICE_STATUS_LABELS, S.INVOICE_STATUS_COLORS],
  priority: [S.PRIORITY_LABELS, S.PRIORITY_COLORS],
};

const StatusBadge = ({ status, type = 'reservation', size }) => {
  if (!status) return null;
  const [labels, colors] = MAPS[type] || MAPS.reservation;
  return <Badge variant={colors[status] || 'neutral'} size={size}>{labels[status] || status}</Badge>;
};

export default StatusBadge;
