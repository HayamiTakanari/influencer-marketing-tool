import React, { useState } from 'react';
import { YakujihoViolationMatch } from '../services/yakujiho-checker';

interface YakujihoHighlightedTextProps {
  text: string;
  violations: YakujihoViolationMatch[];
  className?: string;
}

interface HighlightSegment {
  text: string;
  isViolation: boolean;
  violation?: YakujihoViolationMatch;
  start: number;
  end: number;
}

/**
 * 薬機法違反箇所をハイライト表示するコンポーネント
 */
export const YakujihoHighlightedText: React.FC<YakujihoHighlightedTextProps> = ({
  text,
  violations,
  className = ''
}) => {
  const [hoveredViolation, setHoveredViolation] = useState<YakujihoViolationMatch | null>(null);

  // テキストをセグメントに分割
  const createHighlightSegments = (): HighlightSegment[] => {
    if (violations.length === 0) {
      return [{ text, isViolation: false, start: 0, end: text.length }];
    }

    // 違反箇所をソートして重複を処理
    const sortedViolations = [...violations].sort((a, b) => a.position.start - b.position.start);
    const segments: HighlightSegment[] = [];
    let currentPos = 0;

    sortedViolations.forEach((violation) => {
      const { start, end } = violation.position;

      // 重複チェック（既にハイライト済みの範囲は skip）
      if (start < currentPos) return;

      // 違反箇所より前の通常テキスト
      if (start > currentPos) {
        segments.push({
          text: text.substring(currentPos, start),
          isViolation: false,
          start: currentPos,
          end: start
        });
      }

      // 違反箇所
      segments.push({
        text: text.substring(start, end),
        isViolation: true,
        violation,
        start,
        end
      });

      currentPos = end;
    });

    // 最後の違反箇所より後の通常テキスト
    if (currentPos < text.length) {
      segments.push({
        text: text.substring(currentPos),
        isViolation: false,
        start: currentPos,
        end: text.length
      });
    }

    return segments;
  };

  const segments = createHighlightSegments();

  // 重要度に応じた背景色を取得
  const getViolationBgColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'bg-red-200 hover:bg-red-300';
      case 'medium':
        return 'bg-orange-200 hover:bg-orange-300';
      case 'low':
        return 'bg-yellow-200 hover:bg-yellow-300';
      default:
        return 'bg-red-200 hover:bg-red-300';
    }
  };

  // 重要度に応じたテキスト色を取得
  const getViolationTextColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'text-red-900';
      case 'medium':
        return 'text-orange-900';
      case 'low':
        return 'text-yellow-900';
      default:
        return 'text-red-900';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* メインテキスト */}
      <div className="whitespace-pre-wrap leading-relaxed">
        {segments.map((segment, index) => {
          if (!segment.isViolation) {
            return <span key={index}>{segment.text}</span>;
          }

          const violation = segment.violation!;
          const bgColor = getViolationBgColor(violation.violation.severity);
          const textColor = getViolationTextColor(violation.violation.severity);

          return (
            <span
              key={index}
              className={`${bgColor} ${textColor} px-1 rounded cursor-pointer border-2 border-red-400 relative transition-all duration-200`}
              onMouseEnter={() => setHoveredViolation(violation)}
              onMouseLeave={() => setHoveredViolation(null)}
              title={`薬機法違反の可能性: ${violation.violation.description}`}
            >
              {segment.text}
              {/* 重要度アイコン */}
              <span className="absolute -top-1 -right-1 text-xs">
                {violation.violation.severity === 'high' && '🚨'}
                {violation.violation.severity === 'medium' && '⚠️'}
                {violation.violation.severity === 'low' && '💡'}
              </span>
            </span>
          );
        })}
      </div>

      {/* ホバー時の詳細情報ツールチップ */}
      {hoveredViolation && (
        <div className="absolute z-50 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg max-w-md">
          <div className="text-sm">
            <div className="flex items-center mb-2">
              <span className="text-red-600 font-bold text-lg mr-2">⚖️</span>
              <span className="font-bold text-gray-900">薬機法違反の可能性</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                hoveredViolation.violation.severity === 'high' 
                  ? 'bg-red-100 text-red-800' 
                  : hoveredViolation.violation.severity === 'medium'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hoveredViolation.violation.severity === 'high' && '高リスク'}
                {hoveredViolation.violation.severity === 'medium' && '中リスク'}
                {hoveredViolation.violation.severity === 'low' && '低リスク'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700">該当箇所:</span>
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                  「{hoveredViolation.matchedText}」
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">違反内容:</span>
                <span className="ml-2 text-gray-900">{hoveredViolation.violation.description}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">法的根拠:</span>
                <span className="ml-2 text-gray-900">{hoveredViolation.violation.law_reference}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">リスクレベル:</span>
                <span className="ml-2">
                  <span className="text-red-600 font-bold">{hoveredViolation.violation.risk_level}</span>
                  <span className="text-gray-500">/10</span>
                </span>
              </div>
              
              {hoveredViolation.violation.example && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium text-green-700">推奨表現:</span>
                  <div className="text-green-800 text-xs mt-1">
                    {hoveredViolation.violation.example}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 薬機法チェック結果サマリーコンポーネント
 */
interface YakujihoCheckSummaryProps {
  violations: YakujihoViolationMatch[];
  riskScore: number;
  className?: string;
}

export const YakujihoCheckSummary: React.FC<{result: any, className?: string}> = ({
  result,
  className = ''
}) => {
  const violations = result.violations || [];
  const riskScore = result.riskScore || 0;
  const highRiskCount = violations.filter((v: any) => v.violation.severity === 'high').length;
  const mediumRiskCount = violations.filter((v: any) => v.violation.severity === 'medium').length;
  const lowRiskCount = violations.filter((v: any) => v.violation.severity === 'low').length;

  if (violations.length === 0) {
    return (
      <div className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <span className="text-green-600 text-lg mr-2">✅</span>
          <span className="text-green-800 font-medium">薬機法違反は検出されませんでした</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-red-600 text-lg mr-2">⚖️</span>
          <span className="text-red-800 font-medium">薬機法違反の可能性を検出</span>
        </div>
        <div className="text-sm">
          <span className="bg-red-200 text-red-800 px-2 py-1 rounded">
            リスクスコア: {riskScore.toFixed(1)}/10
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        {highRiskCount > 0 && (
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-center">
            高リスク: {highRiskCount}件
          </div>
        )}
        {mediumRiskCount > 0 && (
          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-center">
            中リスク: {mediumRiskCount}件
          </div>
        )}
        {lowRiskCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-center">
            低リスク: {lowRiskCount}件
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-red-700">
        💡 赤くハイライトされた部分をクリック/ホバーすると詳細が表示されます
      </div>
    </div>
  );
};