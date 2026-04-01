let defaultExporterPromise = null;

export async function getDefaultPdfExporter() {
  if (!defaultExporterPromise) {
    defaultExporterPromise = import('./htmlCanvasPdfExporter.js').then((module) => module.createHtmlCanvasPdfExporter());
  }

  return defaultExporterPromise;
}
