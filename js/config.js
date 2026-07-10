/**
 * アプリ設定
 *
 * GAS_ENDPOINT に Google Apps Script のWebアプリURLを設定すると、
 * 学生アプリは data.js の代わりにGASから最新の企業データを取得する。
 * (空文字のままなら data.js のデータを使用)
 *
 * GAS側のコードは gas/Code.gs を参照。
 */
const APP_CONFIG = {
  GAS_ENDPOINT: "",
};
