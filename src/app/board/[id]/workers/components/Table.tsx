import { AllCommunityModule, ColDef, ModuleRegistry, RowClickedEvent, ValueFormatterParams, colorSchemeDark, colorSchemeLight, themeQuartz } from 'ag-grid-community';
import { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { Worker } from '../../../../../../models/Worker';
import { useEffect, useMemo, useState } from 'react';
import UnitConverter from '../../../../../lib/UnitConverter';
import { AG_GRID_LOCALE_FR } from "../../../../../../locale/fr-FR";
import NameCell from './NameCell';
import { CleanWorkerHashrate } from '../../../../../../models/CleanWorkerHashrate';
import { HeaderWithInfo } from './HeaderInfo';
import formatNumber from '../../../../../lib/NumberFormatter';


ModuleRegistry.registerModules([AllCommunityModule]);



export function MainGrid({
    btcPrice,
    isCommunityPool,
    workers,
    isHashrate1mVisible,
    isHashrate5mVisible,
    isHashrate1hrVisible,
    isHashrate1dVisible,
    isHashrate7dVisible,
    onSelectWorker
}: {
    btcPrice: number | null
    isCommunityPool: boolean,
    workers: CleanWorkerHashrate[],
    isHashrate1mVisible: boolean,
    isHashrate5mVisible: boolean,
    isHashrate1hrVisible: boolean,
    isHashrate1dVisible: boolean,
    isHashrate7dVisible: boolean,
    onSelectWorker: (worker: Worker) => void
}) {


    const [myTheme, setMyTheme] = useState(() =>
        themeQuartz.withPart(colorSchemeLight) // valeur par défaut (SSR)
    );

    useEffect(() => {
        const mq = globalThis.matchMedia("(prefers-color-scheme: dark)");
        const update = () =>
            setMyTheme(themeQuartz.withPart(mq.matches ? colorSchemeDark : colorSchemeLight));

        update(); // première évaluation
        mq.addEventListener("change", update); // mise à jour dynamique si l’utilisateur change le mode
        return () => mq.removeEventListener("change", update);
    }, []);

    const minHashrateWidth = 130;

    const columns = useMemo<ColDef<CleanWorkerHashrate>[]>(() => {
        const noData = "-";
        const cols: ColDef<CleanWorkerHashrate>[] = [{
            headerName: "Nom",
            field: "workername",
            colId: "workername",
            filter: true,
            valueFormatter: (params: ValueFormatterParams) => params.value?.split(".")[1],
            cellRenderer: (params: CustomCellRendererProps) => (
                <NameCell
                    isOnline={params.data.hashrate1m > 0}
                    workerName={params.data.workername.split(".")[1]}
                />
            ),
            minWidth: 130,
            floatingFilter: true
        }]
        if (isHashrate1mVisible) cols.push(
            {
                headerName: "Hashrate (1m)",
                field: "hashrate1m",
                colId: "hashrate1m",
                filter: false,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
                minWidth: minHashrateWidth,
            }
        )

        if (isHashrate5mVisible) cols.push(
            {
                headerName: "Hashrate (5m)",
                field: "hashrate5m",
                colId: "hashrate5m",
                filter: false,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
                // cellRenderer: (params: CustomCellRendererProps) => (
                //     <HashrateCell
                //         workerName={params.data.workername.split(".")[1]}
                //         value={params.value}
                //         period="30d"
                //         hashrateKey="hashrate5m"
                //     />
                // ),
                minWidth: minHashrateWidth,
            })
        if (isHashrate1hrVisible) cols.push(
            {
                headerName: "Hashrate (1h)",
                field: "hashrate1h",
                colId: "hashrate1h",
                filter: false,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
                // cellRenderer: (params: CustomCellRendererProps) => (
                //     <HashrateCell
                //         workerName={params.data.workername.split(".")[1]}
                //         value={params.value}
                //         period="30d"
                //         hashrateKey="hashrate1h"
                //     />
                // ),
                minWidth: minHashrateWidth,
            }
        )
        if (isHashrate1dVisible) cols.push(
            {
                headerName: "Hashrate (1d)",
                field: "hashrate1d",
                colId: "hashrate1d",
                filter: false,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
                minWidth: minHashrateWidth,
            }
        )

        if (isHashrate7dVisible) cols.push(
            {
                headerName: "Hashrate (7d)",
                field: "hashrate7d",
                colId: "hashrate7d",
                filter: false,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
            }
        )

        cols.push(
            // {
            //     headerName: "Last share",
            //     field: "lastshare",
            //     colId: "lastshare",
            //     filter: false,
            //     valueFormatter: (params: ValueFormatterParams) => {
            //         if (!params.value) return noData;
            //         return UnitConverter.fromNumberToString(params.value);
            //     },
            // },
            {
                headerName: "Shares",
                field: "shares",
                colId: "shares",
                filter: false,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
            },
            {
                headerName: "Best Share",
                field: "bestshare",
                colId: "bestshare",
                filter: false,
                minWidth: 110,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return UnitConverter.fromNumberToString(params.value);
                },
            },
            // {
            //     headerName: "Best Ever",
            //     field: "bestever",
            //     colId: "bestever",
            //     filter: false,
            //     valueFormatter: (params: ValueFormatterParams) => {
            //         if (!params.value) return noData;
            //         return UnitConverter.fromNumberToString(params.value);
            //     },
            // },
            {
                headerName: "Poids",
                colId: "avg_weight",
                field: "weight",
                filter: false,
                sortable: true,
                valueFormatter: (params: ValueFormatterParams) => {
                    if (!params.value) return noData;
                    return formatNumber(params.value.toFixed(1)) + " %";
                }
            }
        )
        if (isCommunityPool) {
            cols.push(
                {
                    headerName: "Récompense",
                    field: "rewardBtc",
                    colId: "rewardBtc",
                    valueFormatter: (params: ValueFormatterParams) => {
                        if (!params.value) return noData;
                        return formatNumber(params.value.toFixed(3)) + " ₿ - " + formatNumber((params.value * btcPrice!).toFixed(0)) + " €";
                    },
                    headerComponent: HeaderWithInfo,
                    headerComponentParams: {
                        displayName: "Récompense",
                        tooltip: "Approximatif, des frais de transaction s'appliquent",
                    },
                    flex: 0
                }
            )
        }

        return cols.flat()
    }, [btcPrice, isCommunityPool, isHashrate1dVisible, isHashrate1hrVisible, isHashrate1mVisible, isHashrate5mVisible, isHashrate7dVisible]);
    return (
        <div id="workers-grid" className="ag-theme-quartz" style={{ flex: 1, minHeight: 400 }}>
            <AgGridReact
                theme={myTheme}
                rowData={workers}
                columnDefs={columns}
                defaultColDef={{
                    minWidth: 80,
                    resizable: true,
                    flex: 1
                }}
                suppressMovableColumns={true}
                localeText={AG_GRID_LOCALE_FR}
                animateRows
                getRowId={(params) => params.data.workername} // persists selection
                suppressColumnMoveAnimation={false}
                cellSelection={false} // deprecated?
                suppressCellFocus={true}
                rowSelection={{
                    mode: 'singleRow',
                    checkboxes: false
                }}
                onRowClicked={(event: RowClickedEvent) => {
                    // console.log(event)
                    event.api.deselectAll();
                    event.node.setSelected(true);
                    onSelectWorker(event.data)
                }}
            />
        </div>
    );
}