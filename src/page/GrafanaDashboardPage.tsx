import { useState } from "react";
import GrafanaPanel from "../components/GrafanaPanel";
import { exportGrafanaPanelCSV } from "../utils/exportGrafanaCsv";


// UID của các Dashboard
const DASHBOARD_TYPE_PROJECT = "fec970ce-ff5d-459b-81ff-93eff0dbca15";
const DASHBOARD_CREDITS_UID = "d1d78f4a-8bab-4d05-a4ad-44c71b6a14a3";
const DASHBOARD_BUY_SELL = "b79b4029-d444-4c3c-a01a-798c4a38c755";
const DASHBOARD_ISSUED_RETIRED = "b0e4afb1-68e2-4072-ad01-46821e03ce76";

const PANELS = [
    {
        id: 1,
        name: "📦 Projects",
        uid: DASHBOARD_TYPE_PROJECT,
        grafanaPanelId: 1,  // ⚠️ Đã thêm dấu phẩy ở đây
        subChartPanelId: 3,
        subChartPanelId2: 4,
        tablePanelId: 2,    // ID của bảng trong dashboard này

    },
    {
        id: 2,
        name: "📈 Credits",
        uid: DASHBOARD_CREDITS_UID,
        grafanaPanelId: 1,  // ⚠️ Đã thêm dấu phẩy
        subChartPanelId: 2,
        subChartPanelId2: 3,
        subChartPanelId3: 4,
        // (Lưu ý: Bạn phải check xem dashboard này bảng có ID là 15 thật không nhé)
    },
    {
        id: 3,
        name: "💰 Trades",
        uid: DASHBOARD_BUY_SELL,
        grafanaPanelId: 1,  // ⚠️ Đã thêm dấu phẩy
        subChartPanelId: 2,
        subChartPanelId2: 3,
        subChartPanelId3: 4,
    },
    {
        id: 4,
        name: "👤 OrderBook",
        uid: DASHBOARD_ISSUED_RETIRED,
        grafanaPanelId: 3,  // ⚠️ Đã thêm dấu phẩy
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
        { label: "Last 1h", from: "now-1h", to: "now" },
        { label: "Last 6h", from: "now-6h", to: "now" },
        { label: "Last 12h", from: "now-12h", to: "now" },
        { label: "Last 24h", from: "now-24h", to: "now" },
        { label: "Last 7d", from: "now-7d", to: "now" },
        { label: "Last 30d", from: "now-30d", to: "now" },
    ];

    // Tìm panel hiện tại dựa trên activeTabId
    const currentPanel = PANELS.find(p => p.id === activeTabId);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    📊 Carbon Credit Analytics
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
                            ⬇ Export CSV
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