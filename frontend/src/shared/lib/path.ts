export function getExtension(filePath: string): string {
  const match = /\.([^./\\]+)$/.exec(filePath);
  return match ? match[1].toLowerCase() : '';
}
