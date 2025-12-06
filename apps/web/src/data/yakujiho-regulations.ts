/**
 * 薬機法（医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律）
 * 規制データベース - インフルエンサーマーケティング向け
 */

export interface YakujihoViolation {
  id: string;
  category: 'medicine' | 'cosmetics' | 'health-food' | 'medical-device';
  severity: 'high' | 'medium' | 'low';
  pattern: string;
  description: string;
  example: string;
  law_reference: string;
  risk_level: number; // 1-10
}

export const YAKUJIHO_VIOLATIONS: YakujihoViolation[] = [
  // === 医薬品関連 ===
  {
    id: 'med-01',
    category: 'medicine',
    severity: 'high',
    pattern: '(治る|治す|治った|完治|根治)',
    description: '医薬品的効能効果の標ぼう',
    example: '飲むだけで病気が治る、完全に治った',
    law_reference: '薬機法第68条',
    risk_level: 10
  },
  {
    id: 'med-02',
    category: 'medicine',
    severity: 'high',
    pattern: '(診断|治療|予防).*?(病気|疾患|症状)',
    description: '診断・治療・予防効果の標ぼう',
    example: 'がんの診断ができる、糖尿病を治療する',
    law_reference: '薬機法第68条',
    risk_level: 10
  },
  {
    id: 'med-03',
    category: 'medicine',
    severity: 'high',
    pattern: '(癌|がん|ガン|腫瘍|糖尿病|高血圧|心臓病|肝臓病|腎臓病)',
    description: '特定疾病名と治療効果の関連付け',
    example: 'がんに効く、糖尿病が改善',
    law_reference: '薬機法第68条',
    risk_level: 9
  },
  
  // === 化粧品関連 ===
  {
    id: 'cos-01',
    category: 'cosmetics',
    severity: 'medium',
    pattern: '(シワ|しわ).*(消える|なくなる|解消|改善)',
    description: '化粧品の範囲を超えたシワ改善効果',
    example: 'シワが完全に消える、深いシワも改善',
    law_reference: '薬機法第61条',
    risk_level: 7
  },
  {
    id: 'cos-02',
    category: 'cosmetics',
    severity: 'medium',
    pattern: '(ニキビ|にきび|吹き出物).*(治る|治す|完治)',
    description: '化粧品による医薬品的効能効果の標ぼう',
    example: 'ニキビが治る、吹き出物を治す',
    law_reference: '薬機法第61条',
    risk_level: 8
  },
  {
    id: 'cos-03',
    category: 'cosmetics',
    severity: 'medium',
    pattern: '(アトピー|湿疹|皮膚炎).*(改善|治療|効果)',
    description: '皮膚疾患への医薬品的効果の標ぼう',
    example: 'アトピーが改善する、湿疹に効果',
    law_reference: '薬機法第61条',
    risk_level: 8
  },
  {
    id: 'cos-04',
    category: 'cosmetics',
    severity: 'low',
    pattern: '(若返り|アンチエイジング).*(効果|実感)',
    description: '過度な若返り効果の標ぼう',
    example: '20歳若返る効果、確実にアンチエイジング',
    law_reference: '薬機法第61条',
    risk_level: 5
  },

  // === 健康食品関連 ===
  {
    id: 'hf-01',
    category: 'health-food',
    severity: 'high',
    pattern: '(ダイエット|痩せる|減量).*(効果|保証|必ず)',
    description: '健康食品による医薬品的効能効果の標ぼう',
    example: '必ず痩せる効果、ダイエット効果を保証',
    law_reference: '薬機法第68条',
    risk_level: 8
  },
  {
    id: 'hf-02',
    category: 'health-food',
    severity: 'medium',
    pattern: '(免疫力|免疫).*(向上|アップ|強化)',
    description: '免疫機能への効果標ぼう',
    example: '免疫力が向上する、免疫をアップ',
    law_reference: '薬機法第68条',
    risk_level: 6
  },
  {
    id: 'hf-03',
    category: 'health-food',
    severity: 'medium',
    pattern: '(血圧|血糖値|コレステロール).*(下がる|改善|正常)',
    description: '生理機能への効果標ぼう',
    example: '血圧が下がる、血糖値が正常になる',
    law_reference: '薬機法第68条',
    risk_level: 7
  },
  {
    id: 'hf-04',
    category: 'health-food',
    severity: 'high',
    pattern: '(便秘|下痢|胃痛).*(治る|改善|解消)',
    description: '症状の治療効果標ぼう',
    example: '便秘が治る、胃痛が改善する',
    law_reference: '薬機法第68条',
    risk_level: 8
  },

  // === 医療機器関連 ===
  {
    id: 'dev-01',
    category: 'medical-device',
    severity: 'high',
    pattern: '(診断|検査|治療).*(機器|器具|装置)',
    description: '医療機器的効能効果の標ぼう',
    example: '家庭で診断できる機器、治療効果のある装置',
    law_reference: '薬機法第65条',
    risk_level: 9
  },
  {
    id: 'dev-02',
    category: 'medical-device',
    severity: 'medium',
    pattern: '(マッサージ|按摩).*(治療|効果|改善)',
    description: 'マッサージ器具の医療効果標ぼう',
    example: '肩こりを治療するマッサージ器',
    law_reference: '薬機法第65条',
    risk_level: 6
  },

  // === 共通の危険表現 ===
  {
    id: 'com-01',
    category: 'medicine',
    severity: 'high',
    pattern: '(厚生労働省|FDA).*(認可|承認|推奨)',
    description: '公的機関の認可等の虚偽標ぼう',
    example: '厚生労働省が認可した、FDAが承認',
    law_reference: '薬機法第66条',
    risk_level: 10
  },
  {
    id: 'com-02',
    category: 'medicine',
    severity: 'high',
    pattern: '(医師|医者|専門医).*(推奨|おすすめ|愛用)',
    description: '医師等の推奨表現',
    example: '医師が推奨する、専門医おすすめ',
    law_reference: '薬機法第66条',
    risk_level: 8
  },
  {
    id: 'com-03',
    category: 'medicine',
    severity: 'medium',
    pattern: '(100%|必ず|絶対|確実).*(効果|効く|改善)',
    description: '絶対的効果の保証表現',
    example: '100%効果がある、必ず改善する',
    law_reference: '薬機法第66条',
    risk_level: 7
  },
  {
    id: 'com-04',
    category: 'medicine',
    severity: 'low',
    pattern: '(副作用|リスク).*(なし|ゼロ|安全)',
    description: '安全性の絶対保証',
    example: '副作用なし、100%安全',
    law_reference: '薬機法第66条',
    risk_level: 6
  },

  // === ビフォーアフター系 ===
  {
    id: 'ba-01',
    category: 'cosmetics',
    severity: 'medium',
    pattern: '(ビフォーアフター|使用前後).*(比較|写真|画像)',
    description: '使用前後の比較による効果訴求',
    example: 'ビフォーアフターで効果実証、使用前後の写真',
    law_reference: '薬機法第66条',
    risk_level: 6
  },
  {
    id: 'ba-02',
    category: 'health-food',
    severity: 'medium',
    pattern: '(体重|体型).*(変化|減少|改善).*[0-9]+.*(キロ|kg)',
    description: '具体的な数値による効果訴求',
    example: '1ヶ月で5kg減量、体重が10キロ減少',
    law_reference: '薬機法第66条',
    risk_level: 7
  }
];

/**
 * 薬機法チェック用のカテゴリ別リスト
 */
export const YAKUJIHO_CATEGORIES = {
  medicine: '医薬品',
  cosmetics: '化粧品', 
  'health-food': '健康食品',
  'medical-device': '医療機器'
} as const;

/**
 * 薬機法違反の重要度レベル
 */
export const SEVERITY_LEVELS = {
  high: '高リスク - 即座に修正が必要',
  medium: '中リスク - 表現の見直しを推奨', 
  low: '低リスク - 注意が必要'
} as const;

/**
 * 適切な表現例
 */
export const APPROPRIATE_EXPRESSIONS = {
  cosmetics: [
    '肌を整える',
    'うるおいを与える',
    '乾燥を防ぐ',
    'ハリを与える',
    'なめらかにする'
  ],
  'health-food': [
    '健康をサポート',
    '栄養補給に',
    'バランス良い食生活に',
    '美容と健康に',
    'コンディションを整える'
  ]
};