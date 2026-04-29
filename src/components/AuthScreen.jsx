import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Star, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ForgotPassword from './ForgotPassword.jsx';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

const getAuthRoute = () => {
  if (typeof window === 'undefined') return 'entry';
  const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
  const hash = window.location.hash.replace('#', '').replace(/^\/+/, '').toLowerCase();
  const route = hash || path;
  if (route === 'login') return 'login';
  if (route === 'register' || route === 'signup') return 'register';
  if (route === 'forgot-password') return 'forgot-password';
  return 'entry';
};

export default function AuthScreen({ onLogin }) {
  const [route, setRoute] = useState(getAuthRoute);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('contributor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEntry = route === 'entry';
  const isRegister = route === 'register';
  const isForgotPassword = route === 'forgot-password';
  const mode = isRegister ? 'register' : 'login';

  useEffect(() => {
    const syncRoute = () => setRoute(getAuthRoute());
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  useEffect(() => {
    setError('');
    setLoading(false);
  }, [route]);

  const goTo = (nextRoute) => {
    setError('');
    if (nextRoute === 'entry') {
      window.location.hash = '';
      setRoute('entry');
      return;
    }
    window.location.hash = `/${nextRoute}`;
    setRoute(nextRoute);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const url = mode === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const body = mode === 'login' 
      ? { username, password } 
      : { username, password, role, email };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      localStorage.setItem('ligma_token', data.token);
      localStorage.setItem('ligma_user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSuccess = () => {
    setRoute('login');
    window.location.hash = '#/login';
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neo-canvas text-neo-ink">
      <div className="pointer-events-none fixed inset-0 bg-neo-grid opacity-40 z-0" />
      <div className="pointer-events-none fixed inset-0 bg-neo-noise opacity-5 z-0" />
      <div className="pointer-events-none fixed inset-0 bg-neo-dots opacity-15 z-0" />
      <div className="pointer-events-none absolute -top-10 left-8 h-24 w-24 rotate-12 border-4 border-black bg-neo-secondary shadow-neo-md z-0" />
      <div className="pointer-events-none absolute top-20 right-10 h-16 w-16 rounded-full border-4 border-black bg-neo-accent shadow-neo-md z-0" />
      <div className="pointer-events-none absolute bottom-16 left-6 h-20 w-20 -rotate-6 border-4 border-black bg-neo-muted shadow-neo-md z-0" />
      <div className="pointer-events-none absolute bottom-24 right-16 hidden h-24 w-24 rotate-3 border-4 border-black bg-neo-white shadow-neo-md lg:block z-0" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12"
      >
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 border-4 border-black bg-neo-white px-3 py-2 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm rotate-1">
              <Star className="size-4 stroke-[3px]" />
              Serial 04
            </div>

            <div className="relative">
              <span className="neo-stroke absolute -top-3 left-2 text-6xl font-black uppercase tracking-tight sm:text-7xl">
                LIGMA
              </span>
              <span className="relative text-6xl font-black uppercase tracking-tight sm:text-7xl">
                LIGMA
              </span>
            </div>

            <div className="inline-flex items-center gap-3 border-4 border-black bg-neo-secondary px-4 py-2 text-sm font-black uppercase tracking-[0.3em] shadow-neo-md -rotate-1">
              Control room access
            </div>

            <p className="max-w-md text-lg font-bold leading-relaxed">
              A loud, tactile collaboration engine for teams that want speed, clarity, and instant sync.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-4 border-black bg-neo-white p-4 text-sm font-bold shadow-neo-md rotate-1">
                <div className="text-xs font-black uppercase tracking-widest">Realtime</div>
                <div className="mt-2 text-lg font-black uppercase">Sync</div>
              </div>
              <div className="border-4 border-black bg-neo-muted p-4 text-sm font-bold shadow-neo-md -rotate-1">
                <div className="text-xs font-black uppercase tracking-widest">Smart</div>
                <div className="mt-2 text-lg font-black uppercase">Automation</div>
              </div>
              <div className="border-4 border-black bg-neo-accent p-4 text-sm font-bold shadow-neo-md -rotate-1">
                <div className="text-xs font-black uppercase tracking-widest">Instant</div>
                <div className="mt-2 text-lg font-black uppercase">Signals</div>
              </div>
              <div className="border-4 border-black bg-neo-secondary p-4 text-sm font-bold shadow-neo-md rotate-1">
                <div className="text-xs font-black uppercase tracking-widest">Hard</div>
                <div className="mt-2 text-lg font-black uppercase">Controls</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-neo-accent shadow-neo-sm">
                <ArrowRight className="size-6 stroke-[3px]" />
              </div>
              <div className="text-sm font-black uppercase tracking-widest">
                Live rooms. Zero fluff.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            className="relative"
          >
            <div className="absolute -top-6 -right-6 rotate-3 border-4 border-black bg-neo-accent px-3 py-2 text-xs font-black uppercase tracking-[0.3em] shadow-neo-md">
              Access
            </div>
            <div className="border-4 border-black bg-neo-muted p-3 shadow-neo-xl -rotate-1">
              <div className="relative border-4 border-black bg-neo-canvas p-6 shadow-neo-lg sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-neo-dots opacity-15" />
                <div className="relative grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
                  <div className="border-4 border-black bg-neo-white p-5 shadow-neo-md">
                    <div className="flex h-full flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 border-4 border-black bg-neo-secondary px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.3em] shadow-neo-sm rotate-1">
                          {isEntry ? 'Entry panel' : mode}
                        </div>
                        <div className="text-3xl font-black uppercase tracking-tight">
                          {isEntry ? 'Pick a door' : isRegister ? 'Create ID' : 'Login'}
                        </div>
                        <p className="text-sm font-bold">
                          {isEntry ? 'Login or register, two clean routes.' : 'One route, one mission, no noise.'}
                        </p>
                      </div>

                      {isEntry ? (
                        <div className="space-y-3">
                          <Button
                            type="button"
                            onClick={() => goTo('login')}
                            className="h-12 w-full rounded-none border-4 border-black bg-neo-secondary text-xs font-black uppercase tracking-widest text-black shadow-neo-md transition-transform duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            Login
                          </Button>
                          <Button
                            type="button"
                            onClick={() => goTo('register')}
                            className="h-12 w-full rounded-none border-4 border-black bg-neo-accent text-xs font-black uppercase tracking-widest text-black shadow-neo-md transition-transform duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            Sign up
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Button
                            type="button"
                            onClick={() => goTo(isRegister ? 'login' : 'register')}
                            className="h-12 w-full rounded-none border-4 border-black bg-neo-secondary text-xs font-black uppercase tracking-widest text-black shadow-neo-md transition-transform duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            Go to {isRegister ? 'login' : 'signup'}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => goTo('entry')}
                            className="h-12 w-full rounded-none border-4 border-black bg-neo-white text-xs font-black uppercase tracking-widest text-black shadow-neo-md transition-transform duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            Back
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isEntry ? (
                      <div className="space-y-3">
                        <div className="border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold shadow-neo-sm">
                          Separate routes: <span className="font-black">#/login</span> or <span className="font-black">#/register</span>.
                        </div>
                        <div className="border-4 border-black bg-neo-white px-3 py-2 text-xs font-black uppercase tracking-widest shadow-neo-sm">
                          Live sessions ready
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                          <Sparkles className="size-4 stroke-[3px]" />
                          Hard click, fast action
                        </div>
                        <div className="inline-flex items-center gap-2 border-4 border-black bg-neo-secondary px-2 py-1 text-xs font-black uppercase tracking-widest shadow-neo-sm rotate-1">
                          Fast
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-xs font-black uppercase tracking-[0.3em]">
                            Username
                          </Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            className="h-12 rounded-none border-4 border-black bg-white text-base font-bold text-neo-ink placeholder:text-black/40 focus-visible:border-black focus-visible:bg-neo-secondary focus-visible:ring-0 focus-visible:shadow-neo-sm sm:h-14"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-xs font-black uppercase tracking-[0.3em]">
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="h-12 rounded-none border-4 border-black bg-white text-base font-bold text-neo-ink placeholder:text-black/40 focus-visible:border-black focus-visible:bg-neo-secondary focus-visible:ring-0 focus-visible:shadow-neo-sm sm:h-14"
                          />
                        </div>
                        {isRegister && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.3em]">
                                Email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="For password recovery"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="h-12 rounded-none border-4 border-black bg-white text-base font-bold text-neo-ink placeholder:text-black/40 focus-visible:border-black focus-visible:bg-neo-secondary focus-visible:ring-0 focus-visible:shadow-neo-sm sm:h-14"
                              />
                            </div>
                          </>
                        )}
                        {!isRegister && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => goTo('forgot-password')}
                              className="text-xs font-bold uppercase tracking-widest hover:text-neo-accent hover:underline transition-colors"
                            >
                              Forgot Password?
                            </button>
                          </div>
                        )}
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold shadow-neo-sm"
                            role="alert"
                            aria-live="polite"
                          >
                            {error}
                          </motion.div>
                        )}
                        <Button
                          type="submit"
                          className="h-12 w-full rounded-none border-4 border-black bg-neo-accent text-xs font-black uppercase tracking-widest text-black shadow-neo-md transition-transform duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-14"
                          disabled={loading}
                        >
                          {loading ? (isRegister ? 'Creating account...' : 'Logging in...') : isRegister ? 'Create account' : 'Log in'}
                        </Button>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-black uppercase tracking-widest">
                          <span className="inline-flex items-center gap-2">
                            <Star className="size-4 stroke-[3px]" />
                            Live sessions
                          </span>
                          <span className="border-4 border-black bg-neo-secondary px-2 py-1 shadow-neo-sm rotate-1">
                            Fast
                          </span>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {isEntry && (
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 space-y-32">
          {/* Diff from others */}
          <section>
            <div className="mb-12 inline-flex items-center gap-2 border-4 border-black bg-neo-accent px-4 py-2 text-sm font-black uppercase tracking-[0.3em] shadow-neo-sm rotate-1">
              Why we're different
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="border-4 border-black bg-neo-white p-8 shadow-neo-lg transition-transform hover:-translate-y-2 hover:shadow-neo-xl">
                <div className="mb-4 h-12 w-12 border-4 border-black bg-neo-secondary shadow-neo-sm -rotate-3" />
                <h3 className="mb-4 text-2xl font-black uppercase tracking-tight">No soft edges</h3>
                <p className="font-bold leading-relaxed text-neo-ink/80">
                  Most tools want to be "friendly". We want to be fast. No multi-level popups, no hidden menus. Everything is hard-coded and physically visible.
                </p>
              </div>
              <div className="border-4 border-black bg-neo-white p-8 shadow-neo-lg transition-transform hover:-translate-y-2 hover:shadow-neo-xl">
                <div className="mb-4 h-12 w-12 border-4 border-black bg-neo-muted shadow-neo-sm rotate-3" />
                <h3 className="mb-4 text-2xl font-black uppercase tracking-tight">Built for speed</h3>
                <p className="font-bold leading-relaxed text-neo-ink/80">
                  Zero loading skeletons. Instant sync via WebSockets. The moment you move your cursor, it's on every screen in the room immediately. 
                </p>
              </div>
              <div className="border-4 border-black bg-neo-white p-8 shadow-neo-lg transition-transform hover:-translate-y-2 hover:shadow-neo-xl">
                <div className="mb-4 h-12 w-12 border-4 border-black bg-neo-accent shadow-neo-sm rotate-6" />
                <h3 className="mb-4 text-2xl font-black uppercase tracking-tight">Voice action</h3>
                <p className="font-bold leading-relaxed text-neo-ink/80">
                  Stop typing up sticky notes during brainstorming. Just speak them. Our voice-to-canvas pipeline instantly drops your ideas on the board.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <div className="mb-12 inline-flex items-center gap-2 border-4 border-black bg-neo-secondary px-4 py-2 text-sm font-black uppercase tracking-[0.3em] shadow-neo-sm -rotate-1">
              Core mechanics
            </div>
            
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="border-4 border-black bg-neo-white p-2 shadow-neo-xl rotate-1">
                <div className="aspect-video w-full border-4 border-black bg-neo-muted p-8 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-neo-grid opacity-40 mix-blend-multiply" />
                  <div className="border-4 border-black bg-neo-secondary px-8 py-4 font-black uppercase text-3xl shadow-neo-lg -rotate-12 transform hover:rotate-0 transition-transform cursor-pointer">
                    @ALICE ➜ "MAKE IT RED"
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-6">
                <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
                  Talk to the <span className="bg-neo-accent px-2">Canvas</span>
                </h2>
                <p className="text-xl font-bold leading-relaxed">
                  We've integrated a powerful voice recognition module directly onto your canvas state. Don't waste time typing out complex node names when ideating. Hold the Voice Note button, speak your mind, and watch the physical note drop right where your cursor is. 
                </p>
                <div className="flex gap-4 font-black uppercase tracking-widest text-sm">
                  <div className="border-b-4 border-black pb-1">Listen</div>
                  <div className="border-b-4 border-black pb-1">Transcribe</div>
                  <div className="border-b-4 border-black pb-1">Deploy</div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6 order-2 lg:order-1">
                <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
                  Know exactly <br />
                  <span className="bg-neo-muted px-2">who did what</span>
                </h2>
                <p className="text-xl font-bold leading-relaxed">
                  Our raw event log tracks every single action in the workspace. No more guessing who deleted the architecture diagram or who moved the sticky notes. The timeline is immutable, transparent, and completely visible.
                </p>
              </div>
              <div className="border-4 border-black bg-neo-white p-2 shadow-neo-xl -rotate-1 order-1 lg:order-2">
                <div className="aspect-video w-full border-4 border-black bg-neo-accent p-8 flex flex-col gap-4 justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-neo-dots opacity-20 mix-blend-multiply" />
                  <div className="border-4 border-black bg-neo-white px-4 py-2 font-bold shadow-neo-sm rotate-2">
                    <span className="font-black uppercase">@Dave</span> joined the room
                  </div>
                  <div className="border-4 border-black bg-neo-white px-4 py-2 font-bold shadow-neo-sm -rotate-1 translate-x-8">
                    <span className="font-black uppercase underline decoration-2">@Alice</span> created task
                  </div>
                  <div className="border-4 border-black bg-neo-white px-4 py-2 font-bold shadow-neo-sm rotate-1">
                    <span className="font-black uppercase">@Dave</span> moved node
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-4 border-black bg-neo-white p-8 sm:p-12 shadow-neo-xl rotate-1 mt-24 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
               <div className="space-y-4">
                 <div className="text-4xl font-black uppercase tracking-tighter">LIGMA</div>
                 <p className="font-bold text-sm max-w-sm">The collaboration tool for teams that hate waiting, hate soft UIs, and love getting things done fast.</p>
               </div>
               <div className="flex flex-col items-center sm:items-end gap-2 font-black uppercase tracking-widest text-sm">
                 <a href="#/login" className="hover:underline decoration-4 underline-offset-4 cursor-pointer hover:text-neo-accent transition-colors">Start working</a>
                 <a href="#/register" className="hover:underline decoration-4 underline-offset-4 cursor-pointer hover:text-neo-accent transition-colors">Create ID</a>
                 <div className="mt-4 border-4 border-black bg-neo-secondary px-2 py-1 rotate-3 text-xs">
                   v1.0.0-brutal
                 </div>
               </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
