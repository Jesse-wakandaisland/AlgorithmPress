import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { DataColumn } from "@/types/dataset"

interface ColumnSelectorProps {
  columns: DataColumn[]
  selectedColumns: string[]
  onToggle: (columnId: string) => void
}

export function ColumnSelector({ columns, selectedColumns, onToggle }: ColumnSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Select Columns</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {columns.map((column) => (
          <div key={column.id} className="flex items-center space-x-2">
            <Checkbox
              id={`column-${column.id}`}
              checked={selectedColumns.includes(column.id)}
              onCheckedChange={() => onToggle(column.id)}
            />
            <Label
              htmlFor={`column-${column.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {column.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
