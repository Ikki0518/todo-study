import React, { useState } from 'react';

export function ProfileSettings({ currentUser, onUpdateUser, onClose }) {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // パスワード変更の場合、確認用パスワードをチェック
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'パスワードが一致しません' });
        return;
      }
      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'パスワードは6文字以上で入力してください' });
        return;
      }
    }

    // ユーザー情報の更新
    const updatedUser = {
      ...currentUser,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber
    };

    // ローカルストレージに保存
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // 親コンポーネントに通知
    onUpdateUser(updatedUser);
    
    setMessage({ type: 'success', text: '設定を更新しました' });
    
    // 3秒後にメッセージをクリア
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  // 解約処理
  const handleCancelSubscription = () => {
    // ユーザー情報を更新してサブスクリプションを無効にする
    const updatedUser = {
      ...currentUser,
      subscriptionActive: false,
      cancelledAt: new Date().toISOString()
    };

    // localStorageから決済関連データを削除
    localStorage.removeItem('paymentStatus');
    localStorage.removeItem('isPaid');
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userInfo');

    // 更新されたユーザー情報を保存（解約済みとして）
    localStorage.setItem('cancelledUser', JSON.stringify(updatedUser));

    // 親コンポーネントに通知
    onUpdateUser(null);
    
    setMessage({ type: 'success', text: 'サブスクリプションを解約しました。システムからログアウトします。' });
    
    // 3秒後にページをリロードしてログイン画面に戻す
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">プロフィール設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              pattern="\d{3}-\d{4}-\d{4}"
              placeholder="000-0000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">000-0000-0000の形式で入力してください</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">パスワード変更</h3>
            <p className="text-sm text-gray-600 mb-4">
              パスワードを変更する場合のみ入力してください
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6文字以上で入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="もう一度入力"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              設定を保存
            </button>
          </div>
        </form>

        {/* サブスクリプション管理セクション */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">サブスクリプション管理</h3>
          
          {/* 現在のプラン情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">現在のプラン</p>
                <p className="text-sm text-gray-600">
                  {currentUser?.selectedPlan?.name || 'ベーシックプラン'}
                </p>
                <p className="text-xs text-gray-500">
                  登録日: {currentUser?.registeredAt ? new Date(currentUser.registeredAt).toLocaleDateString('ja-JP') : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  currentUser?.subscriptionActive !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentUser?.subscriptionActive !== false ? 'アクティブ' : '解約済み'}
                </span>
              </div>
            </div>
          </div>

          {/* 解約ボタン */}
          {currentUser?.subscriptionActive !== false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-red-800">
                    サブスクリプションの解約
                  </h4>
                  <p className="mt-1 text-sm text-red-700">
                    解約すると、すぐにシステムにアクセスできなくなります。この操作は取り消せません。
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      サブスクリプションを解約
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 解約確認モーダル */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">解約の確認</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                本当にサブスクリプションを解約しますか？解約すると、すぐにシステムにアクセスできなくなり、この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  解約する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}