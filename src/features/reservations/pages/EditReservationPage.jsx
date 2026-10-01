import { useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../../../components/ui';
import { useFetch } from '../../../hooks/useFetch';
import { useReservationLabel } from '../../../context/PageMetaContext';
import { reservationsApi } from '../../../services/api/reservationsApi';
import ReservationForm from '../components/ReservationForm';
import { useT } from '../../../i18n';

const EditReservationPage = () => {
  const { t } = useT();
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => reservationsApi.get(id), [id]);
  useReservationLabel(data?.reservation_number);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const closed = ['cancelled', 'checked_out', 'no_show'].includes(data.status);
  return (
    <div className="pt-2">
      {closed && <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-600">{t('Dossier clos : seules les notes peuvent être modifiées.')}</div>}
      <ReservationForm reservation={data} />
    </div>
  );
};

export default EditReservationPage;
