import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useI18n } from '../i18n';
import IconButton from '../components/common/IconButton';

export default function NotFoundPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4 p-4 select-none">
      <Compass className="w-12 h-12 text-zinc-700 animate-pulse" />
      <h2 className="text-lg font-bold text-zinc-200">{t('notFound.title')} (404)</h2>
      <IconButton
        icon={ArrowLeft}
        size="md"
        variant="default"
        shape="rounded-xl"
        onClick={() => navigate('/sparks')}
      />
    </div>
  );
}
