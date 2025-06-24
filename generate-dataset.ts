"use server"

import type { DatasetConfig } from "@/types/dataset"
import { dataCategories } from "@/lib/data-categories"
import { generateTemplateData } from "@/lib/template-generator"
import { generateAiData } from "@/lib/ai-generator"

export async function generateDataset(config: DatasetConfig) {
  try {
    if (config.type === "template") {
      const category = dataCategories.find((cat) => cat.id === config.categoryId)
      if (!category) {
        throw new Error("Invalid category")
      }

      const selectedColumns = category.columns.filter((col) => config.columns.includes(col.id))

      return generateTemplateData(selectedColumns, config.rowCount)
    } else if (config.type === "ai") {
      if (!config.aiPrompt) {
        throw new Error("AI prompt is required")
      }

      return generateAiData(config.aiPrompt, config.rowCount)
    }

    throw new Error("Invalid dataset type")
  } catch (error) {
    console.error("Error generating dataset:", error)
    throw error
  }
}
