/**
 * MBTI 基礎データ
 * - 16タイプの定義(和名・グループ・簡単な説明)
 * - 簡易診断(12問)の設問データ
 */

const MBTI_AXES = ["EI", "SN", "TF", "JP"];

const MBTI_TYPES = {
  INTJ: { name: "建築家", group: "NT", desc: "戦略的で独立心が強い計画家タイプ" },
  INTP: { name: "論理学者", group: "NT", desc: "知的好奇心が強い分析家タイプ" },
  ENTJ: { name: "指揮官", group: "NT", desc: "決断力のあるリーダータイプ" },
  ENTP: { name: "討論者", group: "NT", desc: "発想豊かなチャレンジャータイプ" },
  INFJ: { name: "提唱者", group: "NF", desc: "理想を静かに追う思いやりタイプ" },
  INFP: { name: "仲介者", group: "NF", desc: "価値観を大切にする共感タイプ" },
  ENFJ: { name: "主人公", group: "NF", desc: "人を導き励ますまとめ役タイプ" },
  ENFP: { name: "運動家", group: "NF", desc: "情熱的で社交的なアイデアタイプ" },
  ISTJ: { name: "管理者", group: "SJ", desc: "誠実で責任感の強い堅実タイプ" },
  ISFJ: { name: "擁護者", group: "SJ", desc: "献身的に支える縁の下タイプ" },
  ESTJ: { name: "幹部", group: "SJ", desc: "組織を動かす実務リーダータイプ" },
  ESFJ: { name: "領事", group: "SJ", desc: "気配り上手なチームワークタイプ" },
  ISTP: { name: "巨匠", group: "SP", desc: "手を動かして解決する職人タイプ" },
  ISFP: { name: "冒険家", group: "SP", desc: "柔軟でマイペースな感性タイプ" },
  ESTP: { name: "起業家", group: "SP", desc: "行動力抜群の現場対応タイプ" },
  ESFP: { name: "エンターテイナー", group: "SP", desc: "場を明るくするムードメーカータイプ" },
};

const MBTI_TYPE_LIST = Object.keys(MBTI_TYPES);

const MBTI_GROUPS = {
  NT: { name: "分析家", color: "#8b5cf6" },
  NF: { name: "外交官", color: "#10b981" },
  SJ: { name: "番人", color: "#3b82f6" },
  SP: { name: "探検家", color: "#f59e0b" },
};

const AXIS_INFO = {
  EI: {
    letters: ["E", "I"],
    labels: { E: "外向型", I: "内向型" },
    theme: "エネルギーの向き",
  },
  SN: {
    letters: ["S", "N"],
    labels: { S: "感覚型", N: "直観型" },
    theme: "情報の受け取り方",
  },
  TF: {
    letters: ["T", "F"],
    labels: { T: "思考型", F: "感情型" },
    theme: "判断の基準",
  },
  JP: {
    letters: ["J", "P"],
    labels: { J: "判断型", P: "知覚型" },
    theme: "外界への接し方",
  },
};

/**
 * 簡易診断: 各軸3問 × 4軸 = 12問。
 * choiceA を選ぶと axis の1文字目、choiceB で2文字目にポイント。
 */
const QUIZ_QUESTIONS = [
  {
    axis: "EI",
    q: "初対面の人が多い場では?",
    a: "自分から話しかけてまわる方だ",
    b: "話しかけられるのを待つ方だ",
  },
  {
    axis: "EI",
    q: "休日のリフレッシュ方法は?",
    a: "友達と会って話すと元気になる",
    b: "一人の時間を過ごすと元気になる",
  },
  {
    axis: "EI",
    q: "考えごとをするときは?",
    a: "話しながら考えを整理する",
    b: "頭の中でじっくり整理してから話す",
  },
  {
    axis: "SN",
    q: "物事を理解するときは?",
    a: "具体的な事実やデータから考える",
    b: "全体のイメージや可能性から考える",
  },
  {
    axis: "SN",
    q: "説明を聞くときに気になるのは?",
    a: "手順や実例などの具体的な話",
    b: "背景にある意味やこれからの展望",
  },
  {
    axis: "SN",
    q: "仕事で任されたいのは?",
    a: "確実に成果が出る堅実な仕事",
    b: "前例のない新しい挑戦",
  },
  {
    axis: "TF",
    q: "友人から相談を受けたら?",
    a: "解決策を一緒に考える",
    b: "まず気持ちに寄り添って聞く",
  },
  {
    axis: "TF",
    q: "意見が対立したときは?",
    a: "筋が通っているかを重視する",
    b: "みんなが納得できるかを重視する",
  },
  {
    axis: "TF",
    q: "評価されてうれしいのは?",
    a: "「仕事が正確で論理的だね」",
    b: "「あなたがいると雰囲気が良くなるね」",
  },
  {
    axis: "JP",
    q: "旅行の計画は?",
    a: "事前にしっかり立てたい",
    b: "現地の気分で自由に決めたい",
  },
  {
    axis: "JP",
    q: "課題やタスクは?",
    a: "早めに終わらせて安心したい",
    b: "締切が近づくと集中できる",
  },
  {
    axis: "JP",
    q: "予定が急に変わると?",
    a: "少し戸惑う。決めた通りに進めたい",
    b: "むしろ楽しい。柔軟に対応できる",
  },
];

/** 回答配列(0=a, 1=b)からタイプ文字列を算出 */
function quizResultType(answers) {
  const tally = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  QUIZ_QUESTIONS.forEach((question, i) => {
    const letters = AXIS_INFO[question.axis].letters;
    tally[letters[answers[i] === 0 ? 0 : 1]]++;
  });
  return (
    (tally.E >= tally.I ? "E" : "I") +
    (tally.S > tally.N ? "S" : "N") +
    (tally.T >= tally.F ? "T" : "F") +
    (tally.J >= tally.P ? "J" : "P")
  );
}
