# Domain Model

各 Bounded Context の主要な集約・値オブジェクト・ドメインサービスをクラス図で示す。

## 1. Shared Kernel

ドメイン全体で再利用される基本要素。

```mermaid
classDiagram
  class RiskLevel {
    <<enum>>
    Low
    Mid
    High
    Danger
  }

  class Result~T,E~ {
    <<sum type>>
    Ok(value: T)
    Err(error: E)
  }

  class Brand~T,B~ {
    <<utility>>
    primitive T と コンパイル時タグ B
  }

  class Hpa { <<branded number>> }
  class Celsius { <<branded number>> }
  class Percent { <<branded number>> }
  class UvIndex { <<branded number>> }
  class MicrogramsPerCubicMeter { <<branded number>> }
  class GrainsPerCubicMeter { <<branded number>> }
  class MmPerHour { <<branded number>> }

  Hpa ..|> Brand
  Celsius ..|> Brand
  Percent ..|> Brand
  UvIndex ..|> Brand
  MicrogramsPerCubicMeter ..|> Brand
  GrainsPerCubicMeter ..|> Brand
  MmPerHour ..|> Brand
```

## 2. Location Context

```mermaid
classDiagram
  class Coordinate {
    +latitude: Latitude
    +longitude: Longitude
    +create(lat, lon): Result~Coordinate, string~
    +isInJapan(c): boolean
  }
  class Location {
    +coordinate: Coordinate
    +source: "geolocation" | "default"
    +label: string?
    +withLabel(label): Location
  }
  class Latitude { <<branded number>> }
  class Longitude { <<branded number>> }
  class Prefecture {
    <<branded string>>
    +of(raw): Result~Prefecture, string~
  }

  Location *-- Coordinate
  Coordinate *-- Latitude
  Coordinate *-- Longitude
```

## 3. Conditions Context

```mermaid
classDiagram
  class WeatherSnapshot {
    +hourly: WeatherHourly
    +daily: WeatherDaily
    +timezone: string
  }
  class WeatherHourly {
    +time: string[]
    +pressure: Hpa[]
    +temperature: Celsius[]
    +humidity: Percent[]
    +weatherCode: number[]
    +precipitation: MmPerHour[]
    +precipitationProbability: Percent[]
  }
  class WeatherDaily {
    +time: string[]
    +temperatureMax: Celsius[]
    +temperatureMin: Celsius[]
    +uvIndexMax: UvIndex[]
    +sunrise: string[]
    +sunset: string[]
  }
  class AirQualitySnapshot {
    +hourly: AirQualityHourly
  }
  class AirQualityHourly {
    +pm25: MicrogramsPerCubicMeter[]
    +pm10: MicrogramsPerCubicMeter[]
    +europeanAqi: number[]
    +dust: MicrogramsPerCubicMeter[]?
    +pollen: PollenHourly
  }
  class Conditions {
    <<value object>>
    +observedAt: Date
    +temperature: Celsius
    +humidity: Percent
    +todayMax/Min: Celsius
    +weather: WeatherCondition
    +rainProbabilityNext6h: Percent
    +precipitationNow: MmPerHour
    +observe(snapshot, now): Conditions
  }
  class WeatherCondition {
    +code: number
    +emoji: string
    +label: string
  }

  WeatherSnapshot *-- WeatherHourly
  WeatherSnapshot *-- WeatherDaily
  AirQualitySnapshot *-- AirQualityHourly
  Conditions ..> WeatherSnapshot : observes
  Conditions *-- WeatherCondition
```

## 4. Risk Context

```mermaid
classDiagram
  class Assessment {
    <<aggregate>>
    +metrics: Metric[]
    +create(metrics): Assessment
    +systemLevel(a): RiskLevel
    +summary(a): SystemSummary
  }
  class Metric {
    <<value object>>
    +id: MetricId
    +title: string
    +icon: string
    +level: RiskLevel
    +value: string
    +unit: string?
    +note: string
  }
  class MetricId {
    <<enum>>
    Migraine
    TempSwing
    Heat
    Uv
    AirQuality
    Dust
    Pollen
  }
  class SystemSummary {
    +level: RiskLevel
    +message: string
  }

  class assessMigraine
  class assessTempSwing
  class assessHeat
  class assessUv
  class assessAirQuality
  class assessDust
  class assessPollen
  class buildAssessment {
    <<domain service>>
    +(weather, air, now): Assessment
  }

  Assessment "1" *-- "*" Metric
  Metric --> RiskLevel
  Metric --> MetricId
  Assessment ..> SystemSummary

  buildAssessment ..> assessMigraine
  buildAssessment ..> assessTempSwing
  buildAssessment ..> assessHeat
  buildAssessment ..> assessUv
  buildAssessment ..> assessAirQuality
  buildAssessment ..> assessDust
  buildAssessment ..> assessPollen
  buildAssessment ..> Assessment : creates
```

各 `assess*` 関数は内部で `observe*` (純粋な観測量計算) と「閾値→RiskLevel 判定」に分かれる。

## 5. Warnings Context

```mermaid
classDiagram
  class WarningSet {
    <<aggregate>>
    +prefecture: Prefecture
    +reportedAt: Date?
    +warnings: ActiveWarning[]
    +create(...): WarningSet
    +isEmpty(s): boolean
  }
  class ActiveWarning {
    <<value object>>
    +code: string
    +name: string
    +severity: Severity
    +areas: string[]
  }
  class Severity {
    <<enum>>
    Alert
    Warn
    Info
  }
  class OfficeCode {
    <<branded string>>
    +forPrefecture(p): OfficeCode?
  }
  class WarningMeta {
    +code: string
    +name: string
    +severity: Severity
  }
  class lookupWarningMeta {
    <<lookup>>
    +(code: string): WarningMeta?
  }

  WarningSet "1" *-- "*" ActiveWarning
  ActiveWarning --> Severity
  WarningSet ..> Prefecture
  OfficeCode ..> Prefecture
```

## 6. Solar Context

```mermaid
classDiagram
  class SolarCycle {
    <<value object>>
    +sunrise: Date
    +sunset: Date
    +dayLength: DayLength
    +fromDaily(daily): SolarCycle?
  }
  class DayLength {
    +hours: number
    +minutes: number
  }
  SolarCycle *-- DayLength
  SolarCycle ..> WeatherDaily : derives from
```

## 7. 値オブジェクトの不変条件

| VO | 不変条件 |
|---|---|
| `Coordinate` | -90 ≤ lat ≤ 90, -180 ≤ lon ≤ 180 |
| `Hpa` | 800 ≤ x ≤ 1100 |
| `Celsius` | -90 ≤ x ≤ 70 |
| `Percent` | 0 ≤ x ≤ 100 |
| `UvIndex` | 0 ≤ x ≤ 20 |
| `MicrogramsPerCubicMeter` / `GrainsPerCubicMeter` / `MmPerHour` | x ≥ 0 |
| `Prefecture` | 末尾「都/道/府/県」付きの非空文字列 |
| `WarningSet` | warnings は severity 順でソート (alert → warn → info) |
| `Assessment` | metrics 配列は適用可能なものだけが含まれる (黄砂/花粉はデータなしなら省略) |
