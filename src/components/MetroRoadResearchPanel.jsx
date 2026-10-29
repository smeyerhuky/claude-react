import { useEffect, useRef, useState } from 'react'
import probeHtml from '../research/metro-census-probes.html?raw'
import comparisonHtml from '../research/denver-waypoint-comparison.html?raw'
import inventoryHtml from '../research/metro-competitor-inventory.html?raw'

const views = {
  probes: { title: 'Census road-node research experiment', html: probeHtml },
  denver: { title: 'Denver road-start sensitivity experiment', html: comparisonHtml },
  inventory: { title: 'Metro competitor investigation inventory', html: inventoryHtml },
}

export default function MetroRoadResearchPanel() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('probes')
  const dialog = useRef(null)
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal()
    if (!open && dialog.current.open) dialog.current.close()
  }, [open])
  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-3 right-3 z-50 rounded-lg border border-amber-700 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 shadow">
      Inspect road research (dev)
    </button>
    <dialog ref={dialog} onClose={() => setOpen(false)} aria-label="Metro road research inspector" className="w-[min(96vw,1200px)] max-h-[92dvh] max-w-none rounded-xl border-0 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
        <h2 className="font-bold">Road research inspector — development only</h2>
        <button type="button" onClick={() => dialog.current.close()} className="rounded border px-3 py-2">Close research inspector</button>
      </header>
      <div className="space-y-2 border-b p-3 text-sm">
        <p>Frozen experiments with unapproved road leads. These views do not follow the map’s population threshold, uploaded data or selected metro. They do not approve road regions or vehicle access.</p>
        <label className="flex flex-wrap items-center gap-2">Research experiment
          <select value={view} onChange={event => setView(event.target.value)} className="rounded border bg-white px-2 py-1">
            <option value="probes">Frozen 26-source Census probe experiment</option>
            <option value="denver">Denver through-road start sensitivity</option>
            <option value="inventory">All qualifying metros and missing competitors</option>
          </select>
        </label>
      </div>
      {open && <iframe title={views[view].title} sandbox="allow-scripts" srcDoc={views[view].html} className="block h-[70dvh] w-full border-0" />}
    </dialog>
  </>
}
