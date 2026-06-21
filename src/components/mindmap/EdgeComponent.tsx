import { memo } from 'react'
import { type EdgeProps, getBezierPath } from 'reactflow'

export default memo(function MindMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <path
      id={id}
      d={edgePath}
      stroke="#52525b"
      strokeWidth={2}
      fill="none"
    />
  )
})
