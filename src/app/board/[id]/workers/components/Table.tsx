import { AllCommunityModule, ColDef, ModuleRegistry, PostSortRowsParams, RowClickedEvent, RowHeightParams, ModelUpdatedEvent, ValueFormatterParams, colorSchemeDark, colorSchemeLight, themeQuartz } from 'ag-grid-community';
import { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { Worker } from '../../../../../../models/Worker';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import UnitConverter from '../../../../../lib/UnitConverter';
import { AG_GRID_LOCALE_FR } from "../../../../../../locale/fr-FR";
import NameCell from './NameCell';
import { CleanWorkerHashrate } from '../../../../../../models/CleanWorkerHashrate';
import { HeaderWithInfo } from './HeaderInfo';
import formatNumber from '../../../../../lib/NumberFormatter';
import { useTheme } from '@/app/hooks/useTheme';
import WorkerPannel from './WorkerPannel';


ModuleRegistry.registerModules([AllCommunityModule]);


/**
 * Ligne "détail" injectée juste après la ligne sélectionnée. Elle est rendue en
 * pleine largeur (Full Width Row) pour afficher le graphique du mineur à même le
 * tableau, sous sa ligne. On recopie `workername` pour qu'elle passe les mêmes
 * filtres que sa ligne parente.
 */
type DetailRow = {
    __detail: true;
    id: string;
    workername: string;
    worker: CleanWorkerHashrate;
    userAddress: string;
    showWeight: boolean;
};

type GridRow = CleanWorkerHashrate | DetailRow;

const DETAIL_ROW_HEIGHT = 500;

function isDetailRow(row: GridRow | undefined | null): row is DetailRow {
    return !!row && (row as DetailRow).__detail === true;
}

function DetailCellRenderer(props: CustomCellRendererProps) {
    const data = props.data as DetailRow;
    return (
        <div style={{
            height: "100%",
            padding: "8px 12px",
            boxSizing: "border-box",
            backgroundColor: "var(--card-background-color)",
            borderTop: "1px solid var(--card-outline-color)",
            borderBottom: "1px solid var(--card-outline-color)",
        }}>
            <WorkerPannel
                worker={data.worker as unknown as Worker}
                userAddress={data.userAddress}
                showWeight={data.showWeight}
            />
        </div>
    );
}



export const MainGrid = forwardRef<AgGridReact<CleanWorkerHashrate>, {
    btcPrice: number | null
    isCommunityPool: boolean,
    userAddress: string,
    workers: CleanWorkerHashrate[],
    isHashrate1mVisible: boolean,
    isHashrate5mVisible: boolean,
    isHashrate1hrVisible: boolean,
    isHashrate1dVisible: boolean,
    isHashrate7dVisible: boolean,
}>(function MainGrid({
    btcPrice,
    isCommunityPool,
    userAddress,
    workers,
    isHashrate1mVisible,
    isHashrate5mVisible,
    isHashrate1hrVisible,
    isHashrate1dVisible,
    isHashrate7dVisible,
}, ref) {


    const { isDark } = useTheme();
    const [myTheme, setMyTheme] = useState(() =>
        themeQuartz.withPart(colorSchemeLight) // valeur par défaut (SSR)
    );

    // Nom du mineur dont le graphique est actuellement déplié sous sa ligne.
    const [expandedName, setExpandedName] = useState<string | null>(null);
    // Ligne à ramener en haut du viewport une fois le rowData mis à jour.
    const pendingScrollRef = useRef<string | null>(null);

    useEffect(() => {
        setMyTheme(themeQuartz.withPart(isDark ? colorSchemeDark : colorSchemeLight));
    }, [isDark]);

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

    // Injecte une ligne "détail" (graphique) juste après la ligne dépliée.
    const rowData = useMemo<GridRow[]>(() => {
        if (!expandedName) return workers;
        const index = workers.findIndex(w => w.workername === expandedName);
        if (index === -1) return workers;
        const worker = workers[index];
        const detail: DetailRow = {
            __detail: true,
            id: `detail::${worker.workername}`,
            workername: worker.workername,
            worker,
            userAddress,
            showWeight: isCommunityPool,
        };
        const rows: GridRow[] = [...workers];
        rows.splice(index + 1, 0, detail);
        return rows;
    }, [workers, expandedName, userAddress, isCommunityPool]);

    return (
        <div id="workers-grid" className="ag-theme-quartz" style={{ flex: 1, minHeight: 400 }}>
            <AgGridReact
                ref={ref}
                theme={myTheme}
                rowData={rowData as unknown as CleanWorkerHashrate[]}
                columnDefs={columns}
                defaultColDef={{
                    minWidth: 80,
                    resizable: true,
                    flex: 1
                }}
                suppressMovableColumns={true}
                localeText={AG_GRID_LOCALE_FR}
                animateRows
                getRowId={(params) => isDetailRow(params.data as GridRow) ? (params.data as unknown as DetailRow).id : params.data.workername} // persists selection
                suppressColumnMoveAnimation={false}
                cellSelection={false} // deprecated?
                suppressCellFocus={true}
                isFullWidthRow={(params) => isDetailRow(params.rowNode.data as GridRow)}
                fullWidthCellRenderer={DetailCellRenderer}
                getRowHeight={(params: RowHeightParams) => isDetailRow(params.data as GridRow) ? DETAIL_ROW_HEIGHT : undefined}
                postSortRows={(params: PostSortRowsParams) => {
                    // Garde la ligne détail collée sous sa ligne parente après un tri.
                    const nodes = params.nodes;
                    const detailIndex = nodes.findIndex(n => isDetailRow(n.data as GridRow));
                    if (detailIndex === -1) return;
                    const [detailNode] = nodes.splice(detailIndex, 1);
                    const parentName = (detailNode.data as unknown as DetailRow).workername;
                    const parentIndex = nodes.findIndex(n => !isDetailRow(n.data as GridRow) && (n.data as CleanWorkerHashrate).workername === parentName);
                    nodes.splice(parentIndex === -1 ? nodes.length : parentIndex + 1, 0, detailNode);
                }}
                onModelUpdated={(event: ModelUpdatedEvent) => {
                    const target = pendingScrollRef.current;
                    if (!target) return;
                    const node = event.api.getRowNode(target);
                    if (node?.rowIndex != null) {
                        event.api.ensureIndexVisible(node.rowIndex, 'top');
                        pendingScrollRef.current = null;
                    }
                }}
                rowSelection={{
                    mode: 'singleRow',
                    checkboxes: false
                }}
                onRowClicked={(event: RowClickedEvent) => {
                    const data = event.data as GridRow;
                    if (isDetailRow(data)) return; // clic sur le graphique lui-même
                    const name = (data as CleanWorkerHashrate).workername;
                    if (expandedName === name) {
                        // Re-clic sur la même ligne : on replie le graphique.
                        setExpandedName(null);
                        return;
                    }
                    event.api.deselectAll();
                    event.node.setSelected(true);
                    pendingScrollRef.current = name;
                    setExpandedName(name);
                }}
            />
        </div>
    );
});