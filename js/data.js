/**
 * 企業データ
 *
 * 運営(admin.html)で書き出したデータをここに貼り付けて更新する。
 * ※ 以下は動作確認用のサンプル企業(架空)です。
 *
 * データ形式:
 *   id:          一意なID
 *   name:        企業名
 *   industry:    業種
 *   employees:   従業員数(表示用)
 *   description: 会社紹介(学生向け)
 *   pr:          学生へのひとこと
 *   booth:       { label: ブース番号, x: 列(0始まり), y: 行(0始まり) }
 *   mbti:        社員のMBTI診断結果の人数集計 { タイプ: 人数 }
 */

const MAP_CONFIG = {
  cols: 4,
  rows: 3,
  title: "吹田みらい企業マッチングフェス 会場マップ",
};

const COMPANIES = [
  {
    id: "c01",
    name: "吹田精密工業",
    industry: "製造業(精密部品)",
    employees: 48,
    description:
      "医療機器や航空機に使われる精密部品を製造。創業50年、若手エンジニアの育成に力を入れており、20代の工場リーダーも活躍中。",
    pr: "ものづくりが好きな人、コツコツ型の人が輝ける会社です!",
    booth: { label: "A-1", x: 0, y: 0 },
    mbti: { ISTJ: 9, ISFJ: 5, ESTJ: 6, INTJ: 4, ISTP: 8, ESTP: 3, INTP: 3, ISFP: 2 },
  },
  {
    id: "c02",
    name: "エスタネットワークス",
    industry: "IT・ソフトウェア",
    employees: 32,
    description:
      "地元企業向けの業務システムやWebサービスを開発。リモートワーク併用、服装自由。文系出身エンジニアも多数在籍。",
    pr: "アイデアを形にするのが好きな人、大歓迎です!",
    booth: { label: "A-2", x: 1, y: 0 },
    mbti: { INTP: 6, INTJ: 5, ENTP: 4, ISTP: 4, INFP: 4, ENFP: 3, ISTJ: 3, ENTJ: 2, ISFP: 1 },
  },
  {
    id: "c03",
    name: "千里山フーズ",
    industry: "食品製造・販売",
    employees: 65,
    description:
      "吹田生まれの洋菓子・パンを製造販売。百貨店やカフェへの卸のほか、自社ブランド店を市内に3店舗展開。商品企画から店舗運営まで幅広く経験できる。",
    pr: "「おいしい」で人を笑顔にしたい人、一緒に働きましょう!",
    booth: { label: "A-3", x: 2, y: 0 },
    mbti: { ESFJ: 10, ISFJ: 9, ESFP: 8, ENFP: 6, ISFP: 5, ESTJ: 4, INFP: 3, ENFJ: 3 },
  },
  {
    id: "c04",
    name: "江坂建設",
    industry: "建設・土木",
    employees: 84,
    description:
      "北摂エリアの公共工事・マンション建設を手がける総合建設会社。現場のDX化を推進中で、ドローン測量やBIMなど新技術に積極投資。",
    pr: "まちに残る仕事がしたい人、現場で成長したい人に!",
    booth: { label: "A-4", x: 3, y: 0 },
    mbti: { ESTJ: 14, ISTJ: 12, ESTP: 9, ISTP: 7, ENTJ: 4, ESFJ: 5, ISFJ: 4, ENFJ: 2 },
  },
  {
    id: "c05",
    name: "リンクス人材パートナーズ",
    industry: "人材・コンサルティング",
    employees: 21,
    description:
      "中小企業の採用支援・組織づくりを伴走支援。社員の平均年齢29歳。1年目から経営者と直接商談できる裁量の大きさが特徴。",
    pr: "人と組織に興味がある人、話すのが好きな人はぜひブースへ!",
    booth: { label: "B-1", x: 0, y: 1 },
    mbti: { ENFJ: 4, ENFP: 4, ENTJ: 3, ESFJ: 3, ENTP: 2, INFJ: 2, ESTJ: 2, INFP: 1 },
  },
  {
    id: "c06",
    name: "スイタ物流サービス",
    industry: "物流・倉庫",
    employees: 110,
    description:
      "EC向け物流センターを吹田・摂津で運営。倉庫の自動化・ロボット導入を進めており、現場改善のアイデアを若手からどんどん採用している。",
    pr: "改善が好きな人、体を動かすのも頭を使うのも好きな人に!",
    booth: { label: "B-2", x: 1, y: 1 },
    mbti: { ISTJ: 22, ESTJ: 16, ISFJ: 14, ISTP: 12, ESTP: 8, ESFJ: 8, INTJ: 4, ISFP: 6 },
  },
  {
    id: "c07",
    name: "みどりケアグループ",
    industry: "介護・福祉",
    employees: 95,
    description:
      "吹田市内でデイサービス・訪問介護を展開。ICT記録システムで残業を大幅削減。介護未経験の新卒が半数以上で、資格取得支援も充実。",
    pr: "「ありがとう」を直接もらえる仕事です。人が好きな方はぜひ!",
    booth: { label: "B-3", x: 2, y: 1 },
    mbti: { ISFJ: 20, ESFJ: 18, ENFJ: 10, INFP: 9, ISFP: 12, ENFP: 8, INFJ: 6, ESFP: 12 },
  },
  {
    id: "c08",
    name: "アオバ広告社",
    industry: "広告・デザイン",
    employees: 18,
    description:
      "地域企業のブランディング・Web広告・動画制作を手がけるクリエイティブ会社。SNSプロモーションの実績多数。企画から納品まで少数精鋭で担当。",
    pr: "面白いことを本気でやりたい人、ポートフォリオ持って来てね!",
    booth: { label: "B-4", x: 3, y: 1 },
    mbti: { ENFP: 4, INFP: 3, ENTP: 3, ISFP: 2, INTP: 2, ESFP: 2, INFJ: 1, ENFJ: 1 },
  },
  {
    id: "c09",
    name: "北摂電気設備",
    industry: "電気・設備工事",
    employees: 40,
    description:
      "オフィスビル・商業施設の電気設備工事と保守を担当。資格取得費用は全額会社負担、手に職をつけて長く働ける環境が自慢。",
    pr: "文系出身の施工管理も活躍中。安定志向の人にもおすすめ!",
    booth: { label: "C-1", x: 0, y: 2 },
    mbti: { ISTJ: 8, ISTP: 7, ESTJ: 6, ESTP: 5, ISFJ: 5, INTJ: 3, ISFP: 3, ESFJ: 3 },
  },
  {
    id: "c10",
    name: "万博トラベルデザイン",
    industry: "旅行・イベント",
    employees: 26,
    description:
      "修学旅行・企業研修・地域イベントの企画運営。万博公園エリアの体験ツアーが人気。「旅をつくる側」になれる仕事。",
    pr: "ワクワクを企画したい人、フットワークの軽い人に会いたい!",
    booth: { label: "C-2", x: 1, y: 2 },
    mbti: { ESFP: 5, ENFP: 5, ESTP: 4, ESFJ: 3, ENTP: 3, ISFP: 2, ENFJ: 2, ESTJ: 2 },
  },
  {
    id: "c11",
    name: "セイワ経営会計",
    industry: "会計・士業",
    employees: 24,
    description:
      "税務・会計から経営コンサルまで、中小企業の「数字の相談役」。若手のうちから数十社を担当し、経営者と直接向き合える。簿記未経験入社も半数。",
    pr: "数字とロジックで会社を支えたい人、じっくり話しましょう。",
    booth: { label: "C-3", x: 2, y: 2 },
    mbti: { ISTJ: 7, INTJ: 4, ESTJ: 3, INTP: 3, ISFJ: 3, ENTJ: 2, INFJ: 1, ISTP: 1 },
  },
  {
    id: "c12",
    name: "グリーンテック環境",
    industry: "環境・リサイクル",
    employees: 55,
    description:
      "廃棄物の資源化・リサイクルプラント運営。脱炭素に取り組む地元企業として自治体との連携も多い。環境系の学部出身者が多数活躍。",
    pr: "「地球にいいこと」を仕事に。社会貢献を実感したい人へ!",
    booth: { label: "C-4", x: 3, y: 2 },
    mbti: { ISFJ: 9, ISTJ: 8, INFP: 6, ESTJ: 5, INFJ: 4, ENFJ: 4, ISFP: 5, ENFP: 4, ISTP: 5, ESFJ: 5 },
  },
];
