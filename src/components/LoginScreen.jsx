import { useState, useCallback, useMemo } from 'react';
import apiService from '../services/apiService';

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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // ローカルストレージのキャッシュ機能を追加
  const [localUsersCache, setLocalUsersCache] = useState(() => {
    try {
      const saved = localStorage.getItem('localUsers');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Local storage error:', error);
      return [];
    }
  });

  // メモ化された入力変更ハンドラー
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // エラーをクリア（メモ化）
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // 登録成功時の処理
  const handleRegistrationSuccess = useCallback(() => {
    setRegistrationSuccess(true);
    setIsLoginMode(true);
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      name: '',
      phoneNumber: ''
    }));
    setErrors({ success: '登録が完了しました。ログインしてください。' });
  }, []);

  // 最適化されたバリデーション（必要な時のみ実行）
  const validateForm = useMemo(() => {
    return () => {
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

      return newErrors;
    };
  }, [formData, isLoginMode]);

  // 最適化されたローカルストレージ検索
  const checkLocalUser = useCallback((email, password) => {
    return localUsersCache.find(user => 
      user.email === email && user.password === password
    );
  }, [localUsersCache]);

  // 最適化されたサブミット処理
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (isLoginMode) {
        // ログイン処理の最適化
        try {
          const response = await apiService.login(formData.email, formData.password);
          
          if (response.success) {
            const user = response.data.user;
            const userInfo = {
              id: user.id,
              email: user.email,
              name: user.name,
              userRole: user.role,
              avatar_url: user.avatar_url,
              phoneNumber: user.phoneNumber || formData.phoneNumber
            };
            
            // 一度だけローカルストレージに保存
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            onRoleChange(user.role);
            onLogin(true);
            return;
          } else {
            setErrors({ general: response.message || 'ログインに失敗しました' });
          }
        } catch (apiError) {
          console.log('API unavailable, checking local storage');
          
          // ローカルストレージのフォールバック（キャッシュ済み）
          const localUser = checkLocalUser(formData.email, formData.password);
          
          if (localUser) {
            localStorage.setItem('currentUser', JSON.stringify(localUser));
            onRoleChange(localUser.userRole);
            onLogin(true);
            return;
          } else {
            setErrors({ general: 'メールアドレスまたはパスワードが正しくありません' });
          }
        }
      } else {
        // 新規登録処理の最適化
        try {
          const response = await apiService.post('/auth/register-dev', {
            email: formData.email,
            name: formData.name,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            role: 'STUDENT'
          });
          
          if (response.success) {
            handleRegistrationSuccess();
            return;
          } else {
            setErrors({ general: response.message || '登録に失敗しました' });
          }
        } catch (apiError) {
          console.log('API unavailable, using local storage');
          
          // 既存ユーザーチェック（キャッシュ済み）
          const existingUser = localUsersCache.find(u => u.email === formData.email);
          if (existingUser) {
            setErrors({ email: 'このメールアドレスは既に登録されています' });
            return;
          }
          
          // ローカルストレージに保存
          const newUser = {
            id: Date.now().toString(),
            email: formData.email,
            name: formData.name,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            userRole: 'STUDENT'
          };
          
          const updatedUsers = [...localUsersCache, newUser];
          setLocalUsersCache(updatedUsers);
          localStorage.setItem('localUsers', JSON.stringify(updatedUsers));
          
          handleRegistrationSuccess();
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: error.message || 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoginMode, validateForm, checkLocalUser, localUsersCache, handleRegistrationSuccess, onLogin, onRoleChange]);

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

          {/* メッセージ表示 */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}
          {errors.success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {errors.success}
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