import * as React from "react"

import { cn } from "@/lib/utils"


export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const InputNoStyles = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "break-words bg-transparent border-none outline-none focus:ring-0 focus:outline-none w-full p-0 m-0",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
InputNoStyles.displayName = "InputNoStyles"

export { InputNoStyles }