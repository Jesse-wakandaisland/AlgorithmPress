import { DataSetGenerator } from "@/components/data-set-generator";

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-2xl sm:text-4xl font-bold text-blue-600 mb-2 text-center">
        Gen8Data
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground sm:mb-8 text-center max-w-xl mx-auto">
        Create customized data sets for analysis, testing, or development.
        Choose from predefined templates or generate AI-powered custom data.
      </p>
      <DataSetGenerator />
    </main>
  );
}
