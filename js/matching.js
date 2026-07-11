/**
 * マッチングロジック
 *
 * 学生のMBTIタイプと、企業の「全社員のMBTI分布」からマッチ度を算出する。
 *
 * 考え方(スライドの方針どおり「診断は対話のきっかけ」なので、
 * シンプルで説明できる加重一致方式にしている):
 *   - 2人のタイプ間スコア = 軸ごとの一致に重みを付けて合算(最大100)
 *       S/N(情報の受け取り方) … 35点  ← 会話の噛み合いに最も効くとされる
 *       T/F(判断の基準)       … 25点
 *       J/P(進め方)           … 20点
 *       E/I(エネルギーの向き) … 20点
 *   - 企業スコア = 社員分布で重み付けした平均
 *   - 表示用マッチ度 = 企業スコアを見やすくスケーリングしたもの
 */

const AXIS_WEIGHTS = { SN: 35, TF: 25, JP: 20, EI: 20 };

/** タイプ文字列から軸ごとの文字を取り出す */
function axisLetter(type, axis) {
  const pos = { EI: 0, SN: 1, TF: 2, JP: 3 };
  return type[pos[axis]];
}

/** 2タイプ間の相性スコア(0〜100) */
function pairScore(typeA, typeB) {
  let score = 0;
  for (const axis of Object.keys(AXIS_WEIGHTS)) {
    if (axisLetter(typeA, axis) === axisLetter(typeB, axis)) {
      score += AXIS_WEIGHTS[axis];
    }
  }
  return score;
}

/** 企業の社員分布の合計人数 */
function totalEmployees(mbtiCounts) {
  return Object.values(mbtiCounts || {}).reduce((s, n) => s + (Number(n) || 0), 0);
}

/**
 * 企業1社に対するマッチ結果を計算する。
 * @returns {object} {
 *   score:        表示用マッチ度 0〜100,
 *   rawScore:     加重平均の生スコア,
 *   sameTypePct:  学生と同じタイプの社員割合,
 *   kindredPct:   相性スコア60以上の社員割合(「気が合いそうな社員」),
 *   axisSamePct:  軸ごとの一致割合 {EI, SN, TF, JP},
 *   topTypes:     社員数の多い順のタイプ配列 [{type, count, pct}],
 *   groupPct:     4グループ別の割合 {NT, NF, SJ, SP},
 * }
 */
function matchCompany(studentType, company) {
  const counts = company.mbti || {};
  const total = totalEmployees(counts);
  if (!studentType || total === 0) {
    return null;
  }

  let weighted = 0;
  let sameType = 0;
  let kindred = 0;
  const axisSame = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const groupCount = { NT: 0, NF: 0, SJ: 0, SP: 0 };

  for (const [type, rawCount] of Object.entries(counts)) {
    const count = Number(rawCount) || 0;
    if (count === 0 || !MBTI_TYPES[type]) continue;
    const ps = pairScore(studentType, type);
    weighted += ps * count;
    if (type === studentType) sameType += count;
    if (ps >= 60) kindred += count;
    for (const axis of MBTI_AXES) {
      if (axisLetter(studentType, axis) === axisLetter(type, axis)) {
        axisSame[axis] += count;
      }
    }
    groupCount[MBTI_TYPES[type].group] += count;
  }

  const rawScore = weighted / total;

  const topTypes = Object.entries(counts)
    .map(([type, count]) => ({ type, count: Number(count) || 0 }))
    .filter((t) => t.count > 0 && MBTI_TYPES[t.type])
    .sort((a, b) => b.count - a.count)
    .map((t) => ({ ...t, pct: Math.round((t.count / total) * 100) }));

  const pct = (n) => Math.round((n / total) * 100);

  return {
    score: displayScore(rawScore),
    rawScore,
    total,
    sameTypePct: pct(sameType),
    kindredPct: pct(kindred),
    axisSamePct: {
      EI: pct(axisSame.EI),
      SN: pct(axisSame.SN),
      TF: pct(axisSame.TF),
      JP: pct(axisSame.JP),
    },
    topTypes,
    groupPct: {
      NT: pct(groupCount.NT),
      NF: pct(groupCount.NF),
      SJ: pct(groupCount.SJ),
      SP: pct(groupCount.SP),
    },
  };
}

/**
 * 生スコア(理論上おおむね30〜70に集まる)を、
 * 差がわかりやすい0〜100の表示値に変換する。
 */
function displayScore(rawScore) {
  const scaled = ((rawScore - 20) / 60) * 100;
  return Math.max(5, Math.min(99, Math.round(scaled)));
}

/** 全企業のマッチ結果を計算し、マッチ度降順に順位を付けて返す */
function matchAllCompanies(studentType, companies) {
  const results = companies
    .map((company) => ({ company, match: matchCompany(studentType, company) }))
    .filter((r) => r.match !== null);
  results.sort((a, b) => b.match.rawScore - a.match.rawScore);
  results.forEach((r, i) => {
    r.rank = i + 1;
  });
  return results;
}

/** マッチ度に応じた色 — 彩度を抑えた柔らかいパレット */
function scoreColor(score) {
  if (score >= 75) return "#c45578"; // ベストマッチ: ミュートローズ
  if (score >= 60) return "#c87848"; // 好相性: テラコッタ
  if (score >= 45) return "#b89040"; // まずまず: ミュートゴールド
  if (score >= 30) return "#4f6bbf"; // ふつう: ペリウィンクル
  return "#8a93b2"; // 意外な出会い: スレートグレー
}

function scoreLabel(score) {
  if (score >= 75) return "ベストマッチ";
  if (score >= 60) return "好相性";
  if (score >= 45) return "まずまず";
  if (score >= 30) return "ふつう";
  return "意外な出会い";
}

/**
 * 「話のきっかけ」を生成する。
 * 学生タイプと企業の分布から、共通点・違いを会話ネタとして提示する。
 */
function conversationStarters(studentType, match) {
  const tips = [];
  if (match.sameTypePct > 0) {
    tips.push(
      `あなたと同じ ${studentType}(${MBTI_TYPES[studentType].name})の社員さんが${match.sameTypePct}%います。「社内に${MBTI_TYPES[studentType].name}タイプの方がいると聞きました」と聞いてみましょう。`
    );
  }
  const sn = match.axisSamePct.SN;
  const snLetter = axisLetter(studentType, "SN");
  if (sn >= 50) {
    tips.push(
      `社員の${sn}%があなたと同じ${AXIS_INFO.SN.labels[snLetter]}(${snLetter})。仕事の進め方の話が噛み合いやすいはず。「普段どんなふうに仕事を進めていますか?」と聞いてみましょう。`
    );
  } else {
    const other = snLetter === "S" ? "N" : "S";
    tips.push(
      `${AXIS_INFO.SN.labels[other]}(${other})の社員さんが多め。自分と違う視点の話が聞けるチャンス。「入社して考え方が変わったことはありますか?」と聞いてみましょう。`
    );
  }
  const topGroup = Object.entries(match.groupPct).sort((a, b) => b[1] - a[1])[0];
  if (topGroup && topGroup[1] > 0) {
    tips.push(
      `社風は「${MBTI_GROUPS[topGroup[0]].name}(${topGroup[0]})」系が${topGroup[1]}%と最多。ブースで「どんな性格の人が活躍していますか?」と聞くと盛り上がります。`
    );
  }
  return tips.slice(0, 3);
}
