const { TSUMOGIRI } = require("./constants");

/**
 * '2m' -> 12, '5z' -> 45, '0m' -> 51 (aka)
 * tenhou tile encoding:
 *   11-19 man, 21-29 pin, 31-39 sou, 41-47 honors, 51-53 aka
 */
function tm2t(str) {
    const num = parseInt(str[0]);
    const tcon = { m: 1, p: 2, s: 3, z: 4 };
    return num ? 10 * tcon[str[1]] + num : 50 + tcon[str[1]];
}

function deaka(til) {
    if (5 === ~~(til / 10))
        return 10 * (til % 10) + (~~(til / 10));
    return til;
}

function makeaka(til) {
    if (5 === (til % 10))
        return 10 * (til % 10) + (~~(til / 10));
    return til;
}

function tlround(tsumolossoff, x) {
    return tsumolossoff ? 100 * Math.ceil(x / 100) : 0;
}

function padRight(a, l, f) {
    while (a.length < l) a.push(f);
    return a;
}

function relativeseating(seat0, seat1) {
    return (seat0 - seat1 + 4 - 1) % 4;
}

module.exports = {
    tm2t,
    deaka,
    makeaka,
    tlround,
    padRight,
    relativeseating,
};
