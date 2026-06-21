import { useReactFlow } from 'reactflow'
import { Button } from '../ui/Button'

export default function ControlsToolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-card border border-border rounded-lg p-1 shadow-lg">
      <Button variant="ghost" size="sm" onClick={() => zoomIn()}>+</Button>
      <Button variant="ghost" size="sm" onClick={() => zoomOut()}>−</Button>
      <Button variant="ghost" size="sm" onClick={() => fitView()}>⊡</Button>
    </div>
  )
}
