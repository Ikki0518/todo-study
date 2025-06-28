import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、APIを呼び出してユーザー登録を行う
    console.log('Register:', formData);
    navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="label">
          名前
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input"
          required
          placeholder="山田太郎"
        />
      </div>

      <div>
        <label htmlFor="email" className="label">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="input"
          required
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="label">ユーザー種別</label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="STUDENT"
              checked={formData.role === 'STUDENT'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">生徒</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="INSTRUCTOR"
              checked={formData.role === 'INSTRUCTOR'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">講師</span>
          </label>
        </div>
      </div>

      <div>
        <button type="submit" className="btn-primary w-full py-2">
          新規登録
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-600">既にアカウントをお持ちの方は </span>
        <Link to="/login" className="text-primary-600 hover:text-primary-500">
          ログイン
        </Link>
      </div>
    </form>
  );
}