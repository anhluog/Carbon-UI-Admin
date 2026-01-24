interface GrafanaPanelProps {
  dashboardUid: string;
  panelId: number;
  panelId2?: String;
  /* Thời gian bắt đầu và kết thúc (Unix ms hoặc chuỗi như 'now-6h', 'now') */
  from?: string | number;
  to?: string | number;
  height?: number;
}

const GrafanaPanel: React.FC<GrafanaPanelProps> = ({
  dashboardUid,
  panelId,
  panelId2,
  from,
  to,
  height = 600,
}) => {
  let src = `http://localhost:3000/d-solo/${dashboardUid}?panelId=${panelId}&orgId=1&theme=light`;

  if (from) src += `&from=${from}`;
  if (to) src += `&to=${to}`;

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      frameBorder={0}
      loading="lazy"
    />
  );
};

export default GrafanaPanel;
