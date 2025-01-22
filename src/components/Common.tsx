import type { ComponentProps } from '../types'

const Component = ({ children, ...props }: ComponentProps) => {
  return (
    <div {...props}>
      {children}
    </div>
  )
}

export default Component 