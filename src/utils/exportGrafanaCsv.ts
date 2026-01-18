export async function exportGrafanaPanelCSV(
  dashboardUid: string,
  panelId: number,
  filename: string
) {
  const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL;
  const TOKEN = import.meta.env.VITE_GRAFANA_TOKEN;

  const url = `${GRAFANA_URL}/api/dashboards/uid/${dashboardUid}`;

  // 1️⃣ Lấy dashboard JSON
  const dashboardRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  const dashboardData = await dashboardRes.json();

  // 2️⃣ Tìm panel theo id
  const panel = dashboardData.dashboard.panels.find(
    (p: any) => p.id === panelId
  );

  if (!panel) throw new Error("Panel not found");

  // 3️⃣ Gọi datasource query
  const queryRes = await fetch(`${GRAFANA_URL}/api/ds/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      queries: panel.targets,
      range: {
        from: "now-30d",
        to: "now",
      },
    }),
  });

  const result = await queryRes.json();

  // 4️⃣ Convert to CSV
  const rows = result.results[panel.targets[0].refId].frames[0].data.values;

  const headers = rows.map((_: any, i: number) => `col_${i}`);
  const csv =
    headers.join(",") +
    "\n" +
    rows[0].map((_: any, rowIndex: number) =>
      rows.map((col: any) => col[rowIndex]).join(",")
    ).join("\n");

  // 5️⃣ Download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
