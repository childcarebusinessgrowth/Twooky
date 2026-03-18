'use client'

import * as React from 'react'
import { GripVerticalIcon } from 'lucide-react'
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from 'react-resizable-panels'

import { cn } from '@/lib/utils'

function ResizablePanelGroup({
  className,
  direction = 'horizontal',
  ...props
}: GroupProps & { direction?: 'horizontal' | 'vertical' }) {
  const orientation = direction
  return (
    <Group
      data-slot="resizable-panel-group"
      data-orientation={orientation}
      className={cn(
        'flex h-full w-full',
        orientation === 'vertical' && 'flex-col',
        className,
      )}
      orientation={orientation}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: PanelProps) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden [.flex-col_&]:h-px [.flex-col_&]:w-full [.flex-col_&]:after:left-0 [.flex-col_&]:after:h-1 [.flex-col_&]:after:w-full [.flex-col_&]:after:translate-x-0 [.flex-col_&]:after:-translate-y-1/2 [.flex-col_&]:[&>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
