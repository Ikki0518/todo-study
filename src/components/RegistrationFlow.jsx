import { useState } from 'react'
import { SunaLogo } from './SunaLogo'

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
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // アカウント作成の検証
      if (!formData.lastName || !formData.firstName || !formData.email || !formData.password || !formData.termsAccepted) {
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
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景にブラーされたシステムインターフェース要素 */}
      <div className="absolute inset-0">
        {/* ベース背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/60"></div>
        
        {/* ブラーされたシステム要素 - ダッシュボード */}
        <div className="absolute top-10 left-10 w-80 h-60 bg-white/30 rounded-2xl blur-sm transform rotate-3">
          <div className="p-6 space-y-4">
            <div className="h-4 bg-blue-200/60 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-300/50 rounded w-full"></div>
              <div className="h-2 bg-gray-300/50 rounded w-2/3"></div>
              <div className="h-2 bg-gray-300/50 rounded w-5/6"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-8 bg-green-200/40 rounded"></div>
              <div className="h-8 bg-purple-200/40 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* ブラーされたカレンダー要素 */}
        <div className="absolute top-20 right-16 w-72 h-48 bg-white/25 rounded-xl blur-sm transform -rotate-2">
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-3">
              {Array.from({length: 7}).map((_, i) => (
                <div key={i} className="h-3 bg-blue-300/40 rounded-sm"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 21}).map((_, i) => (
                <div key={i} className="h-6 bg-gray-200/30 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* ブラーされたタスクリスト */}
        <div className="absolute bottom-20 left-20 w-64 h-52 bg-white/20 rounded-2xl blur-sm transform rotate-1">
          <div className="p-5 space-y-3">
            <div className="h-3 bg-emerald-200/50 rounded w-1/2"></div>
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400/40 rounded-full"></div>
                <div className="h-2 bg-gray-300/40 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ブラーされたチャート要素 */}
        <div className="absolute bottom-16 right-12 w-56 h-44 bg-white/15 rounded-xl blur-sm transform -rotate-1">
          <div className="p-4">
            <div className="h-3 bg-purple-300/40 rounded w-2/3 mb-4"></div>
            <div className="flex items-end justify-between h-20">
              {Array.from({length: 8}).map((_, i) => (
                <div
                  key={i}
                  className="bg-indigo-300/40 rounded-t w-4"
                  style={{height: `${Math.random() * 60 + 20}%`}}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* フロストグラス効果のメインコンテナ */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 py-16 sm:px-8 lg:px-12">
          
          {/* フロストグラス効果のメインコンテンツカード */}
          <div className="relative backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            
            {/* サブルなグラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-blue-50/20 pointer-events-none"></div>
            
            <div className="relative z-10 p-8 sm:p-12 lg:p-16">
              
              {/* ヘッダーセクション */}
              <div className="text-center mb-16 space-y-8">
                <div className="animate-fade-in-up">
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <SunaLogo width={220} height={105} />
                      {/* ロゴ周りのサブルな光の効果 */}
                      <div className="absolute -inset-4 bg-gradient-radial from-blue-200/20 via-transparent to-transparent rounded-full blur-xl"></div>
                    </div>
                  </div>
                </div>
                
                <div className="animate-fade-in-up delay-300">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    次世代の学習管理
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      システム
                    </span>
                  </h1>
                  <p className="text-xl sm:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                    AIと直感的なデザインが融合した、
                    <br className="hidden sm:block" />
                    効率的で美しい学習プラットフォーム
                  </p>
                </div>
              </div>

              {/* 機能紹介セクション - フロストグラス効果 */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    title: "スマート学習計画",
                    description: "AIがあなたの学習パターンを分析し、最適な学習計画を自動で作成します",
                    gradient: "from-blue-500 to-blue-600"
                  },
                  {
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    title: "進捗の可視化",
                    description: "学習の進捗状況を分かりやすいグラフで表示し、モチベーションをサポートします",
                    gradient: "from-emerald-500 to-teal-600"
                  },
                  {
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                    title: "個人最適化",
                    description: "あなたの学習スタイルに合わせて、インターフェースと機能をカスタマイズできます",
                    gradient: "from-purple-500 to-pink-600"
                  }
                ].map((feature, index) => (
                  <div key={index} className={`group animate-fade-in-up delay-${400 + index * 200}`}>
                    <div className="relative backdrop-blur-lg bg-white/60 rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl hover:bg-white/70 transition-all duration-500 transform hover:-translate-y-2">
                      {/* カードの内部グラデーション */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-50/10 rounded-2xl pointer-events-none"></div>
                      
                      <div className="relative z-10">
                        <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg backdrop-blur-sm`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                          {feature.title}
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed text-center">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>


              {/* CTAセクション - フロストグラス効果 */}
              <div className="text-center animate-fade-in-up delay-1200">
                <div className="relative">
                  <button
                    onClick={handleNextStep}
                    className="relative group inline-flex items-center justify-center px-12 py-5 text-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50 backdrop-blur-sm"
                  >
                    {/* ボタンの内部光効果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    
                    <span className="relative flex items-center">
                      学習を始める
                      <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                  
                  <p className="text-gray-600 text-sm mt-6">
                    ✨ 直感的なセットアップ • 🔒 エンタープライズグレードのセキュリティ
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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="mb-4 flex justify-center">
          <SunaLogo width={90} height={45} />
        </div>
        <p className="text-gray-600">アカウントにログイン</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              placeholder="姓"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              placeholder="名"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
          onClick={onLoginClick}
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
            <SunaLogo width={90} height={45} textColor="light" />
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
              Sunaへの登録が完了しました。<br />
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