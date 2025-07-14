import { useState, useEffect } from 'react';
import { auth } from '../services/supabase';
import { userIdGenerator } from '../services/userIdGenerator';

export const ModernAdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'STUDENT',
    tenantCode: 'TC'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.tenantCode) {
        setErrors({ general: 'テナント情報が取得できません' });
        return;
      }

      const response = await auth.getUsersByTenant(currentUser.tenantCode);
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setErrors({ general: response.error || 'ユーザー一覧の取得に失敗しました' });
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
      setErrors({ general: 'ユーザー一覧の取得中にエラーが発生しました' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // フォーム入力の処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // バリデーション
  const validateForm = () => {
    const newErrors = {};

    if (!newUser.name.trim()) {
      newErrors.name = '名前を入力してください';
    }

    if (!newUser.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!newUser.phoneNumber.trim()) {
      newErrors.phoneNumber = '電話番号を入力してください';
    } else if (!/^\d{3}-\d{4}-\d{4}$/.test(newUser.phoneNumber)) {
      newErrors.phoneNumber = '電話番号は000-0000-0000の形式で入力してください';
    }

    if (!newUser.tenantCode.trim()) {
      newErrors.tenantCode = '塾コードを入力してください';
    } else if (!/^[A-Z]{2,4}$/.test(newUser.tenantCode)) {
      newErrors.tenantCode = '塾コードは2-4文字の大文字英字で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ユーザー作成
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const defaultPassword = 'password123';
      
      const response = await auth.signUpWithTenant(newUser.email, defaultPassword, {
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        tenantCode: newUser.tenantCode,
        role: newUser.role
      });

      if (response.success) {
        const userData = response.data;
        setSuccessMessage(
          `✅ ユーザーを作成しました！\n` +
          `🆔 ユーザーID: ${userData.userId}\n` +
          `👤 役割: ${userData.role === 'INSTRUCTOR' ? '講師' : '生徒'}\n` +
          `🔑 初期パスワード: ${defaultPassword}`
        );
        
        setNewUser({
          name: '',
          email: '',
          phoneNumber: '',
          role: 'STUDENT',
          tenantCode: newUser.tenantCode
        });
        
        setShowCreateForm(false);
        fetchUsers();
      } else {
        setErrors({ general: response.error || 'ユーザーの作成に失敗しました' });
      }
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      setErrors({ general: 'ユーザー作成中にエラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー削除
  const handleDeleteUser = async (userId) => {
    if (!confirm(`ユーザー「${userId}」を削除しますか？`)) {
      return;
    }

    try {
      const response = await auth.deleteUser(userId);
      if (response.success) {
        setSuccessMessage('✅ ユーザーを削除しました');
        fetchUsers();
      } else {
        setErrors({ general: response.error || 'ユーザーの削除に失敗しました' });
      }
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      setErrors({ general: 'ユーザー削除中にエラーが発生しました' });
    }
  };

  // 統計情報を計算
  const getStats = () => {
    const instructors = users.filter(user => user.role === 'INSTRUCTOR');
    const students = users.filter(user => user.role === 'STUDENT');
    
    return {
      totalUsers: users.length,
      instructors: instructors.length,
      students: students.length,
      maxInstructors: 99,
      maxStudents: 9900
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              ユーザー管理
            </h1>
          </div>
          <p className="text-gray-600">講師・生徒のアカウントを管理できます</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">総ユーザー数</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👨‍🏫</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">講師</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.instructors}<span className="text-sm text-gray-500">/{stats.maxInstructors}</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👨‍🎓</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">生徒</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.students}<span className="text-sm text-gray-500">/{stats.maxStudents}</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏫</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">テナント</h3>
                <p className="text-2xl font-bold text-gray-900">{newUser.tenantCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            新規ユーザー作成
          </button>
        </div>

        {/* 新規ユーザー作成フォーム */}
        {showCreateForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">➕</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">新規ユーザー作成</h3>
            </div>
            
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👤 名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  placeholder="山田太郎"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><span>⚠️</span>{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><span>⚠️</span>{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📱 電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={newUser.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="090-1234-5678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50"
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><span>⚠️</span>{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎭 役割 <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50"
                >
                  <option value="STUDENT">👨‍🎓 生徒</option>
                  <option value="INSTRUCTOR">👨‍🏫 講師</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏫 塾コード <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tenantCode"
                  value={newUser.tenantCode}
                  onChange={handleInputChange}
                  placeholder="TC"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50"
                />
                {errors.tenantCode && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><span>⚠️</span>{errors.tenantCode}</p>}
              </div>

              <div className="md:col-span-2">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-600 text-sm flex items-center gap-2">
                      <span>❌</span>{errors.general}
                    </p>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <pre className="text-green-600 text-sm whitespace-pre-wrap">{successMessage}</pre>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        作成中...
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        ユーザーを作成
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-all duration-300"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ユーザー一覧 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">ユーザー一覧</h3>
            </div>
          </div>
          
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-gray-500 text-lg">ユーザーが登録されていません</p>
              <p className="text-gray-400 text-sm mt-2">新規ユーザーを作成してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">🆔 ユーザーID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">👤 ユーザー情報</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📱 連絡先</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">🎭 役割</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📅 作成日</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">⚡ 操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">ID</span>
                          </div>
                          <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {user.user_id || user.userId || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phone_number || user.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'INSTRUCTOR' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          <span className="mr-1">
                            {user.role === 'INSTRUCTOR' ? '👨‍🏫' : '👨‍🎓'}
                          </span>
                          {user.role === 'INSTRUCTOR' ? '講師' : '生徒'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteUser(user.user_id || user.userId)}
                          className="text-red-600 hover:text-red-900 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1"
                        >
                          <span>🗑️</span>
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};