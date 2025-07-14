import { useState, useEffect } from 'react';
import { auth } from '../services/supabase';
import { userIdGenerator } from '../services/userIdGenerator';

export const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'STUDENT', // INSTRUCTOR or STUDENT
    tenantCode: 'TC'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

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
    
    // エラーをクリア
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
      // デフォルトパスワードを生成（後で変更可能）
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
          `ユーザーを作成しました！\n` +
          `ユーザーID: ${userData.userId}\n` +
          `役割: ${userData.role === 'INSTRUCTOR' ? '講師' : '生徒'}\n` +
          `初期パスワード: ${defaultPassword}`
        );
        
        // フォームをリセット
        setNewUser({
          name: '',
          email: '',
          phoneNumber: '',
          role: 'STUDENT',
          tenantCode: newUser.tenantCode // テナントコードは保持
        });
        
        // ユーザー一覧を更新
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
        setSuccessMessage('ユーザーを削除しました');
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">ユーザー管理</h2>
        
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">総ユーザー数</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">講師</h3>
            <p className="text-2xl font-bold text-green-900">{stats.instructors}/{stats.maxInstructors}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">生徒</h3>
            <p className="text-2xl font-bold text-purple-900">{stats.students}/{stats.maxStudents}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">テナント</h3>
            <p className="text-2xl font-bold text-gray-900">{newUser.tenantCode}</p>
          </div>
        </div>

        {/* 新規ユーザー作成フォーム */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">新規ユーザー作成</h3>
          
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                placeholder="山田太郎"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={newUser.phoneNumber}
                onChange={handleInputChange}
                placeholder="090-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                役割 <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="STUDENT">生徒</option>
                <option value="INSTRUCTOR">講師</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                塾コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenantCode"
                value={newUser.tenantCode}
                onChange={handleInputChange}
                placeholder="TC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.tenantCode && <p className="text-red-500 text-sm mt-1">{errors.tenantCode}</p>}
            </div>

            <div className="md:col-span-2">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <pre className="text-green-600 text-sm whitespace-pre-wrap">{successMessage}</pre>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '作成中...' : 'ユーザーを作成'}
              </button>
            </div>
          </form>
        </div>

        {/* ユーザー一覧 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ユーザー一覧</h3>
          
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ユーザーが登録されていません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザーID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話番号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-blue-600">{user.userId}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.phoneNumber}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'INSTRUCTOR' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'INSTRUCTOR' ? '講師' : '生徒'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteUser(user.userId)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
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