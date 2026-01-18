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
        grafanaPanelId: 1,  // ⚠️ Đã thêm dấu phẩy
        subChartPanelId: 2,
        subChartPanelId2: 3,
        subChartPanelId3: 4,
    },

];

const GrafanaDashboardPage = () => {
    const [activeTabId, setActiveTabId] = useState(PANELS[0].id);

    // Tìm panel hiện tại dựa trên activeTabId
    const currentPanel = PANELS.find(p => p.id === activeTabId);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
                📊 Carbon Credit Analytics
            </h2>

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
                    />
                )}
            </div>

            {currentPanel?.subChartPanelId && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.subChartPanelId}
                        height={400}
                    />
                </div>
            )}
            {currentPanel?.subChartPanelId2 && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.subChartPanelId2}
                        height={400}
                    />
                </div>
            )}
            {currentPanel?.subChartPanelId3 && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <GrafanaPanel
                        dashboardUid={currentPanel.uid}
                        panelId={currentPanel.subChartPanelId3}
                        height={400}
                    />
                </div>
            )}
            {/* 2. BẢNG DỮ LIỆU CHI TIẾT (TABLE) */}
            {/* ⚠️ Đã sửa logic đóng mở ngoặc ở đây */}
            {currentPanel?.tablePanelId && (
                <div className="bg-white rounded-xl border shadow p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">Dữ liệu chi tiết</h3>
                        <button
                            onClick={() =>
                                fetch("http://localhost:8081/api/grafana/export?dashboardUid=" +
                                    currentPanel.uid +
                                    "&panelId=" +
                                    currentPanel.tablePanelId
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
                    />
                </div>
            )} {/* ⚠️ Đóng ngoặc nhọn kết thúc điều kiện */}

        </div>
    );
};

export default GrafanaDashboardPage;