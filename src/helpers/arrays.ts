export function shuffleArray<T>(array: T[]): T[] {
    for (let k = array.length - 1; k > 0; k--) {
        const r = Math.floor(Math.random() * (k + 1));
        [array[k], array[r]] = [array[r], array[k]];
    }
    return array;
}