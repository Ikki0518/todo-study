import React from 'react';

export const SunaLogo = ({ 
  width = 115, 
  height = 55, 
  className = "",
  textColor = "auto" // "auto", "light", "dark", または具体的な色
}) => {
  // 背景色に応じた文字色の自動決定
  const getTextColor = () => {
    if (textColor === "light") return "#FFFFFF";
    if (textColor === "dark") return "#1E293B";
    if (textColor !== "auto") return textColor;
    
    // デフォルト（auto）の場合は濃いネイビー
    return "#1E293B";
  };

  // フォントサイズの調整（幅に応じて最適化）- 1.5倍に拡大
  const getFontSize = () => {
    if (width <= 80) return "30";
    if (width <= 100) return "33";
    if (width <= 120) return "36";
    return "39";
  };

  // レターリング間隔の調整（文字サイズ拡大に合わせて調整）
  const getLetterSpacing = () => {
    if (width <= 80) return "-1.2px";
    if (width <= 100) return "-1.5px";
    return "-1.8px";
  };

  return (
    <div className={`flex items-center relative ${className}`}>
      {/* Sunaロゴ - レスポンシブ対応でコントラスト調整済み */}
      <svg width={width} height={height} viewBox="0 0 135 55" className="flex-shrink-0">
        {/* 大きな円（右上、明るいターコイズブルー） */}
        <circle cx="110" cy="20" r="13" fill="#67E8F9" opacity="0.85"/>

        {/* 中くらいの円（左中央、濃いブルー） */}
        <circle cx="93" cy="28" r="8" fill="#2563EB" opacity="0.9"/>

        {/* 小さな円（右下、薄いターコイズ） */}
        <circle cx="103" cy="35" r="5" fill="#A7F3D0" opacity="0.75"/>

        {/* テキスト "suna" - レスポンシブサイジング、コントラスト最適化 */}
        <text 
          x="0" 
          y="42" 
          fontSize={getFontSize()} 
          fontWeight="700" 
          fill={getTextColor()} 
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
          letterSpacing={getLetterSpacing()}
        >
          suna
        </text>
      </svg>
    </div>
  );
};

// デフォルトエクスポートも追加（互換性のため）
export default SunaLogo;