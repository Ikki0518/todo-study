import { 
  UserKnowledge, 
  AIConversationSession, 
  AIConversationState, 
  AIMessage,
  AIPersonalizeRequest,
  AICompanionRequest,
  AIResponse 
} from '../../../shared/src/types';
import { logger } from '../utils/logger';

export class AIService {
  private sessions: Map<string, AIConversationSession> = new Map();
  private messages: Map<string, AIMessage[]> = new Map();

  /**
   * パーソナライズモード - ユーザーとの対話を通じて学習計画の設計図を作成
   */
  async processPersonalizeMode(request: AIPersonalizeRequest): Promise<AIResponse> {
    try {
      let session = request.sessionId ? this.sessions.get(request.sessionId) : null;
      
      // 新しいセッションの場合
      if (!session) {
        session = this.createNewSession(request.studentId, 'PERSONALIZE');
        this.sessions.set(session.id, session);
        this.messages.set(session.id, []);
        
        return {
          message: "こんにちは！私はあなたの学習目標達成をサポートするパートナーAIです。一緒に夢を叶えるための計画を立てていきましょう。まずは、あなたの大きな目標を教えていただけますか？（例: 〇〇大学合格、TOEICで900点取得 など）",
          sessionId: session.id
        };
      }

      // ユーザーメッセージを記録
      this.addMessage(session.id, 'user', request.message);

      // 現在の状態に応じて処理
      const response = await this.handlePersonalizeState(session, request.message);
      
      // AIメッセージを記録
      this.addMessage(session.id, 'assistant', response.message);

      return response;
    } catch (error) {
      logger.error('Error in processPersonalizeMode:', error);
      throw error;
    }
  }

  /**
   * 伴走モード - 日々の学習をサポート
   */
  async processCompanionMode(request: AICompanionRequest): Promise<AIResponse> {
    try {
      const knowledge = request.knowledge;
      const today = new Date();
      const deadline = new Date(knowledge.user_profile.goal.deadline);
      const remainingDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 挨拶とモチベーション向上
      let greeting = `${knowledge.user_profile.name}さん、こんにちは！今日も一緒に頑張りましょう！`;
      
      if (knowledge.session_data?.streak_days) {
        greeting += `学習継続${knowledge.session_data.streak_days}日目、素晴らしいです！🔥 この調子でいきましょう！`;
      }

      greeting += `\n\n今日は${today.getMonth() + 1}月${today.getDate()}日。目標の日まであと${remainingDays}日ですね。一日一日を大切にしていきましょう。`;

      // 本日のタスクを算出
      const dailyTasks = this.calculateDailyTasks(knowledge, remainingDays);

      let taskMessage = "\n\nでは、今日のタスクはこちらです！上から順番に片付けていくのがおすすめですよ。\n\n【今日のタスクリスト ✅】\n";
      
      dailyTasks.forEach((task, index) => {
        taskMessage += `${index + 1}. ${task.material}: ${task.range}\n`;
      });

      return {
        message: greeting + taskMessage,
        dailyTasks
      };
    } catch (error) {
      logger.error('Error in processCompanionMode:', error);
      throw error;
    }
  }

  /**
   * パーソナライズモードの状態処理
   */
  private async handlePersonalizeState(session: AIConversationSession, userMessage: string): Promise<AIResponse> {
    switch (session.state) {
      case AIConversationState.INITIAL:
        return this.handleGoalCollection(session, userMessage);
      
      case AIConversationState.GOAL_COLLECTION:
        return this.handleCurrentStatusCollection(session, userMessage);
      
      case AIConversationState.CURRENT_STATUS:
        return this.handleMaterialsCollection(session, userMessage);
      
      case AIConversationState.MATERIALS:
        return this.handleStudyTimeCollection(session, userMessage);
      
      case AIConversationState.STUDY_TIME:
        return this.handleStudyDaysCollection(session, userMessage);
      
      case AIConversationState.STUDY_DAYS:
        return this.handleWeakSubjectsCollection(session, userMessage);
      
      case AIConversationState.WEAK_SUBJECTS:
        return this.completePersonalization(session, userMessage);
      
      default:
        return { message: "申し訳ございません。エラーが発生しました。最初からやり直してください。" };
    }
  }

  private handleGoalCollection(session: AIConversationSession, userMessage: string): AIResponse {
    // 目標と期限を抽出（簡単な実装）
    session.knowledge = {
      user_profile: {
        name: "学習者", // 実際の実装では名前も取得
        goal: {
          name: userMessage,
          deadline: "" // 次のステップで取得
        },
        current_status: { type: "", value: "" },
        preferences: {
          study_hours: { weekday: "", holiday: "" },
          study_days_per_week: "",
          rest_days: [],
          weak_subjects: []
        }
      },
      materials: []
    };

    session.state = AIConversationState.GOAL_COLLECTION;
    this.sessions.set(session.id, session);

    return {
      message: "素晴らしい目標ですね！その目標を達成したい期限はいつ頃でしょうか？（例: 2025年3月15日、来年の春など）",
      sessionId: session.id
    };
  }

  private handleCurrentStatusCollection(session: AIConversationSession, userMessage: string): AIResponse {
    // 期限を設定（簡単な実装）
    if (session.knowledge?.user_profile?.goal) {
      session.knowledge.user_profile.goal.deadline = this.parseDate(userMessage);
    }

    session.state = AIConversationState.CURRENT_STATUS;
    this.sessions.set(session.id, session);

    return {
      message: "目標を教えてくださり、ありがとうございます！次に、現在のあなたの学力を教えてください。模試の偏差値やテストの点数など、具体的な数字で教えていただけると、より正確な計画が立てられます。",
      sessionId: session.id
    };
  }

  private handleMaterialsCollection(session: AIConversationSession, userMessage: string): AIResponse {
    // 現在の学力を設定
    if (session.knowledge?.user_profile?.current_status) {
      const statusMatch = userMessage.match(/(\d+)/);
      session.knowledge.user_profile.current_status = {
        type: userMessage.includes('偏差値') ? '偏差値' : 'スコア',
        value: statusMatch ? statusMatch[1] : userMessage
      };
    }

    session.state = AIConversationState.MATERIALS;
    this.sessions.set(session.id, session);

    return {
      message: "なるほど、現状を把握しました。目標まで一緒に駆け上がるための道筋が見えてきましたね！ここからは、あなただけのオーダーメイドプランを作るために、いくつか具体的な質問をさせてください。\n\n学習に使う予定の参考書や問題集はありますか？あれば、その名前と、全体のページ数（または問題数）を教えてください。",
      sessionId: session.id
    };
  }

  private handleStudyTimeCollection(session: AIConversationSession, userMessage: string): AIResponse {
    // 教材情報を解析して追加
    const materials = this.parseMaterials(userMessage);
    if (session.knowledge) {
      session.knowledge.materials = materials;
    }

    session.state = AIConversationState.STUDY_TIME;
    this.sessions.set(session.id, session);

    return {
      message: "素晴らしい教材ですね！次に、学習時間について教えてください。平日は1日に平均して何時間くらい、休日は何時間くらい勉強できそうですか？",
      sessionId: session.id
    };
  }

  private handleStudyDaysCollection(session: AIConversationSession, userMessage: string): AIResponse {
    // 学習時間を設定
    const timeMatch = userMessage.match(/平日.*?(\d+).*?時間.*?休日.*?(\d+).*?時間/);
    if (timeMatch && session.knowledge?.user_profile?.preferences?.study_hours) {
      session.knowledge.user_profile.preferences.study_hours = {
        weekday: timeMatch[1] + "時間",
        holiday: timeMatch[2] + "時間"
      };
    }

    session.state = AIConversationState.STUDY_DAYS;
    this.sessions.set(session.id, session);

    return {
      message: "承知しました。では、週に何日くらい学習する予定ですか？お休みする曜日があれば、それも教えてください。",
      sessionId: session.id
    };
  }

  private handleWeakSubjectsCollection(session: AIConversationSession, userMessage: string): AIResponse {
    // 学習日数を設定
    const daysMatch = userMessage.match(/(\d+)日/);
    if (daysMatch && session.knowledge?.user_profile?.preferences) {
      session.knowledge.user_profile.preferences.study_days_per_week = daysMatch[1];
      
      // 休日の抽出（簡単な実装）
      const restDays = [];
      if (userMessage.includes('日曜')) restDays.push('日曜日');
      if (userMessage.includes('土曜')) restDays.push('土曜日');
      session.knowledge.user_profile.preferences.rest_days = restDays;
    }

    session.state = AIConversationState.WEAK_SUBJECTS;
    this.sessions.set(session.id, session);

    return {
      message: "ありがとうございます。あと少しです！特に苦手だと感じている科目や分野はありますか？今後の計画の参考にさせてください。",
      sessionId: session.id
    };
  }

  private completePersonalization(session: AIConversationSession, userMessage: string): AIResponse {
    // 苦手科目を設定
    if (session.knowledge?.user_profile?.preferences) {
      session.knowledge.user_profile.preferences.weak_subjects = this.parseWeakSubjects(userMessage);
    }

    session.state = AIConversationState.COMPLETED;
    session.completedAt = new Date();
    this.sessions.set(session.id, session);

    const knowledgeJson = JSON.stringify(session.knowledge, null, 2);

    return {
      message: `たくさんの情報を教えていただき、本当にありがとうございます！これで、あなた専用の学習計画の設計図が完成しました。以下の内容でナレッジとして記録しますので、最終確認をお願いします。\n\n\`\`\`json\n${knowledgeJson}\n\`\`\`\n\nこの情報を基に、明日からあなたのための具体的な日々のタスクを生成していきます。これから一緒に頑張りましょう！`,
      sessionId: session.id,
      knowledge: session.knowledge as UserKnowledge,
      isCompleted: true
    };
  }

  /**
   * 日々のタスクを計算
   */
  private calculateDailyTasks(knowledge: UserKnowledge, remainingDays: number): Array<{material: string, range: string, type: string}> {
    const tasks: Array<{material: string, range: string, type: string}> = [];

    knowledge.materials.forEach(material => {
      const remaining = material.total_amount - material.current_progress;
      if (remaining > 0) {
        const dailyAmount = Math.ceil(remaining / remainingDays);
        const startPoint = material.current_progress + 1;
        const endPoint = Math.min(startPoint + dailyAmount - 1, material.total_amount);

        let range = "";
        if (material.type === "ページ") {
          range = `${startPoint}ページ 〜 ${endPoint}ページ`;
        } else if (material.type === "問題数" || material.type === "単語") {
          range = `${startPoint}番 〜 ${endPoint}番`;
        } else {
          range = `${startPoint} 〜 ${endPoint}`;
        }

        tasks.push({
          material: material.name,
          range: range,
          type: material.type
        });
      }
    });

    return tasks;
  }

  /**
   * ヘルパーメソッド
   */
  private createNewSession(studentId: string, mode: 'PERSONALIZE' | 'COMPANION'): AIConversationSession {
    return {
      id: this.generateId(),
      studentId,
      mode,
      state: AIConversationState.INITIAL,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const messages = this.messages.get(sessionId) || [];
    messages.push({
      id: this.generateId(),
      sessionId,
      role,
      content,
      createdAt: new Date()
    });
    this.messages.set(sessionId, messages);
  }

  private parseDate(dateString: string): string {
    // 簡単な日付解析（実際の実装ではより高度な解析が必要）
    const today = new Date();
    if (dateString.includes('来年')) {
      return `${today.getFullYear() + 1}-03-15`;
    }
    // デフォルトで1年後
    return `${today.getFullYear() + 1}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private parseMaterials(materialsString: string): Array<{name: string, type: string, total_amount: number, current_progress: number}> {
    // 簡単な教材解析（実際の実装ではより高度な解析が必要）
    const materials = [];
    const lines = materialsString.split('\n');
    
    for (const line of lines) {
      const pageMatch = line.match(/(.+?)[\s　]*(\d+)[\s　]*ページ/);
      const problemMatch = line.match(/(.+?)[\s　]*(\d+)[\s　]*問/);
      
      if (pageMatch) {
        materials.push({
          name: pageMatch[1].trim(),
          type: "ページ",
          total_amount: parseInt(pageMatch[2]),
          current_progress: 0
        });
      } else if (problemMatch) {
        materials.push({
          name: problemMatch[1].trim(),
          type: "問題数",
          total_amount: parseInt(problemMatch[2]),
          current_progress: 0
        });
      }
    }

    return materials;
  }

  private parseWeakSubjects(subjectsString: string): string[] {
    const subjects = [];
    if (subjectsString.includes('数学')) subjects.push('数学');
    if (subjectsString.includes('英語')) subjects.push('英語');
    if (subjectsString.includes('国語')) subjects.push('国語');
    if (subjectsString.includes('理科')) subjects.push('理科');
    if (subjectsString.includes('社会')) subjects.push('社会');
    return subjects;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * セッション管理メソッド
   */
  getSession(sessionId: string): AIConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getMessages(sessionId: string): AIMessage[] {
    return this.messages.get(sessionId) || [];
  }
}

export const aiService = new AIService();