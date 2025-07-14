import { supabase } from './supabase.js'

/**
 * ユーザーID自動生成サービス
 * 
 * ID構成: [塾コード]-[4桁番号]
 * - 0001〜0099: 講師ID (最大99人)
 * - 0100〜9999: 生徒ID (最大9900人)
 */

export class UserIdGenerator {
  constructor() {
    this.TEACHER_MIN = 1
    this.TEACHER_MAX = 99
    this.STUDENT_MIN = 100
    this.STUDENT_MAX = 9999
  }

  /**
   * ロールに基づいて新しいユーザーIDを生成
   * @param {string} tenantCode - 塾コード (例: "PM", "TM")
   * @param {string} role - ユーザーロール ("TEACHER" or "STUDENT")
   * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
   */
  async generateUserId(tenantCode, role) {
    try {
      const isTeacher = role === 'TEACHER'
      const minId = isTeacher ? this.TEACHER_MIN : this.STUDENT_MIN
      const maxId = isTeacher ? this.TEACHER_MAX : this.STUDENT_MAX

      // 既存のユーザーIDを取得
      const existingIds = await this.getExistingIds(tenantCode, minId, maxId)
      
      if (existingIds.error) {
        return { success: false, error: existingIds.error }
      }

      // 最小の未使用番号を見つける
      const nextId = this.findNextAvailableId(existingIds.data, minId, maxId)
      
      if (!nextId) {
        return { 
          success: false, 
          error: `${role}の上限に達しました。これ以上のユーザーを作成できません。` 
        }
      }

      const userId = `${tenantCode}-${nextId.toString().padStart(4, '0')}`
      
      return { success: true, userId }
    } catch (error) {
      console.error('ユーザーID生成エラー:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 既存のユーザーIDを取得
   * @param {string} tenantCode - 塾コード
   * @param {number} minId - 最小ID番号
   * @param {number} maxId - 最大ID番号
   * @returns {Promise<{data: number[], error?: string}>}
   */
  async getExistingIds(tenantCode, minId, maxId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('tenant_code', tenantCode)
        .like('user_id', `${tenantCode}-%`)

      if (error) {
        console.error('既存ID取得エラー:', error)
        return { data: [], error: error.message }
      }

      // user_idから番号部分を抽出してフィルタリング
      const existingNumbers = data
        .map(item => {
          const match = item.user_id.match(/^[A-Z]+-(\d{4})$/)
          return match ? parseInt(match[1], 10) : null
        })
        .filter(num => num !== null && num >= minId && num <= maxId)

      return { data: existingNumbers }
    } catch (error) {
      console.error('既存ID取得エラー:', error)
      return { data: [], error: error.message }
    }
  }

  /**
   * 次に利用可能なID番号を見つける
   * @param {number[]} existingIds - 既存のID番号配列
   * @param {number} minId - 最小ID番号
   * @param {number} maxId - 最大ID番号
   * @returns {number|null} 次に利用可能なID番号、または null（上限到達時）
   */
  findNextAvailableId(existingIds, minId, maxId) {
    const sortedIds = [...existingIds].sort((a, b) => a - b)
    
    // 最小値から順番にチェック
    for (let i = minId; i <= maxId; i++) {
      if (!sortedIds.includes(i)) {
        return i
      }
    }
    
    return null // 上限に達した
  }

  /**
   * ユーザーIDからロールを判定
   * @param {string} userId - ユーザーID (例: "PM-0042")
   * @returns {string} "TEACHER" or "STUDENT"
   */
  getRoleFromUserId(userId) {
    const match = userId.match(/^[A-Z]+-(\d{4})$/)
    if (!match) {
      throw new Error('無効なユーザーID形式です')
    }
    
    const idNumber = parseInt(match[1], 10)
    return idNumber >= this.TEACHER_MIN && idNumber <= this.TEACHER_MAX ? 'TEACHER' : 'STUDENT'
  }

  /**
   * ユーザーIDからテナントコードを抽出
   * @param {string} userId - ユーザーID (例: "PM-0042")
   * @returns {string} テナントコード (例: "PM")
   */
  getTenantCodeFromUserId(userId) {
    const match = userId.match(/^([A-Z]+)-\d{4}$/)
    if (!match) {
      throw new Error('無効なユーザーID形式です')
    }
    
    return match[1]
  }

  /**
   * ユーザーIDの形式を検証
   * @param {string} userId - ユーザーID
   * @returns {boolean} 有効な形式かどうか
   */
  validateUserIdFormat(userId) {
    const pattern = /^[A-Z]+-\d{4}$/
    return pattern.test(userId)
  }

  /**
   * テナント内の統計情報を取得
   * @param {string} tenantCode - 塾コード
   * @returns {Promise<{teachers: number, students: number, teacherCapacity: number, studentCapacity: number}>}
   */
  async getTenantStats(tenantCode) {
    try {
      const teacherIds = await this.getExistingIds(tenantCode, this.TEACHER_MIN, this.TEACHER_MAX)
      const studentIds = await this.getExistingIds(tenantCode, this.STUDENT_MIN, this.STUDENT_MAX)

      return {
        teachers: teacherIds.data?.length || 0,
        students: studentIds.data?.length || 0,
        teacherCapacity: this.TEACHER_MAX - this.TEACHER_MIN + 1,
        studentCapacity: this.STUDENT_MAX - this.STUDENT_MIN + 1
      }
    } catch (error) {
      console.error('テナント統計取得エラー:', error)
      return {
        teachers: 0,
        students: 0,
        teacherCapacity: this.TEACHER_MAX - this.TEACHER_MIN + 1,
        studentCapacity: this.STUDENT_MAX - this.STUDENT_MIN + 1
      }
    }
  }
}

// シングルトンインスタンス
export const userIdGenerator = new UserIdGenerator()