import { useState } from 'react';
import authService from '../services/authService';

export const LoginScreen = ({ onLogin, onRoleChange }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    userRole: 'STUDENT'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    // 成功メッセージをクリア
    if (successMessage) {
      setSuccessMessage('');
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
    setSuccessMessage('');

    try {
      if (isLoginMode) {
        // ログイン処理（超高速版）
        console.log('ログイン開始（超高速版）:', formData.email);
        const result = await authService.login(formData.email, formData.password);
        
        if (result.success) {
          console.log('ログイン成功（即座に画面遷移）:', result.user);
          // 即座に状態を更新してログイン画面を終了
          onRoleChange(result.user.role || 'STUDENT');
          onLogin(true);
          // データ読み込みは完全にバックグラウンドで実行
        } else {
          console.log('ログインエラー:', result.error);
          setErrors({ general: result.error });
        }
      } else {
        // 新規登録処理
        console.log('新規登録開始:', formData.email);
        const result = await authService.register(formData.email, formData.password, {
          name: formData.name,
          userRole: formData.userRole
        });
        
        if (result.success) {
          console.log('新規登録成功（自動ログイン）:', result.user);
          // 新規登録後は自動的にログイン状態にする
          onRoleChange(result.user.role || 'STUDENT');
          onLogin(true);
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('認証エラー:', error);
      setErrors({ general: 'システムエラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (loginMode) => {
    setIsLoginMode(loginMode);
    setErrors({});
    setSuccessMessage('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      userRole: 'STUDENT'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mt-6 flex justify-center">
            {/* AI学習プランナーロゴ - ログイン画面用 */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI学習プランナー</h1>
                <div className="w-12 h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1"></div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLoginMode ? 'アカウントにログイン' : '新しいアカウントを作成'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* タブ切り替え */}
          <div className="flex mb-6">
            <button
              onClick={() => handleModeSwitch(true)}
              className={`flex-1 py-2 px-4 text-center rounded-l-md border ${
                isLoginMode 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => handleModeSwitch(false)}
              className={`flex-1 py-2 px-4 text-center rounded-r-md border ${
                !isLoginMode 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              新規登録
            </button>
          </div>

          {/* 成功メッセージ */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
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
            {/* 新規登録時の名前入力 */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 <span className="text-red-500">*</span>
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
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
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
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード <span className="text-red-500">*</span>
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
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 新規登録時の追加フィールド */}
            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード確認 <span className="text-red-500">*</span>
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
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ユーザー種別
                  </label>
                  <select
                    name="userRole"
                    value={formData.userRole}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="STUDENT">生徒</option>
                    <option value="INSTRUCTOR">講師</option>
                  </select>
                </div>
              </>
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
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </div>
              ) : (
                isLoginMode ? 'ログイン' : 'アカウント作成'
              )}
            </button>
          </form>

          {/* Supabase使用の説明 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Supabaseで安全に管理</strong>
              </p>
              <p className="text-xs text-gray-500">
                アカウント情報はSupabaseデータベースに安全に保存されます
              </p>
            </div>
          </div>

          {/* 新規登録時の説明 */}
          {!isLoginMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>新規登録について:</strong><br/>
                アカウント作成後、確認メールが送信されます。<br/>
                メール内のリンクをクリックしてアカウントを有効化してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};