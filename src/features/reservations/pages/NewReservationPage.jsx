import { useSearchParams } from 'react-router-dom';
import { Spinner } from '../../../components/ui';
import { useFetch } from '../../../hooks/useFetch';
import { clientsApi } from '../../../services/api/clientsApi';
import ReservationForm from '../components/ReservationForm';

// Accepte ?client=<id>&room=<id>&arrival=yyyy-mm-dd&departure=yyyy-mm-dd (depuis le planning, la fiche client, la liste des chambres)
const NewReservationPage = () => {
  const [params] = useSearchParams();
  const clientId = params.get('client');
  const { data: client, loading } = useFetch(() => clientsApi.get(clientId), [clientId], { enabled: !!clientId });
  if (clientId && loading) return <Spinner />;
  const initial = { client: client || null, room_id: params.get('room') || undefined, arrival_date: params.get('arrival') || undefined, departure_date: params.get('departure') || undefined };
  return (
    <div className="pt-2">
      <ReservationForm initial={initial} />
    </div>
  );
};

export default NewReservationPage;
