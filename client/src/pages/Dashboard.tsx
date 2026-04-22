import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolios } from '../hooks/usePortfolios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/ui/Navbar';
import { formatDate } from '../utils/formatDate';

export const Dashboard = () => {
  const { portfolios, loading, create, remove } = usePortfolios();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await create({ name, description });
      setName('');
      setDescription('');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">My Portfolios</h1>
            <p className="text-sm text-slate-500 mt-0.5">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ New Portfolio</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] animate-pulse" />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">No portfolios yet.</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>Create your first portfolio</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <Card
                key={p._id}
                className="cursor-pointer hover:border-indigo-500/40 transition-colors group"
                onClick={() => navigate(`/portfolio/${p._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{p.description}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-3">Created {formatDate(p.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(p._id); }}
                    className="ml-2 text-slate-600 hover:text-red-400 transition-colors text-lg leading-none cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete portfolio"
                  >
                    ×
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Portfolio">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="e.g. Tech Stocks"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="A brief description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2 justify-end mt-1">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
