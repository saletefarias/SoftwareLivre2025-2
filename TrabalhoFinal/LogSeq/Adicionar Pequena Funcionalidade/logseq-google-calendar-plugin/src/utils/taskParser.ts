export function parseTaskFromBlock(blockText: string) {
  // Naive parser to extract task title and time if present
  const timeMatch = blockText.match(/(\d{2}:\d{2})/);
  return {
    title: blockText.replace(/^-\s+/, "").trim(),
    time: timeMatch ? timeMatch[0] : null,
  };
}
