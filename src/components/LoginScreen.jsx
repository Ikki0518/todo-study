import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export const LoginScreen = ({ onLogin, onRoleChange }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    userRole: 'STUDENT'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    setErrors({});

    try {
      if (isLoginMode) {
        // ログイン処理
        const response = await apiService.login(formData.email, formData.password);
        
        if (response.success) {
          const user = response.data.user;
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            userRole: user.role,
            avatar_url: user.avatar_url
          }));
          onRoleChange(user.role);
          onLogin(true);
        } else {
          setErrors({ general: response.message || 'ログインに失敗しました' });
        }
      } else if (isInviteMode && inviteToken) {
        // 招待トークンを使った新規登録
        const response = await apiService.register({
          token: inviteToken,
          name: formData.name,
          password: formData.password
        });
        
        if (response.success) {
          const user = response.data.user;
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            userRole: user.role,
            avatar_url: user.avatar_url
          }));
          onRoleChange(user.role);
          onLogin(true);
        } else {
          setErrors({ general: response.message || '登録に失敗しました' });
        }
      } else {
        // 通常の新規登録（現在は招待制のため無効）
        setErrors({ general: '新規登録は招待制となっています。招待リンクからアクセスしてください。' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: error.message || 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  // 招待トークンの検証
  const validateInviteToken = async (token) => {
    try {
      const response = await apiService.validateInvite(token);
      if (response.success) {
        setInviteData(response.data);
        setFormData(prev => ({
          ...prev,
          email: response.data.email,
          userRole: response.data.role
        }));
        setIsInviteMode(true);
        setIsLoginMode(false);
      }
    } catch (error) {
      console.error('Invalid invite token:', error);
    }
  };

  // URLパラメータから招待トークンを取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setInviteToken(token);
      validateInviteToken(token);
    }
  }, []);

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
            {isInviteMode ? '招待による新規登録' : (isLoginMode ? 'アカウントにログイン' : '新しいアカウントを作成')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* 招待トークンがある場合は新規登録のみ表示 */}
          {!isInviteMode && (
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
                disabled
                title="新規登録は招待制です"
              >
                新規登録
              </button>
            </div>
          )}

          {/* 招待情報の表示 */}
          {isInviteMode && inviteData && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>招待情報</strong><br/>
                メールアドレス: {inviteData.email}<br/>
                役割: {inviteData.role === 'STUDENT' ? '生徒' : '講師'}
              </p>
            </div>
          )}

          {/* エラーメッセージ */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 招待による新規登録時の名前入力 */}
            {isInviteMode && (
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

            {/* メールアドレス（ログイン時のみ表示） */}
            {!isInviteMode && (
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
                  readOnly={isInviteMode}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}

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

            {/* 招待による新規登録時のパスワード確認 */}
            {isInviteMode && (
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
              {isLoading ? '処理中...' : (isInviteMode ? 'アカウント作成' : 'ログイン')}
            </button>
          </form>

          {/* 新規登録は招待制の案内 */}
          {!isLoginMode && !isInviteMode && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700">
                <strong>ご注意:</strong><br/>
                新規登録は招待制となっています。<br/>
                管理者または講師から招待リンクを受け取ってください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};