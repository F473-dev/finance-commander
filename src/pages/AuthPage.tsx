import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      const result = login(email, password);
      if (result !== true) setError(result);
    } else {
      if (!name.trim()) { setError('Nama harus diisi'); return; }
      const result = register(email, name, password);
      if (result !== true) setError(result);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            FinanceFlow <span className="text-primary">PRO</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-surface rounded-xl p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="label-caps block mb-1.5">Nama</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nama lengkap"
              />
            </div>
          )}
          <div>
            <label className="label-caps block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="email@contoh.com"
              required
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            {isLogin ? 'Masuk' : 'Daftar'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
