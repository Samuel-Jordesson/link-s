import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import ProfileView from '../components/ProfileView.jsx';

export default function PublicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getPublic(slug)
      .then((p) => {
        setPage(p);
        document.title = p.name;
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="center-msg">{error}</div>;
  if (!page) return <div className="center-msg">Carregando...</div>;

  return (
    <div className="public-page">
      <ProfileView page={page} />
    </div>
  );
}
