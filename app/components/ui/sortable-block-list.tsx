"use client"

import * as React from "react"
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { GripVertical } from "lucide-react"

export interface SortableBlockListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T) => React.ReactNode
  /** Optional class for the list container */
  className?: string
  /** Optional class for each sortable row */
  itemClassName?: string
  /** Whether to hide the drag handle */
  hideHandle?: boolean
}

function SortableRow<T extends { id: string }>({
  item,
  renderItem,
  itemClassName,
  hideHandle,
}: {
  item: T
  renderItem: (item: T) => React.ReactNode
  itemClassName?: string
  hideHandle?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: hideHandle,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 transition-all duration-300",
        !hideHandle && "gap-2",
        isDragging && "opacity-80 shadow-lg z-10",
        itemClassName
      )}
    >
      {!hideHandle && (
        <div
          className="flex items-center justify-center shrink-0 w-10 cursor-grab active:cursor-grabbing text-brand-deep/40 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg pointer-events-none">
            <GripVertical className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className={cn("flex-1 min-w-0 py-3", !hideHandle && "pr-3")}>{renderItem(item)}</div>
    </div>
  )
}

export function SortableBlockList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  hideHandle,
}: SortableBlockListProps<T> & { hideHandle?: boolean }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const ids = items.map((i) => i.id)
        const oldIndex = ids.indexOf(active.id as string)
        const newIndex = ids.indexOf(over.id as string)
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(items, oldIndex, newIndex)
          onReorder(reordered)
        }
      }
    },
    [items, onReorder]
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-3", className)}>
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              renderItem={renderItem}
              itemClassName={itemClassName}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
