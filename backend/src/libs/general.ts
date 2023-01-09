export function batchArray(arr: any[], batchSize: number) {
  const result = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    const chunk = arr.slice(i, i + batchSize);
    result.push(chunk);
  }
  return result;
}

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
