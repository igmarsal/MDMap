import { memo } from 'react'
import { type EdgeProps, getBezierPath, getSmoothStepPath } from 'reactflow'
import type { LayoutMode } from '../../lib/types'

export default memo(function MindMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const layoutMode: LayoutMode = data?.layoutMode || 'horizontal'
  
  const useSmoothStep = layoutMode === 'horizontal' || layoutMode === 'vertical'
  
  const [edgePath] = useSmoothStep
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        borderRadius: 8,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      })

  return (
    <path
      id={id}
      d={edgePath}
      stroke="#71717a"
      strokeWidth={2}
      fill="none"
    />
  )
})
