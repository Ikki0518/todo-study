import { useState, useEffect } from 'react';
import authService from '../services/authService';

export const ProfileSettings = ({ currentUser, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name
      }));
    }
  }, [currentUser]);

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

  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = '現在のパスワードを入力してください';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '新しいパスワードは6文字以上で入力してください';
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'パスワード確認を入力してください';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.updateProfile({
        name: formData.name.trim()
      });

      if (result.success) {
        setSuccessMessage('プロフィールを更新しました');
        onUserUpdate(result.user);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setErrors({ general: 'プロフィールの更新に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        setSuccessMessage('パスワードを変更しました');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
        setShowPasswordChange(false);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      setErrors({ general: 'パスワードの変更に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await authService.exportData();
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai_learning_planner_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccessMessage('データをエクスポートしました');
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('データエクスポートエラー:', error);
      setErrors({ general: 'データのエクスポートに失敗しました' });
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ユーザー情報を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">プロフィール設定</h1>

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

      <div className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">メールアドレスは変更できません</p>
            </div>

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
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー種別
              </label>
              <input
                type="text"
                value={currentUser.role === 'STUDENT' ? '生徒' : '講師'}
                disabled
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最終ログイン
              </label>
              <input
                type="text"
                value={currentUser.last_sign_in_at ? new Date(currentUser.last_sign_in_at).toLocaleString('ja-JP') : '未記録'}
                disabled
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {isLoading ? '更新中...' : 'プロフィールを更新'}
            </button>
          </form>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">パスワード変更</h2>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showPasswordChange ? 'キャンセル' : 'パスワードを変更'}
            </button>
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在のパスワード <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="6文字以上"
                  disabled={isLoading}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード確認 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="新しいパスワードを再入力"
                  disabled={isLoading}
                />
                {errors.confirmNewPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmNewPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                } transition-colors`}
              >
                {isLoading ? '変更中...' : 'パスワードを変更'}
              </button>
            </form>
          )}
        </div>

        {/* データ管理 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">データ管理</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">データエクスポート</h3>
              <p className="text-sm text-gray-500 mb-3">
                あなたのアカウント情報をJSONファイルとしてダウンロードできます。
              </p>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
              >
                データをエクスポート
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">アカウント情報</h3>
              <div className="text-sm text-gray-500 space-y-1">
                <p>アカウント作成日: {new Date(currentUser.created_at).toLocaleString('ja-JP')}</p>
                <p>ユーザーID: {currentUser.id}</p>
                <p className="text-xs text-blue-600 mt-2">
                  ✓ Supabaseで安全に管理されています
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};