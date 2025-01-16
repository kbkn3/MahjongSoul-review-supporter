import type { TabProps } from '../types'

interface PanelProps extends TabProps {
  className?: string
}

const Panel = ({ displayLang, className }: PanelProps) => {
  return (
    <div className={className}>
      {/* パネルの内容 */}
      <div>{`Current Language: ${displayLang}`}</div>
    </div>
  )
}

export default Panel 