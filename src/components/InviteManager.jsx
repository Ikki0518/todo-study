import React, { useState, useEffect } from 'react';

export function InviteManager({ currentUser }) {
  const [invitations, setInvitations] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'STUDENT'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // モックデータを使用（APIサーバーが利用できない場合）
  const mockInvitations = [
    {
      id: 1,
      email: 'student1@example.com',
      role: 'STUDENT',
      status: 'pending',
      createdAt: '2025-01-10T10:00:00Z',
      expiresAt: '2025-01-17T10:00:00Z'
    },
    {
      id: 2,
      email: 'teacher1@example.com',
      role: 'INSTRUCTOR',
      status: 'accepted',
      createdAt: '2025-01-09T15:30:00Z',
      expiresAt: '2025-01-16T15:30:00Z'
    }
  ];

  // 招待一覧を取得（モックデータを使用）
  const fetchInvitations = async () => {
    try {
      // APIサーバーが利用できない場合はモックデータを使用
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      setInvitations(mockInvitations);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // 招待を作成（モック実装）
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // モック実装：新しい招待を作成
      const newInvitation = {
        id: Date.now(),
        email: formData.email,
        role: formData.role,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7日後
      };

      setInvitations(prev => [...prev, newInvitation]);
      setMessage({ 
        type: 'success', 
        text: `招待を作成しました: ${formData.email}` 
      });
      setFormData({ email: '', role: 'STUDENT' });
      setShowInviteForm(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '招待の作成に失敗しました' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 招待を削除（モック実装）
  const handleDeleteInvite = async (inviteId) => {
    if (!confirm('この招待を削除しますか？')) return;

    try {
      setInvitations(prev => prev.filter(inv => inv.id !== inviteId));
      setMessage({ 
        type: 'success', 
        text: '招待を削除しました' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '招待の削除に失敗しました' 
      });
    }
  };

  // 招待を再送信（モック実装）
  const handleResendInvite = async (inviteId) => {
    try {
      setMessage({ 
        type: 'success', 
        text: '招待を再送信しました' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '招待の再送信に失敗しました' 
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '保留中' },
      accepted: { color: 'bg-green-100 text-green-800', text: '承認済み' },
      expired: { color: 'bg-red-100 text-red-800', text: '期限切れ' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📧</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              招待管理
            </h1>
          </div>
          <p className="text-gray-600">新しいユーザーを招待して、システムに参加してもらいましょう</p>
        </div>

        {/* メッセージ表示 */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              {message.text}
            </div>
          </div>
        )}

        {/* 新規招待ボタン */}
        <div className="mb-8">
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            新規招待作成
          </button>
        </div>

        {/* 招待作成フォーム */}
        {showInviteForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📧</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">新規招待作成</h3>
            </div>
            
            <form onSubmit={handleCreateInvite} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎭 役割 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50"
                >
                  <option value="STUDENT">👨‍🎓 生徒</option>
                  <option value="INSTRUCTOR">👨‍🏫 講師</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      送信中...
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      招待を送信
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-all duration-300"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 招待一覧 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">招待一覧</h3>
            </div>
          </div>
          
          {invitations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-gray-500 text-lg">招待がありません</p>
              <p className="text-gray-400 text-sm mt-2">新規招待を作成してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📧 メールアドレス</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">🎭 役割</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📊 ステータス</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📅 作成日</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">⏰ 期限</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">⚡ 操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          invitation.role === 'INSTRUCTOR' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          <span className="mr-1">
                            {invitation.role === 'INSTRUCTOR' ? '👨‍🏫' : '👨‍🎓'}
                          </span>
                          {invitation.role === 'INSTRUCTOR' ? '講師' : '生徒'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invitation.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invitation.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invitation.expiresAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => handleResendInvite(invitation.id)}
                            className="text-blue-600 hover:text-blue-900 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 inline-flex"
                          >
                            <span>📤</span>
                            再送信
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvite(invitation.id)}
                          className="text-red-600 hover:text-red-900 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 inline-flex"
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
}