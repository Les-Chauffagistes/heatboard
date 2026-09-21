import { AxisValueFormatterContext, LineChart, LineSeries, YAxis } from "@mui/x-charts";
import { WorkerHistoryRecord } from "../../../../../../models/API Payloads/WorkerHistoryRecord";
import UnitConverter from "../../../../../lib/UnitConverter";
import { frFRLocalText } from '@mui/x-charts/locales';

export default function HashreateLine({ history, showHashrate1h, showWeight, compact }: { history: WorkerHistoryRecord[], showHashrate1h: boolean, showWeight: boolean, compact?: boolean }) {
    const series: LineSeries[] = []
    if (showHashrate1h) {
        series.push(
            {
                data: history.map((item) => UnitConverter.fromStringToNumber(item.avg_hashrate1h)),
                showMark: false,
                yAxisId: 'hashrateAxis',
                label: compact ? "1h" : "Hashrate (1h)",
                valueFormatter: (v: number | null) => {
                    if (!v) return "0";
                    return UnitConverter.fromNumberToString(v);
                },
            }
        )
    }
    series.push(
        {
            data: history.map((item) => UnitConverter.fromStringToNumber(item.avg_hashrate1d)),
            showMark: false,
            yAxisId: 'hashrateAxis',
            label: compact ? "1d" : "Hashrate (1d)",
            valueFormatter: (v: number | null) => {
                if (!v) return "0";
                return UnitConverter.fromNumberToString(v);
            },
        },
        {
            data: history.map((item) => UnitConverter.fromStringToNumber(item.avg_hashrate7d)),
            showMark: false,
            yAxisId: 'hashrateAxis',
            label: compact ? "7d" : "Hashrate (7d)",
            valueFormatter: (v: number | null) => {
                if (!v) return "0";
                return UnitConverter.fromNumberToString(v);
            },
        }
    );
    // Le préfixe d'échelle (K/M/G/T/...) dépend de l'ordre de grandeur réel des
    // données (avec les mocks, c'est du TH/s) — jamais du H/s brut codé en dur.
    const hashrateValues = series
        .filter(s => s.yAxisId === 'hashrateAxis')
        .flatMap(s => s.data as (number | null)[])
        .filter((v): v is number => v != null && Number.isFinite(v));
    const maxHashrate = hashrateValues.length ? Math.max(...hashrateValues.map(Math.abs)) : 0;
    const hashrateUnitLabel = `Hashrate (${UnitConverter.unitPrefix(maxHashrate)}H/s)`;

    const axis: YAxis[] = [
        {
            id: 'hashrateAxis',
            width: compact ? 42 : 70,
            label: compact ? undefined : hashrateUnitLabel,
            valueFormatter(value: number, context: AxisValueFormatterContext) {
                if (context.location === "tick" && context.defaultTickLabel === "") return "";
                return UnitConverter.fromNumberToString(value, 3);
            }
        }
    ]

    if (showWeight) {
        series.push(
            {
                data: history.map((item) => Number.parseFloat(item.avg_weight)),
                showMark: false,
                yAxisId: 'weightAxis',
                label: "Poids",
                valueFormatter: (v: number | null) => {
                    if (!v) return "0%";
                    return v.toFixed(1) + "%";
                },
            }
        )
        axis.push(
            {
                id: 'weightAxis',
                position: "right",
                width: compact ? 38 : 70,
                label: compact ? undefined : "Poids (%)",
                valueFormatter(value: number, context: AxisValueFormatterContext) {
                    if (context.location === "tick" && context.defaultTickLabel === "") return "";
                    return value + "%";
                }
            }
        )
    }

    return (
        <div>
            {/* En compact, l'unité de chaque axe n'est plus le titre vertical de l'axe
                (trop large sur un écran étroit) mais un rappel textuel court au-dessus
                du graphe, à côté de la légende. */}
            {compact && (
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    color: "var(--secondary-white-text-color)",
                    marginBottom: 2,
                }}>
                    <span>{hashrateUnitLabel}</span>
                    {showWeight && <span>Poids (%)</span>}
                </div>
            )}
            <LineChart
                localeText={frFRLocalText}
                height={compact ? 340 : 400}
                margin={compact ? { left: 4, right: 4, top: 8, bottom: 28 } : undefined}
                yAxis={axis}
                xAxis={[
                    {
                        data: history.map((item) => new Date(item.timestamp)),
                        scaleType: "time",
                        label: compact ? undefined : "Date",
                        valueFormatter: (value: Date, context: AxisValueFormatterContext) =>
                            context?.location === "tick"
                                ? (value as Date).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                })
                                : (value as Date).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }),
                    }
                ]}
                series={series}
                slotProps={compact ? {
                    legend: {
                        direction: "horizontal" as const,
                        sx: { fontSize: "0.7rem" },
                    },
                } : undefined}
            />
        </div>
    )
}
