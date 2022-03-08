export function demojo(mojo: null | number, unit = "XCH", decimal = 12, digits = 6): string {
    if (!mojo) return "0.0 " + unit;
    return Number((mojo / Math.pow(10, decimal)).toFixed(digits)) + " " + unit;
}

export default { demojo };