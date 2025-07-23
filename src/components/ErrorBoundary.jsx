import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  // Overloadedエラーの判定
  isOverloadedError(error) {
    if (!error || !error.message) return false;
    
    const overloadedKeywords = [
      'overloaded',
      'Overloaded',
      'rate limit',
      'too many requests',
      'retry attempt'
    ];
    
    return overloadedKeywords.some(keyword => 
      error.message.includes(keyword)
    );
  }

  // エラーメッセージの生成
  getErrorMessage(error) {
    if (this.isOverloadedError(error)) {
      return {
        title: 'サーバーが一時的に混雑しています',
        message: 'しばらく時間をおいてから再度お試しください。',
        suggestion: '数分後にページを再読み込みしてください。'
      };
    }

    // ネットワークエラーの場合
    if (error.message && error.message.includes('fetch')) {
      return {
        title: 'ネットワーク接続エラー',
        message: 'インターネット接続を確認してください。',
        suggestion: '接続を確認してから再度お試しください。'
      };
    }

    // 認証エラーの場合
    if (error.message && error.message.includes('auth')) {
      return {
        title: '認証エラー',
        message: 'ログイン情報を確認してください。',
        suggestion: '再度ログインをお試しください。'
      };
    }

    // デフォルトエラー
    return {
      title: '予期しないエラーが発生しました',
      message: 'アプリケーションで問題が発生しました。',
      suggestion: 'ページを再読み込みするか、しばらく時間をおいてから再度お試しください。'
    };
  }

  render() {
    if (this.state.hasError) {
      const errorInfo = this.getErrorMessage(this.state.error);
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {errorInfo.title}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {errorInfo.message}
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                {errorInfo.suggestion}
              </p>

              {/* デバッグ情報（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-4">
                  <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                    デバッグ情報（開発者向け）
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                    <div><strong>Error:</strong> {this.state.error.toString()}</div>
                    {this.state.errorInfo && (
                      <div><strong>Stack:</strong> {this.state.errorInfo.componentStack}</div>
                    )}
                  </div>
                </details>
              )}

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔄 ページを再読み込み
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🔄 再試行
              </button>
            </div>
          </div>
        </div>
      </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;