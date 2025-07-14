import { useState } from 'react'

export const RegistrationFlow = ({ onComplete, onBack, selectedPlan, onLoginClick }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    termsAccepted: false
  })
  
  // プラン選択のローカル状態を移動
  const savedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}')
  const [localSelectedPlan, setLocalSelectedPlan] = useState(savedPlan.id || 'basic')

  const steps = [
    { number: 1, title: 'システム概要' },
    { number: 2, title: 'アカウント作成' },
    { number: 3, title: 'プラン選択・決済' },
    { number: 4, title: '登録完了' }
  ]

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      // システム概要から次へ
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // アカウント作成の検証
      if (!formData.username || !formData.email || !formData.password || !formData.termsAccepted) {
        alert('すべての項目を入力してください')
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      // プラン選択・決済から決済処理へ
      processPlanRegistration()
    }
  }

  const processPlanRegistration = () => {
    // ユーザー情報を保存
    const userInfo = {
      username: formData.username,
      email: formData.email,
      registeredAt: new Date().toISOString(),
      userId: `user_${Date.now()}`, // ユニークなユーザーID生成
      paymentStatus: 'pending'
    }
    
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    
    // 決済処理（Stripe）
    const plan = JSON.parse(localStorage.getItem('selectedPlan'))
    if (plan && (plan.id === 'basic' || plan.id === 'standard')) {
      localStorage.setItem('paymentStatus', 'pending')
      localStorage.setItem('pendingUserId', userInfo.userId)
      
      // 決済完了後のリダイレクト先を設定
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment_success=true&user_id=${userInfo.userId}`
      
      // Stripe決済ページへリダイレクト
      window.location.href = 'https://buy.stripe.com/test_14A8wI3Lq2G2eBJ3CweEo00'
    } else {
      alert('現在ベーシックプランのみ利用可能です')
    }
  }

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep >= step.number 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'border-gray-300 text-gray-400'
          }`}>
            {step.number}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-20 h-0.5 mx-4 ${
              currentStep > step.number ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStepTitles = () => (
    <div className="flex justify-center mb-12">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="text-center">
            <p className={`text-sm ${
              currentStep >= step.number ? 'text-blue-600 font-semibold' : 'text-gray-400'
            }`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && <div className="w-20" />}
        </div>
      ))}
    </div>
  )

  const renderSystemIntroduction = () => (
    <div className="max-w-4xl mx-auto">
      {/* 背景にシステム画面を薄く表示 */}
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* 背景画像（システム使用画面のイメージ） */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
        <div className="absolute inset-0 bg-white/80"></div>
        
        {/* メインコンテンツ */}
        <div className="relative z-10 p-12 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI学習プランナー
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              あなたの学習を効率的にサポートする次世代学習管理システム
            </p>
          </div>

          {/* 機能紹介 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-blue-100">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                スマートな学習計画
              </h3>
              <p className="text-gray-600 text-sm">
                AIがあなたの学習スタイルに合わせて最適な学習計画を自動生成
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-blue-100">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                進捗可視化
              </h3>
              <p className="text-gray-600 text-sm">
                学習の進捗状況をリアルタイムで確認し、モチベーションを維持
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-blue-100">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                パーソナライズ
              </h3>
              <p className="text-gray-600 text-sm">
                個人の学習パターンを分析し、最適化された学習体験を提供
              </p>
            </div>
          </div>

          {/* システム画面のプレビュー */}
          <div className="mb-8">
            <div className="bg-gray-100 rounded-lg p-8 border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">
                📊 システム使用画面のプレビュー
              </p>
              <p className="text-gray-400 text-sm mt-2">
                実際のカレンダー、タスク管理、進捗表示画面
              </p>
            </div>
          </div>

          <button
            onClick={handleNextStep}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-xl text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            始める
          </button>
        </div>
      </div>
    </div>
  )

  const renderAccountCreation = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dラボ</h2>
        <p className="text-gray-600">サービスのお申し込み</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ユーザ名
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleFormChange('username', e.target.value)}
            placeholder="ユーザ名"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            placeholder="example@email.com"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            ※ご連絡メールアドレスに「@icloud.com」をご登録されると、
            確認メールが届かない可能性がございます。お控えいただきますが、
            「@icloud.com」でのご登録をお控えください。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            パスワード　※半角英数・6文字〜20文字で入力してください
          </label>
          <div className="relative">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => handleFormChange('termsAccepted', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-3 text-sm text-gray-700">
            <a href="#" className="text-blue-600 underline">利用規約・プライバシーポリシー</a>
            に同意する
          </label>
        </div>

        <button
          onClick={handleNextStep}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          続ける
        </button>

        <button
          onClick={onBack}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          アカウントをお持ちの方はこちら
        </button>
      </div>
    </div>
  )

  const renderPlanRegistration = () => {
    const plans = [
      {
        id: 'standard',
        name: 'スタンダードプラン',
        originalPrice: 2000,
        price: 500,
        description: '充実した学習サポート機能（特別価格）',
        isOnSale: true,
        features: [
          '週間・月間プランナー',
          '目標設定・管理',
          '受験日カウントダウン',
          '参考書管理',
          '学習計画自動生成',
          '進捗分析'
        ]
      },
      {
        id: 'premium',
        name: 'プレミアムプラン',
        price: 5000,
        description: 'AI搭載の最上位プラン',
        features: [
          'スタンダードプランの全機能',
          'AI学習アシスタント',
          'パーソナライズされた学習提案',
          'AI質問対応'
        ]
      }
    ]

    const handlePlanSelect = (planId) => {
      setLocalSelectedPlan(planId)
      const selectedPlan = plans.find(p => p.id === planId)
      localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan))
    }

    const selectedPlanData = plans.find(p => p.id === localSelectedPlan)
    
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">プラン選択・支払い方法</h2>
          <p className="text-gray-600">最適なプランを選択してください</p>
        </div>

        {/* プラン選択 */}
        <div className="space-y-4 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                localSelectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  {plan.isOnSale ? (
                    <div>
                      <p className="text-lg text-gray-400 line-through mb-1">
                        ¥{plan.originalPrice.toLocaleString()}
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        ¥{plan.price.toLocaleString()}
                      </p>
                      <p className="text-red-500 text-sm font-semibold">特別価格</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        ¥{plan.price.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-sm">/月</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 登録情報確認 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">登録情報</h4>
          <div className="text-sm text-gray-600">
            <p>ユーザー名: {formData.username}</p>
            <p>メールアドレス: {formData.email}</p>
            <p>選択プラン: {selectedPlanData?.name}</p>
          </div>
        </div>

        <button
          onClick={handleNextStep}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
        >
          決済に進む
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white py-4 px-6 mb-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold">AI学習プランナー</div>
            <div className="text-sm text-gray-300">効率的な学習をサポート</div>
          </div>
          <button
            onClick={onLoginClick}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm"
          >
            ログイン
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {renderStepIndicator()}
        {renderStepTitles()}
        
        {currentStep === 1 && renderSystemIntroduction()}
        {currentStep === 2 && renderAccountCreation()}
        {currentStep === 3 && renderPlanRegistration()}
        {currentStep === 4 && (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">登録完了！</h2>
            <p className="text-gray-600 mb-6">
              AI学習プランナーへの登録が完了しました。<br />
              学習を始めましょう！
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              学習を開始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}