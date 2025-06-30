import { useState } from 'react';

export const LoginScreen = ({ onLogin, onRoleChange }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ローカルのユーザーデータ（デモ用）
  const [users, setUsers] = useState([
    {
      id: 1,
      email: 'student@example.com',
      password: 'password123',
      name: '山田太郎',
      phoneNumber: '090-1234-5678',
      userRole: 'STUDENT'
    },
    {
      id: 2,
      email: 'teacher@example.com',
      password: 'password123',
      name: '田中先生',
      phoneNumber: '090-8765-4321',
      userRole: 'INSTRUCTOR'
    }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // メールアドレスの検証
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // パスワードの検証
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    // 新規登録時の追加検証
    if (!isLoginMode) {
      if (!formData.name) {
        newErrors.name = '名前を入力してください';
      }
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = '電話番号を入力してください';
      } else if (!/^\d{3}-\d{4}-\d{4}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = '電話番号は000-0000-0000の形式で入力してください';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'パスワード確認を入力してください';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'パスワードが一致しません';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 実際の実装では、ここでAPIを呼び出します
      await new Promise(resolve => setTimeout(resolve, 1000)); // デモ用の遅延

      if (isLoginMode) {
        // ログイン処理
        const user = users.find(u =>
          u.email === formData.email && u.password === formData.password
        );
        
        if (user) {
          // ログイン成功
          localStorage.setItem('currentUser', JSON.stringify(user));
          onRoleChange(user.userRole);
          onLogin(true);
        } else {
          setErrors({ general: 'メールアドレスまたはパスワードが正しくありません' });
        }
      } else {
        // 新規登録処理
        const existingUser = users.find(u => u.email === formData.email);
        if (existingUser) {
          setErrors({ email: 'このメールアドレスは既に登録されています' });
        } else {
          // 新規ユーザーを追加
          const newUser = {
            id: users.length + 1,
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            userRole: 'STUDENT' // デフォルトで生徒として登録
          };
          setUsers(prev => [...prev, newUser]);
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          onRoleChange(newUser.userRole);
          onLogin(true);
        }
      }
    } catch (error) {
      setErrors({ general: 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mt-6 flex justify-center">
            {/* Sunaロゴ - ログイン画面用（少し大きめ） */}
            <svg width="150" height="70" viewBox="0 0 150 70" className="flex-shrink-0">
              {/* 大きな円（右上、明るいターコイズブルー） */}
              <circle cx="115" cy="25" r="16" fill="#67E8F9" opacity="0.85"/>

              {/* 中くらいの円（左中央、濃いブルー） */}
              <circle cx="95" cy="35" r="10" fill="#2563EB" opacity="0.9"/>

              {/* 小さな円（右下、薄いターコイズ） */}
              <circle cx="108" cy="45" r="6" fill="#A7F3D0" opacity="0.75"/>

              {/* テキスト "suna" - 太字、濃いネイビー */}
              <text x="0" y="52" fontSize="34" fontWeight="700" fill="#1E293B" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" letterSpacing="-1.5px">
                suna
              </text>
            </svg>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLoginMode ? 'アカウントにログイン' : '新しいアカウントを作成'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* タブ切り替え */}
          <div className="flex mb-6">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 px-4 text-center rounded-l-md border ${
                isLoginMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 px-4 text-center rounded-r-md border ${
                !isLoginMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              新規登録
            </button>
          </div>

          {/* エラーメッセージ */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 新規登録時の名前入力 */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="山田太郎"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* 新規登録時の電話番号入力 */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="000-0000-0000"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="6文字以上"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 新規登録時のパスワード確認 */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード確認
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="パスワードを再入力"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {isLoading ? '処理中...' : (isLoginMode ? 'ログイン' : 'アカウント作成')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};