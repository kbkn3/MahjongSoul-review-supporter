/**
 * '2m' -> 12, '5z' -> 45, '0m' -> 51 (aka)
 * tenhou tile encoding:
 *   11-19 man, 21-29 pin, 31-39 sou, 41-47 honors, 51-53 aka
 */

type SuitChar = 'm' | 'p' | 's' | 'z';

const SUIT_CODE: Record<SuitChar, number> = { m: 1, p: 2, s: 3, z: 4 };

function tm2t(str: string): number {
    const num = parseInt(str[0]);
    return num ? 10 * SUIT_CODE[str[1] as SuitChar] + num : 50 + SUIT_CODE[str[1] as SuitChar];
}

function deaka(til: number): number {
    if (5 === ~~(til / 10))
        return 10 * (til % 10) + (~~(til / 10));
    return til;
}

function makeaka(til: number): number {
    const suit = ~~(til / 10);
    if (5 === (til % 10) && suit >= 1 && suit <= 3)
        return 50 + suit;
    return til;
}

function tlround(tsumolossoff: boolean, x: number): number {
    return tsumolossoff ? 100 * Math.ceil(x / 100) : 0;
}

/** @mutates a - pushes f until a.length reaches l */
function padRight<T>(a: T[], l: number, f: T): T[] {
    while (a.length < l) a.push(f);
    return a;
}

function relativeseating(seat0: number, seat1: number): number {
    return (seat0 - seat1 + 4 - 1) % 4;
}

export {
    tm2t,
    deaka,
    makeaka,
    tlround,
    padRight,
    relativeseating,
};
