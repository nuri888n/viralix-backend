import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login: authLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });
      authLogin(response.user, response.token);
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login fehlgeschlagen';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="relative w-full max-w-4xl grid gap-10 lg:grid-cols-2 items-center">
        <div className="absolute inset-0 -z-10 blur-3xl opacity-60 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.45),_transparent_55%)]" />

        <div className="hidden lg:flex flex-col gap-6 text-white">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-violet-200/80 bg-white/10 backdrop-blur rounded-full px-4 py-2 w-fit">
            <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
            Viralix Scheduler
          </span>
          <h1 className="text-4xl font-semibold leading-tight">
            Planen, posten, skalieren –
            <span className="text-[#8B5CF6] block">alles automatisiert.</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Sichere dir zuverlässiges Auto-Posting für alle deine Accounts mit menschlich wirkenden Posting-Zeiten und Echtzeit-Überblick.
          </p>
          <ul className="space-y-3 text-white/75 text-sm">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">✓</span>
              Human-like Scheduler mit variablen Zeitfenstern
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">✓</span>
              Multi-Account Management & manuelle Overrides
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">✓</span>
              Dashboard mit zuverlässigen Status-Updates
            </li>
          </ul>
        </div>

        <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-[#8B5CF6]/30">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-white">Willkommen zurück 👋</h2>
            <p className="mt-2 text-sm text-white/60">
              Logge dich ein, um deinen Auto-Scheduler zu steuern.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
                placeholder="you@viralix.ai"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-xl bg-[#8B5CF6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/30 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              {isSubmitting ? 'Wird eingeloggt…' : 'Login starten'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            Probleme beim Einloggen? <span className="font-medium text-white">support@viralix.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
}
