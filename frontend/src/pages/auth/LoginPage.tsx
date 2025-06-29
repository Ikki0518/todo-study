import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="label">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          required
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
          placeholder="••••••••"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-600">アカウントをお持ちでない方は </span>
        <Link to="/register" className="text-primary-600 hover:text-primary-500">
          新規登録
        </Link>
      </div>
    </form>
  );
}