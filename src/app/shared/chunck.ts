export const chunck = (arr: string | any[], chunkSize: number) => {
    return Array(Math.ceil(arr.length / chunkSize)).fill(null).map(function (_, i) {
        return arr.slice(i * chunkSize, i * chunkSize + chunkSize);
    });
}