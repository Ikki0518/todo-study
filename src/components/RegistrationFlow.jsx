import { useState } from 'react'
import { SunaLogo } from './SunaLogo'
import sessionService from '../services/sessionService'

export const RegistrationFlow = ({ onComplete, onBack, selectedPlan, onLoginClick }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    password: '',
    termsAccepted: false
  })
  
  // プラン選択のローカル状態を移動
  const savedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}')
  const [localSelectedPlan, setLocalSelectedPlan] = useState(savedPlan.id || 'basic')

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      // システム概要から次へ
      // チェックポイント: システム概要閲覧完了
      sessionService.recordCheckpoint(sessionService.CHECKPOINTS.SYSTEM_OVERVIEW_VIEWED, {
        timestamp: new Date().toISOString(),
        nextStep: 'user_registration'
      })
      
      // 現在のビューを更新
      sessionService.updateCurrentView(sessionService.VIEWS.REGISTRATION)
      
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // アカウント作成の検証
      if (!formData.lastName || !formData.firstName || !formData.email || !formData.password || !formData.termsAccepted) {
        alert('すべての項目を入力してください')
        return
      }
      
      // チェックポイント: ユーザー登録開始
      sessionService.recordCheckpoint(sessionService.CHECKPOINTS.USER_REGISTRATION_STARTED, {
        email: formData.email,
        fullName: `${formData.lastName} ${formData.firstName}`,
        timestamp: new Date().toISOString()
      })
      
      setCurrentStep(3)
    } else if (currentStep === 3) {
      // プラン選択・決済から決済処理へ
      // チェックポイント: 決済プロセス開始
      sessionService.recordCheckpoint(sessionService.CHECKPOINTS.PAYMENT_PROCESS_STARTED, {
        selectedPlan: localSelectedPlan,
        timestamp: new Date().toISOString()
      })
      
      // 現在のビューを更新
      sessionService.updateCurrentView(sessionService.VIEWS.PRICING)
      
      processPlanRegistration()
    }
  }

  const processPlanRegistration = () => {
    // ユーザー情報を保存
    const userInfo = {
      lastName: formData.lastName,
      firstName: formData.firstName,
      fullName: `${formData.lastName} ${formData.firstName}`,
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


  const renderSystemIntroduction = () => (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* 背景にシンプルなグラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/60"></div>
      
      {/* メインコンテナ */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl mx-auto">
          
          {/* フロストグラス効果のメインコンテンツカード */}
          <div className="relative backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            
            {/* サブルなグラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-blue-50/20 pointer-events-none"></div>
            
            <div className="relative z-10 p-8 sm:p-10 lg:p-12">
              
              {/* ヘッダーセクション */}
              <div className="text-center mb-10 space-y-4">
                <div className="animate-fade-in-up">
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <SunaLogo width={120} height={60} />
                      {/* ロゴ周りのサブルな光の効果 */}
                      <div className="absolute -inset-4 bg-gradient-radial from-blue-200/20 via-transparent to-transparent rounded-full blur-xl"></div>
                    </div>
                  </div>
                </div>
                
                <div className="animate-fade-in-up delay-300">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    次世代の学習管理
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      システム
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                    AIと直感的なデザインが融合した、効率的で美しい学習プラットフォーム
                  </p>
                </div>
              </div>

              {/* 機能紹介セクション */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    title: "スマート学習計画",
                    description: "AIが最適な学習計画を自動作成",
                    gradient: "from-blue-500 to-blue-600"
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    title: "進捗の可視化",
                    description: "学習状況を分かりやすく表示",
                    gradient: "from-emerald-500 to-teal-600"
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                    title: "個人最適化",
                    description: "学習スタイルに合わせてカスタマイズ",
                    gradient: "from-purple-500 to-pink-600"
                  }
                ].map((feature, index) => (
                  <div key={index} className={`group animate-fade-in-up delay-${400 + index * 200}`}>
                    <div className="relative backdrop-blur-lg bg-white/60 rounded-xl p-6 border border-white/40 shadow-lg hover:shadow-xl hover:bg-white/70 transition-all duration-300 transform hover:-translate-y-1 h-full">
                      {/* カードの内部グラデーション */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-50/10 rounded-xl pointer-events-none"></div>
                      
                      <div className="relative z-10 text-center">
                        <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAセクション */}
              <div className="text-center animate-fade-in-up delay-1200">
                <div className="relative">
                  <button
                    onClick={handleNextStep}
                    className="relative group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  >
                    {/* ボタンの内部光効果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    
                    <span className="relative flex items-center">
                      学習を始める
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                  
                  <p className="text-gray-600 text-sm mt-4">
                    ✨ 直感的なセットアップ • 🔒 セキュリティ対応
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAccountCreation = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="text-center mb-4">
              <div className="mb-2 flex justify-center">
                <SunaLogo width={50} height={25} />
              </div>
              <p className="text-gray-600 text-sm">アカウント作成</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    姓
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    placeholder="姓"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    名
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    placeholder="名"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  ※@icloud.comでのご登録はお控えください
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  パスワード（半角英数・6〜20文字）
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    className="w-full px-2 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-2 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="mt-1 h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-xs text-gray-700">
                  <a href="#" className="text-blue-600 underline">利用規約・プライバシーポリシー</a>
                  に同意する
                </label>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleNextStep}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                >
                  続ける
                </button>

                <button
                  onClick={onLoginClick}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                >
                  アカウントをお持ちの方はこちら
                </button>
              </div>
            </div>
          </div>
        </div>
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
          '参考書管理'
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
          'パーソナライズされた学習提案'
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
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-gray-900 mb-1">プラン選択・支払い方法</h2>
                <p className="text-gray-600 text-xs">最適なプランを選択してください</p>
              </div>

              {/* プラン選択 */}
              <div className="space-y-2 mb-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      localSelectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {plan.name}
                        </h3>
                        <p className="text-gray-600 text-xs mb-1">{plan.description}</p>
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <svg className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right ml-2">
                        {plan.isOnSale ? (
                          <div>
                            <p className="text-xs text-gray-400 line-through mb-0.5">
                              ¥{plan.originalPrice.toLocaleString()}
                            </p>
                            <p className="text-sm font-bold text-red-600">
                              ¥{plan.price.toLocaleString()}
                            </p>
                            <p className="text-red-500 text-xs font-semibold">特別価格</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-bold text-blue-600">
                              ¥{plan.price.toLocaleString()}
                            </p>
                            <p className="text-gray-500 text-xs">/月</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 登録情報確認 - コンパクトに */}
              <div className="bg-gray-50 rounded-lg p-2 mb-3">
                <h4 className="font-semibold text-gray-900 mb-1 text-xs">登録情報</h4>
                <div className="text-xs text-gray-600">
                  <p>ユーザー名: {formData.lastName} {formData.firstName}</p>
                  <p>メールアドレス: {formData.email}</p>
                  <p>選択プラン: {selectedPlanData?.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleNextStep}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                >
                  決済に進む
                </button>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* ヘッダー */}
      <header className="bg-gray-900 text-white py-3 px-4 sm:py-4 sm:px-6 flex-shrink-0 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SunaLogo width={60} height={30} textColor="light" />
            <div className="text-sm text-gray-200 hidden sm:block">効率的な学習をサポート</div>
          </div>
          <button
            onClick={onLoginClick}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ログイン
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {currentStep === 1 && renderSystemIntroduction()}
        {currentStep === 2 && renderAccountCreation()}
        {currentStep === 3 && renderPlanRegistration()}
        {currentStep === 4 && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-sm">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">登録完了！</h2>
                  <p className="text-gray-600 mb-6 text-sm">
                    Sunaへの登録が完了しました。<br />
                    学習を始めましょう！
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors text-sm"
                  >
                    学習を開始
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}