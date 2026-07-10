/**
 * 吹田みらい企業マッチングフェス - 企業データ集約用 GAS バックエンド(任意)
 *
 * これを使うと、企業が company.html から直接オンライン送信でき、
 * 学生アプリ(index.html)は常に最新の企業データを取得できます。
 * 使わない場合は、企業からJSONをメール等で受け取り admin.html で取り込めばOKです。
 *
 * ■ セットアップ手順
 * 1. Googleスプレッドシートを新規作成
 * 2. 拡張機能 > Apps Script を開き、このコードを貼り付け
 * 3. デプロイ > 新しいデプロイ > 種類「ウェブアプリ」
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 4. 発行されたURLを js/config.js の GAS_ENDPOINT に設定
 *
 * ■ データの持ち方
 * シート「companies」に1社1行、JSON文字列で保存(同名企業は上書き)
 */

var SHEET_NAME = "companies";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["name", "updatedAt", "json"]);
  }
  return sheet;
}

/** 企業登録(company.html からの送信を受け付ける) */
function doPost(e) {
  var result = { ok: false };
  try {
    var entry = JSON.parse(e.postData.contents);
    if (!entry.name || !entry.mbti) {
      throw new Error("name と mbti は必須です");
    }
    var sheet = getSheet_();
    var values = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === entry.name) {
        rowIndex = i + 1;
        break;
      }
    }
    var row = [entry.name, new Date().toISOString(), JSON.stringify(entry)];
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, 3).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    result.ok = true;
  } catch (err) {
    result.error = String(err);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** 企業一覧の配信(index.html が取得する) */
function doGet() {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var companies = [];
  for (var i = 1; i < values.length; i++) {
    try {
      companies.push(JSON.parse(values[i][2]));
    } catch (e) {
      // 壊れた行はスキップ
    }
  }
  var payload = {
    companies: companies,
    mapConfig: {
      cols: 4,
      rows: Math.max(1, Math.ceil(companies.length / 4)),
      title: "吹田みらい企業マッチングフェス 会場マップ",
    },
  };
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
