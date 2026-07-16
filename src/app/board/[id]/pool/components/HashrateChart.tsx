"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { AxisValueFormatterContext } from "@mui/x-charts";
import Typography from '@mui/material/Typography';

import { PoolHistoryRecord } from "../../../../../../models/API Payloads/PoolHistoryRecord";
import UnitConverter from "../../../../../lib/UnitConverter";


export default function HashrateChart({
  data,
}: {
  data: PoolHistoryRecord[];
}) {
  const chartData = data
    .map((d) => ({
      timestamp: new Date(d.timestamp),
      avg_hashrate1h: Number(d.avg_hashrate1h),
      avg_hashrate1d: Number(d.avg_hashrate1d),
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (

    <div style={{
      height: 370,
    }}>
      <Typography style={{ textAlign: "center" }}>Hashrate</Typography>
      <LineChart
        dataset={chartData}
        yAxis={[
          {
            label: "Hashrate (H/s)",
            valueFormatter: (value: number, context: AxisValueFormatterContext) => {
              if (context.location === "tick" && context.defaultTickLabel === "") return "";
              return UnitConverter.fromNumberToString(value, 3);
            },
          },
        ]}
        xAxis={[
          {
            dataKey: "timestamp",
            scaleType: "time",
            label: "Date",
            /**
             * IMPORTANT:
             * - context.location === 'tick'  -> rendering on axis ticks
             * - context.location === 'tooltip' -> rendering inside tooltip header
             */
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
          },
        ]}
        series={[
          {
            dataKey: "avg_hashrate1h",
            label: "Hashrate (1h)",
            showMark: false,
            valueFormatter: (v: number | null) => {
              if (!v) return "0";
              return UnitConverter.fromNumberToString(v);
            },
          },
          {
            dataKey: "avg_hashrate1d",
            label: "Hashrate (1j)",
            showMark: false,
            valueFormatter: (v: number | null) => {
              if (!v) return "0";
              return UnitConverter.fromNumberToString(v);
            },
          },
        ]}
        // slotProps={{
        //   legend: { position: { vertical: "top", horizontal: "center" } },
        //   tooltip: {
        //     trigger: "axis",
        //   }
        // }}
      />
    </div>
  );
}