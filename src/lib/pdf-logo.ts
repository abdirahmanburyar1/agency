/**
 * Load the app logo as a data URL for use in jsPDF.
 * Must be called in the browser (client component).
 * @param logoUrl - Logo URL (default: /logo.png)
 */
export function getLogoDataUrl(logoUrl: string = "/logo.png"): Promise<string> {
  return fetch(logoUrl)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}
