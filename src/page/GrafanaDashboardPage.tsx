import { useState } from "react";
import GrafanaPanel from "../components/GrafanaPanel";
import { exportGrafanaPanelCSV } from "../utils/exportGrafanaCsv";


// UID của các Dashboard
const DASHBOARD_TYPE_PROJECT = "c57ca550-c215-42a7-abf4-34b2d82e1b9b";
const DASHBOARD_CREDITS_UID = "b60bcaa1-9cdf-4f5f-98e6-20b25da881d4";
const DASHBOARD_BUY_SELL = "a8931dcd-18cb-4e26-b8e7-a2b603b521da";
const DASHBOARD_ISSUED_RETIRED = "e56df18b-b739-4d94-8587-791e0f87a5c8";

const PANELS = [
    {
        id: 1,
        name: "Dự án",
        uid: DASHBOARD_TYPE_PROJECT,
        grafanaPanelId: 1,  
        subChartPanelId: 3,
        subChartPanelId2: 4,
        tablePanelId: 2,   

    },
    {
        id: 2,
        name: "Tín chỉ Carbon ",
        uid: DASHBOARD_CREDITS_UID,
        grafanaPanelId: 1, 
        subChartPanelId: 2,
        subChartPanelId2: 3,
        subChartPanelId3: 4,
    },
    {
        id: 3,
        name: "Giao dịch",
        uid: DASHBOARD_BUY_SELL,
        grafanaPanelId: 1,  
        subChartPanelId: 2,
        subChartPanelId2: 3,
        subChartPanelId3: 4,
    },
    {
        id: 4,
        name: "Số lệnh",
        uid: DASHBOARD_ISSUED_RETIRED,
        grafanaPanelId: 3, 
        subChartPanelId: 4,
        subChartPanelId2: 1,
        subChartPanelId3: 2,
    },

];

const GrafanaDashboardPage = () => {
    const [activeTabId, setActiveTabId] = useState(PANELS[0].id);
    const [timeRange, setTimeRange] = useState({
        label: "Last 24h",
        from: "now-24h",
        to: "now"
    });

    // Các mốc thời gian
    const TIME_RANGES = [
        { label: "1 giờ", from: "now-1h", to: "now" },
        { label: "6 giờ", from: "now-6h", to: "now" },
        { label: "12 giờ", from: "now-12h", to: "now" },
        { label: "24 giờ", from: "now-24h", to: "now" },
        { label: "7 ngày", from: "now-7d", to: "now" },
        { label: "30 ngày", from: "now-30d", to: "now" },
    ];

    // Tìm panel hiện tại dựa trên activeTabId
    const currentPanel = PANELS.find(p => p.id === activeTabId);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    Báo cáo Hệ thống
                </h2>

                {/* Time Filter */}
                <div className="bg-white rounded-lg shadow border p-1 flex items-center gap-1 overflow-x-auto">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.label}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                                ${timeRange.label === range.label
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "text-gray-600 hover:bg-gray-100"
                                }
                            `}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Panel selector */}
            <div className="flex flex-wrap gap-3">
                {PANELS.map((panel) => (
                    <button
                        key={panel.id}
                        onClick={() => setActiveTabId(panel.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition
                            ${activeTabId === panel.id
                                ? "bg-green-600 text-white shadow"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }
                        `}
                    >
                        {panel.name}
                    </button>
                ))}
            </div>

            {/* 1. BIỂU ĐỒ CHÍNH (CHART) */}
            <div className="bg-white rounded-xl border shadow p-4">
                {currentPanel && (
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.grafanaPanelId}
                        height={600}
                        from={timeRange.from}
                        to={timeRange.to}
                    />
                )}
            </div>

            {currentPanel?.subChartPanelId && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.subChartPanelId}
                        height={400}
                        from={timeRange.from}
                        to={timeRange.to}
                    />
                </div>
            )}
            {currentPanel?.subChartPanelId2 && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.subChartPanelId2}
                        height={400}
                        from={timeRange.from}
                        to={timeRange.to}
                    />
                </div>
            )}
            {currentPanel?.subChartPanelId3 && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.subChartPanelId3}
                        height={400}
                        from={timeRange.from}
                        to={timeRange.to}
                    />
                </div>
            )}
            {/* 2. BẢNG DỮ LIỆU CHI TIẾT (TABLE) */}
            {currentPanel?.tablePanelId && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">Dữ liệu chi tiết</h3>
                        <button
                            onClick={() =>
                                fetch("http://localhost:80/api/grafana/export?dashboardUid=" +
                                    currentPanel.uid +
                                    "&panelId=" +
                                    currentPanel.tablePanelId +
                                    "&from=" + timeRange.from +
                                    "&to=" + timeRange.to
                                )
                                    .then(res => res.blob())
                                    .then(blob => {
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = "carbon-report.csv";
                                        a.click();
                                    })
                            }
                        >
                            Tạo file CSV
                        </button>
                    </div>

                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.tablePanelId}
                        height={400}
                        from={timeRange.from}
                        to={timeRange.to}
                    />
                </div>
            )}

        </div>
    );
};

export default GrafanaDashboardPage;