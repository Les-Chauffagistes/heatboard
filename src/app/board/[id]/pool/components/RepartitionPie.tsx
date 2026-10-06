"use client";

import {PieChart} from "@mui/x-charts/PieChart";
import {useDrawingArea} from "@mui/x-charts/hooks";

import {styled} from "@mui/material/styles";
import Typography from '@mui/material/Typography';

import {components} from "@chauffagistes/cmn";


function getPieData(weights: components["schemas"]["PoolDistributionElement"][], maxOthersPercent = 0.15) {
    const parsed = weights.map((w) => ({label: w.workername, value: w.part}));
    parsed.sort((a, b) => b.value - a.value);

    const total = parsed.reduce((sum, w) => sum + w.value, 0);

    let othersSum = 0;
    const large: typeof parsed = [];

    for (let i = parsed.length - 1; i >= 0; i--) {
        const candidate = parsed[i];
        if ((othersSum + candidate.value) / total <= maxOthersPercent) {
            othersSum += candidate.value;
        } else {
            large.unshift(candidate);
        }
    }

    if (othersSum > 0) {
        large.push({label: "Autres", value: othersSum});
    }

    return large;
}

const StyledText = styled('text')(({theme}) => ({
    fill: theme.palette.text.primary,
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: 60,
}));

function PieCenterLabel({children}: { children: React.ReactNode }) {
    const {width, height, left, top} = useDrawingArea();
    return (
        <StyledText x={left + width / 2} y={top + height / 2}>
            {children}
        </StyledText>
    );
}

export default function RepartitionPie({
                                           weights,
                                           size,
                                       }: Readonly<{
    weights: components["schemas"]["PoolDistributionElement"][];
    size: number;
}>) {
    if (!weights || weights.length === 0) return <div>No data</div>;

    const data = getPieData(weights, 0.1);
    const outerRadius = size * 0.35;
    const innerRadius = size * 0.2;

    return (
        <div
            style={{
                width: "100%",
                // height: "100%",
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                flexDirection: "column",
            }}
        >
            <Typography>Répartition</Typography>

            <PieChart
                width={size}
                height={size}
                series={[
                    {
                        outerRadius,
                        innerRadius,
                        paddingAngle: 0.5,
                        cornerRadius: 3,
                        data,
                        valueFormatter: (v) => `${v.value.toFixed(1)}%`,
                        arcLabel: (v) => `${v.label}`,
                        arcLabelMinAngle: 20,
                    },
                ]}
                hideLegend
            >
                <PieCenterLabel>🔥</PieCenterLabel>
            </PieChart>
        </div>
    );
}
