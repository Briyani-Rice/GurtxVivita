import { useState } from 'react';
import { User } from '../types';
import { Package, Eye, EyeOff, LogIn } from 'lucide-react';

export interface LoginProps {
    onLogin: (user: User) => void;
}

export function LoginView({ onLogin }: LoginProps) {
    const [username, setUsername]   = useState('');
    const [password, setPassword]   = useState('');
    const [showPass,  setShowPass]  = useState(false);
    const [error,     setError]     = useState('');
    const [loading,   setLoading]   = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) return;

        setLoading(true);
        setError('');

        // Small delay so the button state is visible — swap for real async auth
        await new Promise(r => setTimeout(r, 400));

        const user = User.login(username.trim(), password);
        setLoading(false);

        if (user) {
            onLogin(user);
        } else {
            setError('Incorrect username or password.');
        }
    };

    // Quick-fill helpers for the demo
    const fillDemo = (role: 'user' | 'admin') => {
        setUsername('User');
        setPassword('User12345');
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* ── Logo / branding ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-100 mb-4">
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="vivitaFont text-4xl font-bold text-gray-900 tracking-tight">
                        VIVITA
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Materials Management</p>
                </div>

                {/* ── Card ── */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Sign in to continue</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                autoFocus
                                autoComplete="username"
                                value={username}
                                onChange={e => { setUsername(e.target.value); setError(''); }}
                                placeholder="Enter your username"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                <span className="text-red-500 text-sm">⚠</span>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !username.trim() || !password}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <LogIn className="w-4 h-4" />
                            )}
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    {/* ── Demo account quick-fills ── */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center mb-3">Demo accounts</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fillDemo('user')}
                                className="flex-1 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                                👤 User
                            </button>
                            <button
                                onClick={() => fillDemo('admin')}
                                className="flex-1 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100 transition-colors"
                            >
                                🛡 Admin
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-400 mt-6 text-[12px]">
                    VIVITA Materials · Internal tool
                </p>
            </div>
        </div>
    );
}
