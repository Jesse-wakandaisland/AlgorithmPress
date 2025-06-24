export interface DataColumn {
  id: string
  name: string
  type: "string" | "number" | "boolean" | "date" | "email" | "phone" | "address" | "custom"
  options?: any
}

export interface DataCategory {
  id: string
  name: string
  description: string
  columns: DataColumn[]
}

export interface DatasetConfig {
  type: "template" | "ai"
  categoryId: string
  rowCount: number
  columns: string[]
  aiPrompt?: string
}
