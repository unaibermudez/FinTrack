import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, FolderOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePortfolios } from '../hooks/usePortfolios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/ui/Navbar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/formatDate';
import type { Portfolio } from '../api/portfolios';

export const Dashboard = () => {
  const { portfolios, loading, create, remove } = usePortfolios();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Portfolio | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await create({ name, description });
      setName('');
      setDescription('');
      setShowCreate(false);
      toast.success(t('dashboard.portfolioCreated'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget._id);
      toast.success(t('dashboard.portfolioDeleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen ft-bg">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold ft-text tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-sm ft-text-2 mt-0.5">
              {loading ? '…' : t(`dashboard.portfolioCount_${portfolios.length === 1 ? 'one' : 'other'}`, { count: portfolios.length })}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="md">
            <Plus size={14} strokeWidth={2.5} />
            {t('dashboard.newPortfolio')}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl ft-card border ft-border animate-pulse" />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="ft-card border ft-border rounded-2xl p-16 text-center animate-fade-in">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ft-primary-subtle"
            >
              <FolderOpen size={20} className="ft-primary" />
            </div>
            <h3 className="font-semibold ft-text mb-1">{t('dashboard.noPortfolios')}</h3>
            <p className="text-sm ft-text-2 mb-6 max-w-xs mx-auto">{t('dashboard.noPortfoliosDesc')}</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              {t('dashboard.newPortfolio')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {portfolios.map((p) => (
              <div
                key={p._id}
                onClick={() => navigate(`/portfolio/${p._id}`)}
                className="group relative ft-card border ft-border rounded-xl p-5 cursor-pointer transition-all duration-150 hover:border-[var(--primary)]/40 hover:ft-shadow animate-fade-in"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg ft-text-3 hover:ft-negative hover:ft-negative-bg cursor-pointer"
                  title={t('common.delete')}
                >
                  <Trash2 size={13} />
                </button>

                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-semibold ft-text truncate group-hover:ft-primary transition-colors mb-1">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-xs ft-text-2 truncate">{p.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-5">
                  <span className="text-xs ft-text-3">
                    {formatDate(p.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-xs ft-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('dashboard.viewDetails')} <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setName(''); setDescription(''); }}
        title={t('dashboard.createPortfolio')}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label={t('dashboard.portfolioName')}
            placeholder="e.g. Tech Growth, Crypto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={t('dashboard.portfolioDescription')}
            hint={t('common.optional')}
            placeholder="A brief description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={creating}>
              {t('dashboard.createPortfolio')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('dashboard.deleteConfirmTitle')}
        description={t('dashboard.deleteConfirmDesc', { name: deleteTarget?.name ?? '' })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};
