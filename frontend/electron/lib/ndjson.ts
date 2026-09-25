export function lineBuffered(onLine: (line: string) => void) {
  let buffer = '';
  return (data: Buffer) => {
    buffer += data.toString('utf-8');
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      if (line.trim()) onLine(line);
    }
  };
}
