import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export function InviteManager({ currentUser }) {
  const [invitations, setInvitations] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'STUDENT'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 招待一覧を取得
  const fetchInvitations = async () => {
    try {
      const response = await apiService.get('/auth/invitations');
      if (response.success) {
        setInvitations(response.data.invitations);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // 招待を作成
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiService.post('/auth/invite', {
        email: formData.email,
        role: formData.role,
        instructorId: currentUser.id
      });

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `招待リンクを作成しました: ${response.data.inviteUrl}` 
        });
        setFormData({ email: '', role: 'STUDENT' });
        setShowInviteForm(false);
        fetchInvitations();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '招待の作成に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // 招待を削除
  const handleRevokeInvite = async (inviteId) => {
    if (!confirm('この招待を削除しますか？')) return;

    try {
      const response = await apiService.delete(`/auth/invitations/${inviteId}`);
      if (response.success) {
        setMessage({ type: 'success', text: '招待を削除しました' });
        fetchInvitations();
      }
    } catch (error) {
      setMessage({ type: 'error', text: '招待の削除に失敗しました' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">招待管理</h2>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            新しい招待を作成
          </button>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {showInviteForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">新しい招待</h3>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {currentUser.userRole === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役割
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STUDENT">生徒</option>
                    <option value="INSTRUCTOR">講師</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? '作成中...' : '招待を送信'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">招待一覧</h3>
          {invitations.length === 0 ? (
            <p className="text-gray-500">招待はまだありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      役割
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invite.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invite.role === 'STUDENT' ? '生徒' : '講師'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invite.used_at 
                            ? 'bg-green-100 text-green-800' 
                            : new Date(invite.expires_at) < new Date()
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invite.used_at 
                            ? '使用済み' 
                            : new Date(invite.expires_at) < new Date()
                            ? '期限切れ'
                            : '未使用'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invite.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {!invite.used_at && new Date(invite.expires_at) > new Date() && (
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        )}
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
}