import { useState } from 'react';
import { SunaLogo } from './SunaLogo';
import { auth } from '../services/supabase';
import { userIdGenerator } from '../services/userIdGenerator';

// Cookie管理ユーティリティ
const cookieUtils = {
  setCookie: (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },
  
  getCookie: (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  },
  
  deleteCookie: (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// 認証データの安全な保存（複数方式併用）
const secureAuthStore = {
  save: (userData, token) => {
    try {
      const authData = {
        user: userData,
        token: token,
        timestamp: Date.now(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7日間有効
      };
      
      const userDataString = JSON.stringify(userData);
      
      // 方式1: localStorage (メイン)
      localStorage.setItem('currentUser', userDataString);
      localStorage.setItem('authToken', token);
      localStorage.setItem('auth_data', JSON.stringify(authData));
      
      // 方式2: sessionStorage (バックアップ1)
      sessionStorage.setItem('currentUser', userDataString);
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('auth_data', JSON.stringify(authData));
      
      // 方式3: Cookie (バックアップ2 - 最も永続的)
      cookieUtils.setCookie('auth_user', userDataString, 7);
      cookieUtils.setCookie('auth_token', token, 7);
      cookieUtils.setCookie('auth_backup', JSON.stringify(authData), 7);
      
      // 方式4: 専用キー (バックアップ3)
      if (userData.userId) {
        localStorage.setItem(`user_${userData.userId}`, JSON.stringify(authData));
        cookieUtils.setCookie(`session_${userData.userId}`, JSON.stringify(authData), 7);
      }
      
      console.log('🔒 認証データを複数方式で保存完了');
      console.log('  - localStorage保存:', !!localStorage.getItem('currentUser'));
      console.log('  - sessionStorage保存:', !!sessionStorage.getItem('currentUser'));
      console.log('  - Cookie保存:', !!cookieUtils.getCookie('auth_user'));
      
      return true;
    } catch (error) {
      console.error('🚨 認証データ保存エラー:', error);
      return false;
    }
  },
  
  clear: () => {
    // localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_data');
    
    // sessionStorage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('auth_data');
    
    // Cookie
    cookieUtils.deleteCookie('auth_user');
    cookieUtils.deleteCookie('auth_token');
    cookieUtils.deleteCookie('auth_backup');
    
    console.log('🧹 認証データを全方式でクリア完了');
  }
};

export const LoginScreen = ({ onLogin, onRoleChange, onSignupClick }) => {
  const [formData, setFormData] = useState({
    loginField: '',
    password: ''
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

    if (!formData.loginField) {
      newErrors.loginField = 'ユーザーIDまたはメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
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
      console.log('🔐 ログイン開始:', formData.loginField);
      console.log('🌍 環境:', import.meta.env.MODE);
      console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🔑 Supabase Key存在:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // 入力値がユーザーIDかメールアドレスかを自動判定
      const isUserId = userIdGenerator.validateUserIdFormat(formData.loginField);
      const isEmail = /\S+@\S+\.\S+/.test(formData.loginField);
      
      console.log('📧 メールアドレス判定:', isEmail);
      console.log('🆔 ユーザーID判定:', isUserId);
      
      let response;
      
      if (isUserId) {
        // ユーザーIDでログイン
        try {
          response = await auth.signInWithUserId(formData.loginField, formData.password);
        } catch (error) {
          console.error('ユーザーIDログインエラー:', error);
          response = { success: false, error: error.message };
        }
        
        // APIログイン失敗時はローカルテストアカウントを確認
        if (!response.success) {
          if (formData.loginField === 'PM-0001' && formData.password === 'password') {
            const userData = {
              id: 'student-pm-0001',
              userId: 'PM-0001',
              email: 'pm0001@test.com',
              name: '学習者PM-0001',
              userRole: 'STUDENT',
              avatar_url: null,
              phoneNumber: '090-0001-0001',
              tenantCode: 'test'
            };
            
            // 多層認証システム使用（localStorage、sessionStorage、Cookie）
            const authToken = 'local-token-pm-0001';
            const saveSuccess = secureAuthStore.save(userData, authToken);
            
            if (saveSuccess) {
              console.log('✅ PM-0001多層認証データ保存成功');
            } else {
              console.error('❌ PM-0001多層認証データ保存失敗');
            }
            
            console.log('ローカルPM-0001ログイン成功:', userData);
            onRoleChange('STUDENT');
            setTimeout(() => {
              onLogin(true);
            }, 100);
            return;
          }
          
          // TC-0001: ikki_y0518@icloud.com の教師権限ログイン
          if (formData.loginField === 'TC-0001' && formData.password === 'ikki0518') {
            const userData = {
              id: 'teacher-ikki-001',
              userId: 'TC-0001',
              email: 'ikki_y0518@icloud.com',
              name: 'Ikki Yamamoto (教師)',
              userRole: 'INSTRUCTOR',
              avatar_url: null,
              phoneNumber: '090-0518-0518',
              tenantCode: 'TC',
              subscriptionActive: true,
              paymentStatus: 'completed'
            };
            
            const authToken = 'local-token-ikki-teacher';
            const saveSuccess = secureAuthStore.save(userData, authToken);
            
            if (saveSuccess) {
              console.log('✅ Ikki教師アカウント多層認証データ保存成功');
            } else {
              console.error('❌ Ikki教師アカウント多層認証データ保存失敗');
            }
            
            console.log('Ikki教師アカウントログイン成功:', userData);
            onRoleChange('INSTRUCTOR');
            setTimeout(() => {
              onLogin(true);
            }, 100);
            return;
          }
          
          // TC-0002: minnanoakogare777@gmail.com の教師権限ログイン
          if (formData.loginField === 'TC-0002' && formData.password === 'minna777') {
            const userData = {
              id: 'teacher-minna-001',
              userId: 'TC-0002',
              email: 'minnanoakogare777@gmail.com',
              name: 'Minna Teacher',
              userRole: 'INSTRUCTOR',
              avatar_url: null,
              phoneNumber: '090-7777-7777',
              tenantCode: 'TC',
              subscriptionActive: true,
              paymentStatus: 'completed'
            };
            
            const authToken = 'local-token-minna-teacher';
            const saveSuccess = secureAuthStore.save(userData, authToken);
            
            if (saveSuccess) {
              console.log('✅ Minna教師アカウント多層認証データ保存成功');
            } else {
              console.error('❌ Minna教師アカウント多層認証データ保存失敗');
            }
            
            console.log('Minna教師アカウントログイン成功:', userData);
            onRoleChange('INSTRUCTOR');
            setTimeout(() => {
              onLogin(true);
            }, 100);
            return;
          }
          
          // TC-0003: shishanxintai20@gmail.com の教師権限ログイン
          if (formData.loginField === 'TC-0003' && formData.password === 'shishan20') {
            const userData = {
              id: 'teacher-shishan-001',
              userId: 'TC-0003',
              email: 'shishanxintai20@gmail.com',
              name: 'Shishan Teacher',
              userRole: 'INSTRUCTOR',
              avatar_url: null,
              phoneNumber: '090-2020-2020',
              tenantCode: 'TC',
              subscriptionActive: true,
              paymentStatus: 'completed'
            };
            
            const authToken = 'local-token-shishan-teacher';
            const saveSuccess = secureAuthStore.save(userData, authToken);
            
            if (saveSuccess) {
              console.log('✅ Shishan教師アカウント多層認証データ保存成功');
            } else {
              console.error('❌ Shishan教師アカウント多層認証データ保存失敗');
            }
            
            console.log('Shishan教師アカウントログイン成功:', userData);
            onRoleChange('INSTRUCTOR');
            setTimeout(() => {
              onLogin(true);
            }, 100);
            return;
          }
        }
      } else if (isEmail) {
        // メールアドレスでログイン（従来システム + フォールバック）
        console.log('📧 メールアドレスログイン開始');
        try {
          console.log('🔗 Supabase認証を試行中...');
          response = await auth.signIn(formData.loginField, formData.password);
          console.log('🔗 Supabase認証結果:', response);
          
          if (!response.success) {
            // Supabase認証が失敗した場合、ローカルテストアカウントを確認
            console.log('⚠️ Supabase認証失敗、ローカルテストアカウントでの認証を試行');
            
            // テスト用講師アカウント
            if (formData.loginField === 'instructor@test.com' && formData.password === 'password123') {
              const userData = {
                id: 'instructor-test-1',
                email: 'instructor@test.com',
                name: '講師テスト',
                userRole: 'INSTRUCTOR',
                avatar_url: null,
                phoneNumber: '090-1111-2222'
              };
              localStorage.setItem('currentUser', JSON.stringify(userData));
              
              console.log('ローカル講師ログイン成功:', userData);
              onRoleChange('INSTRUCTOR');
              setTimeout(() => {
                onLogin(true);
              }, 100);
              return;
            }
            
            // テスト用生徒アカウント
            if (formData.loginField === 'student@test.com' && formData.password === 'password123') {
              const userData = {
                id: 'student-test-1',
                email: 'student@test.com',
                name: '生徒テスト',
                userRole: 'STUDENT',
                avatar_url: null,
                phoneNumber: '090-2222-3333'
              };
              localStorage.setItem('currentUser', JSON.stringify(userData));
              
              console.log('ローカル生徒ログイン成功:', userData);
              onRoleChange('STUDENT');
              setTimeout(() => {
                onLogin(true);
              }, 100);
              return;
            }
            
            // 特定ユーザーの学生権限ログイン（メールアドレス）
            if (formData.loginField === 'ikki_y0518@icloud.com' && formData.password === 'ikki0518') {
              const userData = {
                id: 'student-ikki-001',
                email: 'ikki_y0518@icloud.com',
                name: 'Ikki Yamamoto (学生)',
                userRole: 'STUDENT',
                avatar_url: null,
                phoneNumber: '090-0518-0518',
                subscriptionActive: true,
                paymentStatus: 'completed'
              };
              
              // 多層認証システム使用（localStorage、sessionStorage、Cookie）
              const authToken = 'local-token-ikki-student';
              const saveSuccess = secureAuthStore.save(userData, authToken);
              
              if (saveSuccess) {
                console.log('✅ Ikki学生アカウント多層認証データ保存成功');
              } else {
                console.error('❌ Ikki学生アカウント多層認証データ保存失敗');
              }
              
              console.log('Ikki学生アカウントログイン成功:', userData);
              onRoleChange('STUDENT');
              setTimeout(() => {
                onLogin(true);
              }, 100);
              return;
            }
            
            // minnanoakogare777@gmail.com の学生権限ログイン
            if (formData.loginField === 'minnanoakogare777@gmail.com' && formData.password === 'minna777') {
              const userData = {
                id: 'student-minna-001',
                email: 'minnanoakogare777@gmail.com',
                name: 'Minna Student',
                userRole: 'STUDENT',
                avatar_url: null,
                phoneNumber: '090-7777-7777',
                subscriptionActive: true,
                paymentStatus: 'completed'
              };
              
              const authToken = 'local-token-minna-student';
              const saveSuccess = secureAuthStore.save(userData, authToken);
              
              if (saveSuccess) {
                console.log('✅ Minna学生アカウント多層認証データ保存成功');
              } else {
                console.error('❌ Minna学生アカウント多層認証データ保存失敗');
              }
              
              console.log('Minna学生アカウントログイン成功:', userData);
              onRoleChange('STUDENT');
              setTimeout(() => {
                onLogin(true);
              }, 100);
              return;
            }
            
            // shishanxintai20@gmail.com の学生権限ログイン
            if (formData.loginField === 'shishanxintai20@gmail.com' && formData.password === 'shishan20') {
              const userData = {
                id: 'student-shishan-001',
                email: 'shishanxintai20@gmail.com',
                name: 'Shishan Student',
                userRole: 'STUDENT',
                avatar_url: null,
                phoneNumber: '090-2020-2020',
                subscriptionActive: true,
                paymentStatus: 'completed'
              };
              
              const authToken = 'local-token-shishan-student';
              const saveSuccess = secureAuthStore.save(userData, authToken);
              
              if (saveSuccess) {
                console.log('✅ Shishan学生アカウント多層認証データ保存成功');
              } else {
                console.error('❌ Shishan学生アカウント多層認証データ保存失敗');
              }
              
              console.log('Shishan学生アカウントログイン成功:', userData);
              onRoleChange('STUDENT');
              setTimeout(() => {
                onLogin(true);
              }, 100);
              return;
            }
          }
        } catch (error) {
          console.error('メール認証エラー:', error);
          response = { success: false, error: error.message || 'ログイン処理中にエラーが発生しました' };
        }
      } else if (isUserId || formData.loginField === 'PM-0001' || formData.loginField === 'TC-0001') {
        // ユーザーIDでのローカルテストアカウント確認（直接判定も含む）
        console.log('🔍 ローカルテストアカウントブロック実行:', {
          isUserId: isUserId,
          loginField: formData.loginField,
          条件判定: formData.loginField === 'PM-0001' || formData.loginField === 'TC-0001'
        });
        
        if (formData.loginField === 'PM-0001' && formData.password === 'password') {
          console.log('🎯 PM-0001処理ブロック開始!');
          const userData = {
            id: 'student-pm-0001',
            userId: 'PM-0001',
            email: 'pm0001@test.com',
            name: '学習者PM-0001',
            userRole: 'STUDENT',
            avatar_url: null,
            phoneNumber: '090-0001-0001',
            tenantCode: 'test'
          };
          
          // 多層認証システム使用（localStorage、sessionStorage、Cookie）
          const authToken = 'local-token-pm-0001';
          const saveSuccess = secureAuthStore.save(userData, authToken);
          
          if (saveSuccess) {
            console.log('✅ PM-0001多層認証データ保存成功');
          } else {
            console.error('❌ PM-0001多層認証データ保存失敗');
          }
          
          console.log('ローカルPM-0001ログイン成功:', userData);
          onRoleChange('STUDENT');
          setTimeout(() => {
            onLogin(true);
          }, 100);
          return;
        }
        
        if (formData.loginField === 'TC-0001' && formData.password === 'password') {
          const userData = {
            id: 'instructor-tc-0001',
            userId: 'TC-0001',
            email: 'tc0001@test.com',
            name: '講師TC-0001',
            userRole: 'INSTRUCTOR',
            avatar_url: null,
            phoneNumber: '090-0001-0002',
            tenantCode: 'test'
          };
          secureAuthStore.save(userData, response.data.token || 'api-token');
          localStorage.setItem('authToken', 'local-token-tc-0001');
          
          console.log('ローカルTC-0001ログイン成功:', userData);
          onRoleChange('INSTRUCTOR');
          setTimeout(() => {
            onLogin(true);
          }, 100);
          return;
        }
      } else {
        // 無効な形式
        setErrors({ general: 'ユーザーIDまたはメールアドレスの形式が正しくありません' });
        return;
      }

      if (response.success) {
        const user = response.data.user;
        console.log('ログイン成功:', user);
        
        // ロール判定（新システムの場合）
        let userRole = user.role;
        if (user.userId && !userRole) {
          userRole = userIdGenerator.getRoleFromUserId(user.userId);
        }
        
        // instructor@test.comの場合は強制的にINSTRUCTORロールを設定（従来システム互換）
        if (user.email === 'instructor@test.com') {
          userRole = 'INSTRUCTOR';
          console.log('instructor@test.comでログイン - INSTRUCTORロールを強制設定');
        } else if (!userRole) {
          userRole = 'STUDENT';
          console.log('ロール情報が取得できないため、STUDENTロールを設定');
        }
        
        const userData = {
          id: user.id,
          userId: user.userId,
          email: user.email,
          name: user.name || 'ユーザー',
          userRole: userRole,
          tenantCode: user.tenantCode,
          avatar_url: user.avatar_url,
          phoneNumber: user.phoneNumber
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        console.log('ログイン完了 - ロール:', userRole);
        onRoleChange(userRole);
        setTimeout(() => {
          onLogin(true);
        }, 100);
      } else {
        let errorMessage = 'ログインに失敗しました';
        
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (typeof response.error === 'object' && response.error.message) {
            errorMessage = response.error.message;
          } else if (typeof response.error === 'object') {
            try {
              errorMessage = JSON.stringify(response.error);
            } catch (e) {
              errorMessage = 'ログインエラーが発生しました';
            }
          }
        }
        
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      let errorMessage = 'ログイン処理中にエラーが発生しました';
      
      if (error && typeof error === 'object') {
        if (error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.toString && typeof error.toString === 'function') {
          try {
            errorMessage = error.toString();
          } catch (e) {
            // toString()でエラーが発生した場合はデフォルトメッセージを使用
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <SunaLogo width={90} height={45} />
          </div>
          <p className="text-gray-600 mt-2">アカウントにログイン</p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">ログイン</h2>
          <p className="text-sm text-gray-600 mt-1">ユーザーIDまたはメールアドレスでログイン</p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ユーザーID または メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="loginField"
              value={formData.loginField}
              onChange={handleInputChange}
              placeholder="PM-0001 または example@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.loginField && <p className="text-red-500 text-sm mt-1">{errors.loginField}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="パスワードを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '処理中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            アカウントをお持ちでない方
          </p>
          <button
            onClick={onSignupClick}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            新規登録はこちら
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Supabaseで安全に管理</p>
        </div>
      </div>
    </div>
  );
};