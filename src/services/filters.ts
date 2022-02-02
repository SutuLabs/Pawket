export function demojo(mojo: null | number, unit = "XCH", decimal = 3, digits = 4) {
    if (!mojo) return "0.0 " + unit;
    return Number((mojo / Math.pow(10, decimal)).toFixed(digits)) + " " + unit;
}

export default { demojo };