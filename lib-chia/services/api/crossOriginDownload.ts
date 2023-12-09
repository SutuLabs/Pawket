export async function crossOriginDownload(url: string, filename: string): Promise<void> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const burl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const body = document.querySelector("body");
  link.href = burl;
  link.download = filename;
  link.style.display = "none";
  body?.appendChild(link);
  link.click();
}
