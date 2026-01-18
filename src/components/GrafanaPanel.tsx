interface GrafanaPanelProps {
  dashboardUid: string;
  panelId: number;
  panelId2?: String;
  height?: number;
}

const GrafanaPanel: React.FC<GrafanaPanelProps> = ({
  dashboardUid,
  panelId,
  panelId2,
  height = 600,
}) => {
  const src = `http://localhost:3000/d-solo/${dashboardUid}?panelId=${panelId}&orgId=1&theme=light`;

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
