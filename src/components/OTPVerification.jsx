import { useState, useEffect } from 'react';
import SunaLogo from './SunaLogo';
import authService from '../services/authService';

export const OTPVerification = ({ email, onVerificationSuccess, onBack }) => {
  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // カウントダウンタイマー
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // 数字のみ許可
    if (value.length <= 6) {
      setOtpCode(value);
      if (errors.otpCode) {
        setErrors(prev => ({ ...prev, otpCode: '' }));
      }
      if (successMessage) {
        setSuccessMessage('');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!otpCode) {
      newErrors.otpCode = '確認コードを入力してください';
    } else if (otpCode.length !== 6) {
      newErrors.otpCode = '確認コードは6桁で入力してください';
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
      const result = await authService.verifyOTP(email, otpCode);
      
      if (result.success) {
        setSuccessMessage('認証が完了しました！');
        setTimeout(() => {
          onVerificationSuccess(result.user);
        }, 1000);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('OTP認証エラー:', error);
      setErrors({ general: 'システムエラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const result = await authService.resendOTP(email);
      
      if (result.success) {
        setSuccessMessage(result.message);
        setCountdown(60);
        setCanResend(false);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('OTP再送信エラー:', error);
      setErrors({ general: 'OTP再送信中にエラーが発生しました。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mt-6 flex justify-center">
            {/* Sunaロゴ */}
            <div className="flex flex-col items-center">
              <SunaLogo width={130} height={65} />
              <div className="w-12 h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1"></div>
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            メール認証
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* 説明 */}
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">確認コードを入力してください</h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{email}</span> に送信された<br/>
              6桁の確認コードを入力してください
            </p>
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

          {/* OTP入力フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                確認コード
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={handleInputChange}
                className={`w-full p-4 text-center text-2xl font-mono tracking-widest border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.otpCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000000"
                maxLength="6"
                disabled={isLoading}
                autoComplete="one-time-code"
              />
              {errors.otpCode && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.otpCode}</p>
              )}
            </div>

            {/* 認証ボタン */}
            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isLoading || otpCode.length !== 6
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
                  認証中...
                </div>
              ) : (
                '認証する'
              )}
            </button>
          </form>

          {/* 再送信とバック */}
          <div className="mt-6 space-y-3">
            {/* 再送信 */}
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                >
                  確認コードを再送信
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  確認コードを再送信できます ({countdown}秒後)
                </p>
              )}
            </div>

            {/* 戻るボタン */}
            <div className="text-center">
              <button
                onClick={onBack}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
              >
                ← 登録画面に戻る
              </button>
            </div>
          </div>

          {/* 説明 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                メールが届かない場合は、迷惑メールフォルダもご確認ください
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};