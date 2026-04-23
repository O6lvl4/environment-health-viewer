# Use Cases

このアプリのユースケースは「ダッシュボードを最新化する」一つだけ。
入力 = (現在時刻, 注入された Ports)、出力 = `DashboardData` または `RefreshError`。

## 1. シーケンス: refreshDashboard

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant Main as main.ts
  participant UC as refreshDashboard
  participant POS as PositionProvider
  participant FC as ForecastProvider
  participant AQ as AirQualityProvider
  participant GEO as Geocoder
  participant JMA as WarningsProvider
  participant DOM as Renderers

  U->>Main: ↻ click / 初期ロード
  Main->>Main: apply(loading: location)
  Main->>UC: refreshDashboard(deps, onStage)
  UC->>POS: current()
  POS-->>UC: Location (現在地 or 東京)
  UC->>Main: onStage("fetch")
  Main->>Main: apply(loading: fetch)

  par 気象データ並行取得
    UC->>FC: fetch(coord)
    FC-->>UC: Result of WeatherSnapshot
  and
    UC->>AQ: fetch(coord)
    AQ-->>UC: Result of AirQualitySnapshot
  end

  alt どちらか err
    UC-->>Main: err({stage:"fetch", message})
    Main->>Main: apply(error)
  else 全て ok
    UC->>UC: Conditions.observe(snap, now)
    UC->>UC: buildAssessment(snap, air, now)
    UC->>UC: SolarCycle.fromDaily(daily)

    UC->>GEO: reverse(coord)
    GEO-->>UC: prefecture label or null

    opt 日本国内 + 都道府県解決OK
      UC->>JMA: fetch(prefecture)
      JMA-->>UC: WarningSet (空集合もあり)
    end

    UC-->>Main: ok(DashboardData)
    Main->>DOM: renderSummary / renderNow / renderCards / renderSolar / renderPressure / renderWarnings
    Main->>Main: apply(ready)
  end
```

主な不変条件:
- POS は **必ず** `Location` を返す (Geolocation 失敗は東京フォールバック)
- 逆ジオの失敗は致命的ではなく、警報セクションが出ないだけ
- 大気質が落ちても天気だけで進む — 現状は両方必要 (将来分岐可能)

## 2. 状態遷移: DashboardState

```mermaid
stateDiagram-v2
  [*] --> Init
  Init --> Loading_Location: run() 起動
  Loading_Location --> Loading_Fetch: 位置取得 完了
  Loading_Fetch --> Ready: 気象+大気質 取得成功
  Loading_Fetch --> Error: いずれかの fetch 失敗
  Ready --> Loading_Location: ↻ ボタン押下
  Error --> Loading_Location: ↻ ボタン押下
  Ready --> Ready: 自動再描画なし (現状)
```

各状態で表示される UI:

| 状態 | スケルトン | カード | ステータス行 | リフレッシュボタン |
|---|---|---|---|---|
| `init` | — | — | INIT | active |
| `loading.location` | 5枚表示 | — | LOC/REQ | spin |
| `loading.fetch` | 維持 | — | FETCH | spin |
| `ready` | hide | 全 panel 表示 | READY | active |
| `error` | hide | 維持 (エラーメッセージのみ) | ERROR ... | active |

## 3. 例: テストでの差し替え方

```ts
import { refreshDashboard } from "./application/refresh-dashboard.js";
import { ok } from "./domain/shared/result.js";

const r = await refreshDashboard({
  position: { current: async () => mockTokyoLocation },
  geocoder: { reverse: async () => "東京都" },
  forecast: { fetch: async () => ok(dummyWeather) },
  airQuality: { fetch: async () => ok(dummyAir) },
  warnings: { fetch: async () => ok(emptyWarningSet) },
  clock: () => new Date("2026-04-23T12:00:00+09:00"),
});
```

ブラウザ・ネットワーク・実時間 すべてが port になっているので決定論的に検証できる。
