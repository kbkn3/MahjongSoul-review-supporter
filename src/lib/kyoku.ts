import { tm2t, deaka, makeaka, padRight, relativeseating } from "./tile";
import { RUNES, TSUMOGIRI } from "./constants";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface KyokuState {
    nplayers: number;
    round: number[];
    initscores: number[];
    doras: number[];
    draws: any[][];
    discards: any[][];
    haipais: number[][];
    poppedtile: number;
    dealerseat: number;
    ldseat: number;
    nriichi: number;
    nkan: number;
    nowinds: number[];
    nodrags: number[];
    paowind: number;
    paodrag: number;
}

export function createKyokuState(init: KyokuState): KyokuState {
    return { ...init };
}

export function initKyoku(leaf: any): KyokuState {
    const nplayers = leaf.scores.length;
    const initscores = leaf.scores;
    padRight(initscores, 4, 0);
    const doras = leaf.dora ? [tm2t(leaf.dora)] : leaf.doras.map((e: string) => tm2t(e));
    const draws: any[][] = [[], [], [], []];
    const discards: any[][] = [[], [], [], []];
    const haipais: number[][] = draws.map((_: any, i: number) => leaf["tiles" + i].map((f: string) => tm2t(f)));

    const poppedtile = haipais[leaf.ju].pop()!;
    draws[leaf.ju].push(poppedtile);

    return {
        nplayers,
        round: [4 * leaf.chang + leaf.ju, leaf.ben, leaf.liqibang],
        initscores,
        doras,
        draws,
        discards,
        haipais,
        poppedtile,
        dealerseat: leaf.ju,
        ldseat: -1,
        nriichi: 0,
        nkan: 0,
        nowinds: new Array(4).fill(0),
        nodrags: new Array(4).fill(0),
        paowind: -1,
        paodrag: -1,
    };
}

const WINDS = ["1z", "2z", "3z", "4z"].map(e => tm2t(e));
const DRAGS = ["5z", "6z", "7z", "0z"].map(e => tm2t(e));

export function countpao(tile: number, owner: number, feeder: number, kyoku: KyokuState): void {
    if (WINDS.includes(tile)) {
        if (4 == ++kyoku.nowinds[owner])
            kyoku.paowind = feeder;
    }
    else if (DRAGS.includes(tile)) {
        if (3 == ++kyoku.nodrags[owner])
            kyoku.paodrag = feeder;
    }
}

export function dumpKyoku(kyoku: KyokuState, uras: number[]): any[] {
    return [
        kyoku.round,
        kyoku.initscores,
        kyoku.doras,
        uras,
        ...kyoku.haipais.flatMap((haipai, i) => [haipai, kyoku.draws[i], kyoku.discards[i]]),
    ];
}

export function handleBaBei(event: { seat: number }, kyoku: KyokuState): void {
    kyoku.discards[event.seat].push("f44");
}

export function handleDealTile(event: { seat: number; tile: string; doras?: string[] }, kyoku: KyokuState): void {
    if (event.doras && event.doras.length > kyoku.doras.length)
        kyoku.doras = event.doras.map((f: string) => tm2t(f));
    kyoku.draws[event.seat].push(tm2t(event.tile));
}

export function handleDiscardTile(event: { seat: number; tile: string; moqie: boolean; is_liqi: boolean; doras?: string[] }, kyoku: KyokuState): void {
    let symbol: string | number = event.moqie ? TSUMOGIRI : tm2t(event.tile);

    if (event.seat == kyoku.dealerseat
        && !kyoku.discards[event.seat].length && symbol == kyoku.poppedtile)
        symbol = TSUMOGIRI;

    if (event.is_liqi) {
        kyoku.nriichi++;
        symbol = "r" + symbol;
    }
    kyoku.discards[event.seat].push(symbol);
    kyoku.ldseat = event.seat;

    if (event.doras && event.doras.length > kyoku.doras.length)
        kyoku.doras = event.doras.map((f: string) => tm2t(f));
}

export function handleChii(event: { seat: number; tiles: string[] }, kyoku: KyokuState): void {
    kyoku.draws[event.seat].push(
        "c" +
        tm2t(event.tiles[2]) +
        tm2t(event.tiles[0]) +
        tm2t(event.tiles[1])
    );
}

export function handlePon(event: { seat: number; tiles: string[] }, kyoku: KyokuState): void {
    const worktiles = event.tiles.map((f: string) => tm2t(f));
    const idx = relativeseating(event.seat, kyoku.ldseat);
    countpao(worktiles[0], event.seat, kyoku.ldseat, kyoku);
    const naki: (number | string)[] = worktiles;
    naki.splice(idx, 0, "p" + naki.pop());
    kyoku.draws[event.seat].push(naki.join(""));
}

export function handleDaiminkan(event: { seat: number; tiles: string[] }, kyoku: KyokuState): void {
    const calltiles = event.tiles.map((f: string) => tm2t(f));
    const idx = relativeseating(event.seat, kyoku.ldseat);
    countpao(calltiles[0], event.seat, kyoku.ldseat, kyoku);
    const naki: (number | string)[] = calltiles;
    naki.splice(2 == idx ? 3 : idx, 0, "m" + naki.pop());
    kyoku.draws[event.seat].push(naki.join(""));
    kyoku.discards[event.seat].push(0);
    kyoku.nkan++;
}

export function handleAnkan(event: { seat: number; tiles: string }, kyoku: KyokuState): void {
    let til: number = tm2t(event.tiles);
    kyoku.ldseat = event.seat;
    countpao(til, event.seat, -1, kyoku);
    const ankantiles = kyoku.haipais[event.seat].filter((t: number) => deaka(t) == deaka(til))
        .concat(kyoku.draws[event.seat].filter((t: number) => deaka(t) == deaka(til)));
    til = ankantiles.pop()!;
    kyoku.discards[event.seat].push(ankantiles.join("") + "a" + til);
    kyoku.nkan++;
}

export function handleShouminkan(event: { seat: number; tiles: string }, kyoku: KyokuState): void {
    const til: number = tm2t(event.tiles);
    kyoku.ldseat = event.seat;
    const nakis = kyoku.draws[event.seat].filter((w: any) => {
        if ('string' === typeof w)
            return w.includes("p" + deaka(til)) || w.includes("p" + makeaka(til));
        else
            return false;
    });
    kyoku.discards[event.seat].push(nakis[0].replace(/p/, "k" + til));
    kyoku.nkan++;
}

export function handleLiuJu(event: { type: number }, kyoku: KyokuState): any[] {
    const entry = dumpKyoku(kyoku, []);
    if (1 == event.type)
        entry.push([RUNES.kyuushukyuuhai]);
    else if (2 == event.type)
        entry.push([RUNES.suufonrenda]);
    else if (4 == kyoku.nriichi)
        entry.push([RUNES.suuchariichi]);
    else if (4 <= kyoku.nkan)
        entry.push([RUNES.suukaikan]);
    else
        entry.push([RUNES.sanchahou]);
    return entry;
}

export function handleNoTile(event: { scores: any[]; liujumanguan: boolean }, kyoku: KyokuState): any[] {
    const entry = dumpKyoku(kyoku, []);
    const delta = new Array(4).fill(0.);

    if (event.scores && event.scores[0] && event.scores[0].delta_scores && event.scores[0].delta_scores.length)
        event.scores.forEach((f: any) => f.delta_scores.forEach((g: number, i: number) => delta[i] += g));

    if (event.liujumanguan)
        entry.push([RUNES.nagashimangan, delta]);
    else
        entry.push([RUNES.ryuukyoku, delta]);
    return entry;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
