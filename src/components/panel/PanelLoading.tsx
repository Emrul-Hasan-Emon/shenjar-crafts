export default function PanelLoading() {
  return <div role="status" aria-label="Loading workspace" className="panel-loading"><span className="sr-only">Loading workspace…</span><div className="panel-skeleton h-8 w-48" /><div className="panel-skeleton mt-3 h-4 w-64" /><div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="panel-skeleton h-28" />)}</div><div className="panel-skeleton mt-6 h-64" /></div>;
}
