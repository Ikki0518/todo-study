// OpenAI API サービス
class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  async createChatCompletion(messages, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'chatgpt-4o-latest',
          messages: messages,
          temperature: 0.8,
          max_tokens: 1000,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // フォールバック: APIキーがない場合のデモ応答
      if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
        return this.getDemoResponse(messages);
      }
      // その他のエラー時は愛嬌のあるエラーメッセージを返す
      return "あ、ちょっと調子が悪いみたいです😅 もう一度お話しかけてもらえますか？";
    }
  }

  // パーソナライズモード用のシステムプロンプト
  getPersonalizeSystemPrompt() {
    return `### 【システムプロンプト】パーソナライズモード構築指示書

#### # 役割 (Role)
あなたは、ユーザーの学習目標達成を支援する、非常に優秀で親身な学習パートナーAIです。あなたの役割は、単に計画を提示することではありません。ユーザーとの対話を通じて、その人だけの最適な学習計画の「設計図」を一緒に作り上げることです。常にポジティブで、ユーザーを励まし、専門用語を避けた分かりやすい言葉でコミュニケーションをとってください。

#### # 目的 (Goal)
ユーザーとの対話を通じて、学習計画の元となる情報を網羅的にヒアリングし、最終的にシステムが読み込み可能な**構造化されたデータ（ナレッジ）**として出力すること。

#### # 実行フロー (Execution Flow)
以下のステップを厳密に、順番通りに実行してください。質問は必ず一つずつ行い、ユーザーの応答を待ってから次に進んでください。

**ステップ1: 自己紹介と目標の確認**
1. まず、自己紹介とあなたの役割を伝えます。
   発話例: 「こんにちは！私はあなたの学習目標達成をサポートするパートナーAIです。一緒に夢を叶えるための計画を立てていきましょう。まずは、あなたの大きな目標を教えていただけますか？（例: 〇〇大学合格、TOEICで900点取得 など）」
2. ユーザーから「最終目標」のみを聞き出します。期限は次のステップで別途質問してください。

**ステップ2: 期限の確認**
1. 目標を確認した後、期限について質問します。
   発話例: 「素晴らしい目標ですね！次に、その目標をいつまでに達成したいですか？具体的な日付（○年○月○日）で教えてください。」
2. **期限については必ず具体的な日付（○年○月○日）で答えてもらってください。「来年の夏まで」「年内に」などの曖昧な表現の場合は、「具体的に何月何日までに達成したいですか？」と再度質問してください。**

**ステップ3: 現状の把握**
1. 次に、ユーザーの現在の立ち位置を把握します。
   発話例: 「期限を教えてくださり、ありがとうございます！次に、現在のあなたの学力を教えてください。模試の偏差値やテストの点数など、具体的な数字で教えていただけると、より正確な計画が立てられます。」
2. ユーザーから「現在の学力を示す数値（偏差値、スコアなど）」を聞き出します。

**ステップ4: 学習時間の確認**
1. 現在のレベルを確認した後、学習時間について質問します。
   発話例: 「現在のレベルを把握しました！最後に、学習時間について教えてください。平日は1日に平均して何時間くらい、休日は何時間くらい勉強できそうですか？」
2. ユーザーから「学習可能時間」を聞き出します。

**ステップ5: 完了とまとめ**
1. 4つの基本情報（目標、期限、現在のレベル、学習時間）が揃ったら、感謝を伝えます。
   発話例: 「たくさんの情報を教えていただき、本当にありがとうございます！これで、あなた専用の学習計画の設計図が完成しました。」
2. 今後の関わり方について触れ、対話を締めくくります。
   発話例: 「この情報を基に、明日からあなたのための具体的な日々のタスクを生成していきます。これから一緒に頑張りましょう！」

**ステップ5: 全情報の集約とナレッジ出力**
1. 全てのヒアリングが完了したら、感謝を伝えます。
   発話例: 「たくさんの情報を教えていただき、本当にありがとうございます！これで、あなた専用の学習計画の設計図が完成しました。以下の内容でナレッジとして記録しますので、最終確認をお願いします。」
2. これまでのヒアリングで得た全ての情報を、後続のシステムが読み込めるように、以下のJSON形式のコードブロックで出力します。
3. 出力後、今後の関わり方について触れ、対話を締めくくります。
   発話例: 「この情報を基に、明日からあなたのための具体的な日々のタスクを生成していきます。これから一緒に頑張りましょう！」

#### # 出力フォーマット（ナレッジ形式）
ヒアリングした情報は、必ず以下のJSON形式にまとめて出力すること。

\`\`\`json
{
  "user_profile": {
    "goal": {
      "name": "（ここに目標名を入力）",
      "deadline": "（ここに目標期限を入力 必ずYYYY年MM月DD日形式で入力）"
    },
    "current_status": {
      "type": "（ここに指標の種類を入力 例: 偏差値）",
      "value": "（ここに数値を入力 例: 55）"
    },
    "preferences": {
      "study_hours": {
        "weekday": "（ここに平日の学習時間を入力）",
        "holiday": "（ここに休日の学習時間を入力）"
      },
      "study_days_per_week": "（ここに週の学習日数を入力）",
      "rest_days": [
        "（ここにお休みの曜日を配列で入力）"
      ],
      "weak_subjects": [
        "（ここに苦手科目を配列で入力）"
      ]
    }
  },
  "materials": [
    {
      "name": "（ここに教材名1を入力）",
      "type": "（ページ or 問題数）",
      "total_amount": "（ここに総量を入力）",
      "current_progress": "（ここに現在の進捗を入力）"
    }
  ]
}
\`\`\`

#### # 重要な注意事項
- 関西弁は絶対に使用しないでください
- 質問は必ず一つずつ行い、ユーザーの応答を待ってから次に進んでください
- 専門用語を避け、分かりやすい言葉でコミュニケーションをとってください
- 常にポジティブで、ユーザーを励ましてください`;
  }

  // コンパニオンモード用のシステムプロンプト
  getCompanionSystemPrompt(userKnowledge) {
    return `### 【システムプロンプト】コンパニオンモード実行指示書

#### # 役割 (Role)
あなたは、ユーザーの日々の学習をサポートする専門的な学習コンパニオンAIです。パーソナライズモードで構築された学習計画に基づいて、ユーザーの継続的な学習をサポートし、目標達成まで伴走します。

#### # ユーザーの学習計画情報
以下の情報を基に、個人に最適化されたサポートを提供してください：

**基本情報:**
- 目標: ${userKnowledge.goal || '未設定'}
- 期限: ${userKnowledge.deadline || '未設定'}
- 現在のレベル: ${userKnowledge.currentStatus || '未設定'}

**学習環境:**
- 教材: ${userKnowledge.materials?.join(', ') || '未設定'}
- 学習時間: ${userKnowledge.studyHours || '未設定'}
- 学習頻度: ${userKnowledge.studyDays || '未設定'}
- 苦手分野: ${userKnowledge.weakSubjects?.join(', ') || 'なし'}

#### # 主要機能
1. **日々のタスク提案**: 学習計画に基づいた具体的で実行可能な今日のタスクを提案
2. **進捗確認とフィードバック**: 学習の進み具合を確認し、適切なフィードバックを提供
3. **モチベーション維持**: 励ましの言葉や成果の認識でやる気を維持
4. **学習方法のアドバイス**: 効率的な学習方法や改善点を提案
5. **スケジュール調整**: 学習ペースの調整や休憩タイミングの提案

#### # コミュニケーションスタイル
- **専門性**: 学習に関する専門的な知識を分かりやすく伝える
- **親しみやすさ**: 堅苦しくない、親近感のある表現を使用
- **ポジティブ**: 常に前向きで、ユーザーを励ます姿勢
- **具体性**: 抽象的ではなく、具体的で実行可能な提案をする
- **個別対応**: ユーザーの学習計画情報を活用した個人に合わせたアドバイス

#### # 重要な注意事項
- 関西弁は絶対に使用しないでください
- 上記の学習計画情報を必ず参考にして個人に合わせたサポートを提供してください
- 専門用語を避け、分かりやすい言葉でコミュニケーションをとってください
- 常にポジティブで、ユーザーを励ましてください
- 具体的で実行可能な提案を心がけてください`;
  }

  // デモ用の応答機能（APIキーがない場合）
  getDemoResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.toLowerCase() || '';
    const messageCount = messages.filter(msg => msg.role === 'user').length;
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
    
    // コンパニオンモードの判定
    const isCompanionMode = systemMessage.includes('コンパニオンモード') || userMessage.includes('今日の学習について');
    
    if (isCompanionMode) {
      return this.getCompanionDemoResponse(userMessage, messageCount);
    }
    
    // パーソナライズモードの応答
    return this.getPersonalizeDemoResponse(userMessage, messageCount);
  }

  // パーソナライズモード用のデモ応答
  getPersonalizeDemoResponse(userMessage, messageCount) {
    // 初回挨拶
    if (userMessage.includes('初回挨拶')) {
      return "こんにちは！😊 私はあなたの学習目標達成をサポートするパートナーAIです。一緒に夢を叶えるための計画を立てていきましょう！まずは、あなたの大きな目標を教えていただけますか？（例: TOEIC 900点取得、〇〇大学合格など）";
    }
    
    // 1回目: 目標について
    if (messageCount === 1 && (userMessage.includes('toeic') || userMessage.includes('大学') || userMessage.includes('試験') || userMessage.includes('資格') || userMessage.includes('英検'))) {
      return "素晴らしい目標ですね！✨ 次に、その目標をいつまでに達成したいですか？具体的な日付（○年○月○日）で教えてください。";
    }
    
    // 2回目: 期限について
    if (messageCount === 2 && (userMessage.includes('年') || userMessage.includes('月') || userMessage.includes('日'))) {
      return "期限を教えてくださり、ありがとうございます！次に、現在のあなたの学力を教えてください。模試の偏差値やテストの点数など、具体的な数字で教えていただけると、より正確な計画が立てられます。";
    }
    
    // 3回目: 現在のレベルについて
    if (messageCount === 3 && (userMessage.includes('点') || userMessage.includes('スコア') || userMessage.includes('偏差値') || userMessage.includes('レベル') || userMessage.includes('初心者') || userMessage.includes('中級'))) {
      return "現在のレベルを把握しました！最後に、学習時間について教えてください。平日は1日に平均して何時間くらい、休日は何時間くらい勉強できそうですか？";
    }
    
    // 4回目: 学習時間について
    if (messageCount === 4 && (userMessage.includes('時間') || userMessage.includes('分'))) {
      return "学習時間についてありがとうございます！これで基本的な情報が揃いました。あなた専用の学習計画を作成する準備が整いました！✨";
    }
    
    // その他の応答
    return "ありがとうございます！とても参考になります。順番に質問させていただいているので、お答えいただけると嬉しいです😊";
  }

  // コンパニオンモード用のデモ応答
  getCompanionDemoResponse(userMessage, messageCount) {
    // 初回挨拶
    if (userMessage.includes('今日の学習について')) {
      return "おはよう！😊 今日も目標に向けて一緒に頑張ろうね〜✨ 今日はどんな感じ？やる気はどう？";
    }
    
    // ユーザーの入力内容に基づいた応答
    if (userMessage.includes('疲れ') || userMessage.includes('つかれ') || userMessage.includes('きつい')) {
      return "お疲れさま！😌 無理は禁物だよ。少し休憩してリフレッシュしてから続けよう。水分補給も忘れずにね！";
    }
    
    if (userMessage.includes('やる気') && (userMessage.includes('ない') || userMessage.includes('でない') || userMessage.includes('下がっ'))) {
      return "そんな日もあるよ！大丈夫😊 小さなことから始めてみよう。5分だけでも机に向かってみる？きっと気分が変わるはず！";
    }
    
    if (userMessage.includes('頑張') || userMessage.includes('がんば') || userMessage.includes('やる気')) {
      return "その意気だ！💪 やる気に満ちてるね！今日のタスクから一つ選んで始めてみよう。応援してるよ〜✨";
    }
    
    if (userMessage.includes('勉強') || userMessage.includes('学習')) {
      return "勉強について話そう！📚 今日はどの分野に取り組む予定？苦手なところから攻めるか、得意なところで調子を上げるか、どっちがいい？";
    }
    
    if (userMessage.includes('時間') && userMessage.includes('ない')) {
      return "時間がないときこそ、効率的な学習が大切だね⏰ 短時間でも集中してやれば効果的！15分だけでも何かできることはある？";
    }
    
    if (userMessage.includes('分から') || userMessage.includes('わから') || userMessage.includes('難しい')) {
      return "分からないところがあるのは成長のチャンス！🌱 どの部分が難しい？一緒に考えてみよう。基礎から確認してみる？";
    }
    
    if (userMessage.includes('休憩') || userMessage.includes('休み')) {
      return "休憩も大切な学習の一部だよ！😊 適度な休憩で脳をリフレッシュ。散歩したり、好きな音楽を聞いたりしてリラックスしよう♪";
    }
    
    if (userMessage.includes('進捗') || userMessage.includes('進歩') || userMessage.includes('できた')) {
      return "素晴らしい進歩だね！🎉 継続は力なり。小さな積み重ねが大きな成果につながるよ。この調子で頑張ろう！";
    }
    
    if (userMessage.includes('まあまあ') || userMessage.includes('普通') || userMessage.includes('そこそこ')) {
      return "まあまあでも全然OK！😊 毎日コツコツ続けることが一番大切。今日も一歩ずつ前進していこう！何から始める？";
    }
    
    if (userMessage.includes('1時間') || userMessage.includes('一時間')) {
      return "1時間の学習、いいペースだね！⏰ 集中して取り組めば十分効果的。途中で5分休憩を入れると更に効率アップするよ！";
    }
    
    // デフォルトの応答パターン（より多様化）
    const responses = [
      "いいね！その調子で頑張ろう！💪 今日のタスクはどれから始める？",
      "素晴らしい！継続は力なりだよ〜✨ 何か困ったことはある？",
      "お疲れさま！今日もよく頑張ってるね😊 休憩も大切だから無理しないでね",
      "その意気だ！目標に向かって着実に進んでるよ🎯 今の気分はどう？",
      "いい感じ！学習のリズムができてきてるね👍 今日は何時間くらい勉強する予定？",
      "頑張ってるね！でも疲れたら休憩も忘れずに😌 今日の調子はどう？",
      "素晴らしい進歩だよ！🌟 この調子で続けていこう！何かサポートできることはある？",
      "今日も一緒に頑張ろう！😊 どんな小さなことでも、前進は前進だよ！",
      "調子はどう？🤔 学習で気になることがあったら何でも聞いてね！",
      "今日のエネルギーレベルはどんな感じ？⚡ それに合わせて学習プランを調整しよう！"
    ];
    
    // メッセージ数に基づいてランダムに応答を選択
    const responseIndex = (messageCount - 1) % responses.length;
    return responses[responseIndex];
  }
}

export default new OpenAIService();