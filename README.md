# 環境ヘルスチェック (environment-health-viewer)

偏頭痛・熱中症・UV・大気質・花粉の現在地リスクを一覧する静的ビューア。

## 表示項目

- **偏頭痛リスク**: 海面気圧の 12h 窓での最大下降幅から推定。
- **熱中症リスク**: 気温・湿度から WBGT を推定（屋内/日陰想定の簡易式）。
- **UV 指数**: 当日の最大 UVI。
- **大気質**: PM2.5 と European AQI。
- **花粉**: ハンノキ/シラカバ/イネ科/ヨモギ/オリーブ/ブタクサ。

データはすべて [Open-Meteo](https://open-meteo.com/) の無料公開 API から取得（APIキー不要）。
逆ジオコーディングは BigDataCloud の無料エンドポイントを使用。

## 開発

```sh
npm install
npm run dev
```

## ビルド

```sh
npm run build
```

`dist/` に静的ファイルが出力される。

## デプロイ

`main` への push で GitHub Actions が自動的に GitHub Pages にデプロイする。
リポジトリ Settings → Pages → Source を「GitHub Actions」に設定しておくこと。

## 注意

表示はあくまで気象データからの推定であり、医学的な助言ではありません。
体調が悪い場合は無理をせず、必要に応じて医師に相談してください。
