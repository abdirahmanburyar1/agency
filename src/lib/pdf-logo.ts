/**
 * Load the app logo from /logo.png as a data URL for use in jsPDF.
 * Must be called in the browser (client component).
 */
export function getLogoDataUrl(): Promise<string> {
  return fetch("/logo.png")
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
