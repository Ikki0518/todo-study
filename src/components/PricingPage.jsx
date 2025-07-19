import { useState } from 'react'
import { SunaLogo } from './SunaLogo'

export const PricingPage = ({ onPlanSelect, onStartRegistration, onLoginClick }) => {
  const [selectedPlan, setSelectedPlan] = useState(null)

  const plans = [
    {
      id: 'basic',
      name: 'ベーシックプラン',
      price: 500,
      description: '基本的な学習プランナー機能',
      features: [
        '週間・月間プランナー',
        '目標設定・管理',
        '受験日カウントダウン',
        '基本的なタスク管理',
        '学習記録'
      ],
      stripeUrl: 'https://buy.stripe.com/test_14A8wI3Lq2G2eBJ3CweEo00',
      popular: false
    },
    {
      id: 'standard',
      name: 'スタンダードプラン',
      price: 2000,
      description: '充実した学習サポート機能',
      features: [
        'ベーシックプランの全機能',
        '参考書管理',
        '学習計画自動生成',
        '進捗分析',
        '詳細な統計情報',
        'カスタマイズ機能'
      ],
      stripeUrl: '#', // 後で設定
      popular: true
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
        'AI質問対応',
        '学習効率最適化',
        'プレミアムサポート'
      ],
      stripeUrl: '#', // 後で設定
      popular: false
    }
  ]

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan.id)
    // プラン情報を保存（後で決済時に使用）
    localStorage.setItem('selectedPlan', JSON.stringify({
      id: plan.id,
      name: plan.name,
      price: plan.price
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <SunaLogo width={180} height={85} />
          </div>
          <p className="text-xl text-gray-600 mb-2">
            あなたの学習を効率的にサポートします
          </p>
          <p className="text-gray-500">
            プランを選択して学習を始めましょう
          </p>
        </div>

        {/* 料金プラン */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              } ${selectedPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    人気プラン
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ¥{plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-2">/月</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : plan.popular
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {selectedPlan === plan.id ? '選択済み' : 'このプランを選択'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 入会手続きボタン */}
        {selectedPlan && (
          <div className="text-center mb-12">
            <button
              onClick={onStartRegistration}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-xl text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              入会手続きはこちら
            </button>
            <p className="text-gray-600 mt-4">
              選択したプラン: {plans.find(p => p.id === selectedPlan)?.name}
            </p>
          </div>
        )}

        {/* ログインボタン */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            既にアカウントをお持ちの方
          </p>
          <button
            onClick={onLoginClick}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
          >
            ログイン
          </button>
        </div>

        {/* 安心・安全の表示 */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-8 text-gray-600">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>SSL暗号化通信</span>
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
              <span>Stripe安全決済</span>
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
              <span>いつでもキャンセル可能</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}