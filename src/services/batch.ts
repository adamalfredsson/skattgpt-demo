export async function processInBatches<T, R>(
  data: T[],
  options: { batchSize: number; delay?: number },
  processFn: (batch: T[], meta: { start: number; end: number }) => Promise<R>
) {
  const results: R[] = [];
  for (let i = 0; i < data.length; i += options.batchSize) {
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
    const end = Math.min(i + options.batchSize, data.length);
    const batch = data.slice(i, i + options.batchSize);
    const result = await processFn(batch, { start: i, end });
    results.push(result);
  }
  return results.flat();
}
