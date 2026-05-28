    import { tm2t, padRight as pad_right, tlround as tlroundPure } from "../lib/tile";
    import { JPNAME, RUNES, DAISANGEN, DAISUUSHI } from "../lib/constants";
    import { cfgTables, type CfgTables } from "../lib/cfg";
    import type { DecodedRecord } from "../lib/record-decode";
    import {
        KyokuState,
        initKyoku as initKyokuPure,
        dumpKyoku,
        handleBaBei,
        handleDealTile,
        handleDiscardTile,
        handleChii,
        handlePon,
        handleDaiminkan,
        handleAnkan,
        handleShouminkan,
        handleLiuJu,
        handleNoTile,
    } from "../lib/kyoku";

    const NAMEPREF = 0;     //2 for english, 1 for sane amount of weeb, 0 for japanese
    const VERBOSELOG = false; //dump mjs records to output - will make the file too large for tenhou.net/5 viewer
    const SHOWFU = false; //always show fu/han for scoring - even for limit hands
    const RIICHI_STICK_POINTS = 1000;
    const HONBA_PAYMENT_UNIT = 100;
    const TSUMO_LOSS_BISECTION = 1 / 2;

    //global variables - don't touch
    let ALLOW_KIRIAGE = false; //potentially allow this to be true
    let TSUMOLOSSOFF = false; //sanma tsumo loss, is set true for sanma when tsumo loss off

    const tlround = (x: number) => tlroundPure(TSUMOLOSSOFF, x);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let kyoku: KyokuState = {} as KyokuState;

    //yakuman scoring table: [oya_pays, ko_pays, ron_pays]
    const OYA = 0;
    const KO = 1;
    const RON = 2;
    const YSCORE = [
        [0, 16000, 48000], //oya wins
        [16000, 8000, 32000]  //ko wins
    ];

    function detectPaoLiability(h: any, k: KyokuState): { pao: boolean; liableseat: number; liablefor: number } {
        let pao = false;
        let liableseat = -1;
        let liablefor = 0;
        if (h.yiman) {
            h.fans.forEach((e: any) => {
                if (DAISUUSHI == e.id && (-1 != k.paowind)) {
                    pao = true;
                    liableseat = k.paowind;
                    liablefor += e.val;
                }
                else if (DAISANGEN == e.id && (-1 != k.paodrag)) {
                    pao = true;
                    liableseat = k.paodrag;
                    liablefor += e.val;
                }
            });
        }
        return { pao, liableseat, liablefor };
    }

    function calculateBaseDelta(h: any, k: KyokuState, rp: number, hb: number): { delta: number[]; points: string | number } {
        if (h.zimo) {
            const delta = new Array(k.nplayers).fill(-hb - h.point_zimo_xian - tlround(TSUMO_LOSS_BISECTION * (h.point_zimo_xian)));
            let points: string | number;
            if (h.seat == k.dealerseat) {
                delta[h.seat] = rp + (k.nplayers - 1) * (hb + h.point_zimo_xian) + 2 * tlround(TSUMO_LOSS_BISECTION * (h.point_zimo_xian));
                points = h.point_zimo_xian + tlround(TSUMO_LOSS_BISECTION * (h.point_zimo_xian));
            }
            else {
                delta[h.seat] = rp + hb + h.point_zimo_qin + (k.nplayers - 2) * (hb + h.point_zimo_xian) + 2 * tlround(TSUMO_LOSS_BISECTION * (h.point_zimo_xian));
                delta[k.dealerseat] = -hb - h.point_zimo_qin - tlround(TSUMO_LOSS_BISECTION * (h.point_zimo_xian));
                points = h.point_zimo_xian + "-" + h.point_zimo_qin;
            }
            return { delta, points };
        }
        const delta = new Array(k.nplayers).fill(0.);
        delta[h.seat] = rp + (k.nplayers - 1) * hb + h.point_rong;
        delta[k.ldseat] = -(k.nplayers - 1) * hb - h.point_rong;
        k.nriichi = -1; //mark the sticks as taken, in case of double ron
        return { delta, points: h.point_rong };
    }

    function applyPaoPayments(delta: number[], h: any, k: KyokuState, liableseat: number, liablefor: number, hb: number): void {
        if (h.zimo) {
            if (h.qinjia) {
                //should treat tsumo loss as ron, luckily all yakuman values round safely for north bisection
                delta[liableseat] -= 2 * hb + liablefor * 2 * YSCORE[OYA][KO] + tlround(TSUMO_LOSS_BISECTION * liablefor * YSCORE[OYA][KO]);
                delta.forEach((_e, i) => {
                    if (liableseat != i && h.seat != i)
                        delta[i] += hb + liablefor * YSCORE[OYA][KO] + tlround(TSUMO_LOSS_BISECTION * liablefor * (YSCORE[OYA][KO]));
                });
                if (3 == k.nplayers)
                    delta[h.seat] += (TSUMOLOSSOFF ? 0 : liablefor * YSCORE[OYA][KO]);
            }
            else {
                delta[liableseat] -= (k.nplayers - 2) * hb + liablefor * (YSCORE[KO][OYA] + YSCORE[KO][KO]) + tlround(TSUMO_LOSS_BISECTION * liablefor * YSCORE[KO][KO]);
                delta.forEach((_e, i) => {
                    if (liableseat != i && h.seat != i) {
                        if (k.dealerseat == i)
                            delta[i] += hb + liablefor * YSCORE[KO][OYA] + tlround(TSUMO_LOSS_BISECTION * liablefor * YSCORE[KO][KO]);
                        else
                            delta[i] += hb + liablefor * YSCORE[KO][KO] + tlround(TSUMO_LOSS_BISECTION * liablefor * YSCORE[KO][KO]);
                    }
                });
            }
        }
        else {
            delta[liableseat] -= (k.nplayers - 1) * hb + TSUMO_LOSS_BISECTION * liablefor * YSCORE[h.qinjia ? OYA : KO][RON];
            delta[k.ldseat] += (k.nplayers - 1) * hb + TSUMO_LOSS_BISECTION * liablefor * YSCORE[h.qinjia ? OYA : KO][RON];
        }
    }

    function formatScoreLabel(h: any, points: string | number): string {
        const label = points + RUNES.points[JPNAME] + ((h.zimo && h.qinjia) ? RUNES.all[NAMEPREF] : "");
        const fuhan = h.fu + RUNES.fu[JPNAME] + h.count + RUNES.han[JPNAME];
        if (h.yiman)
            return (SHOWFU ? fuhan : "") + RUNES.yakuman[JPNAME] + label;
        if (13 <= h.count)
            return (SHOWFU ? fuhan : "") + RUNES.kazoeyakuman[JPNAME] + label;
        if (11 <= h.count)
            return (SHOWFU ? fuhan : "") + RUNES.sanbaiman[JPNAME] + label;
        if (8 <= h.count)
            return (SHOWFU ? fuhan : "") + RUNES.baiman[JPNAME] + label;
        if (6 <= h.count)
            return (SHOWFU ? fuhan : "") + RUNES.haneman[JPNAME] + label;
        if (5 <= h.count || (4 <= h.count && 40 <= h.fu) || (3 <= h.count && 70 <= h.fu))
            return (SHOWFU ? fuhan : "") + RUNES.mangan[JPNAME] + label;
        if (ALLOW_KIRIAGE && ((4 == h.count && 30 == h.fu) || (3 == h.count && 60 == h.fu)))
            return (SHOWFU ? fuhan : "") + RUNES.kiriagemangan[JPNAME] + label;
        return fuhan + label;
    }

    //parse mjs hule into tenhou agari list
    function parsehule(h: any, k: KyokuState, cfg: CfgTables) {   //tenhou log viewer requires 点, 飜) or 役満) to end strings, rest of scoring string is entirely optional
        const res: any[] = [h.seat, h.zimo ? h.seat : k.ldseat, h.seat];
        const rp = (-1 != k.nriichi) ? RIICHI_STICK_POINTS * (k.nriichi + k.round[2]) : 0;
        const hb = HONBA_PAYMENT_UNIT * k.round[1];

        const { pao, liableseat, liablefor } = detectPaoLiability(h, k);
        const { delta, points } = calculateBaseDelta(h, k, rp, hb);

        if (pao) {
            res[2] = liableseat;
            applyPaoPayments(delta, h, k, liableseat, liablefor, hb);
        }

        res.push(formatScoreLabel(h, points));

        h.fans.forEach((e: any) => res.push(
            (JPNAME == NAMEPREF ? cfg.fan[String(e.id)].name_jp : cfg.fan[String(e.id)].name_en)
            + "(" + (h.yiman ? (RUNES.yakuman[JPNAME]) : (e.val + RUNES.han[JPNAME])) + ")"
        ));

        return [pad_right(delta, 4, 0.), res];
    }

    //convert mjs records to tenhou log
    function generatelog(actions: { name: string; data: any }[], cfg: CfgTables): any[] {
        const log: any[] = [];
        actions.forEach((action, leafidx) => {
            const e = action.data;
            switch (action.name) {
                case "RecordNewRound":
                    kyoku = initKyokuPure(e);
                    return;
                case "RecordDiscardTile":
                    handleDiscardTile(e, kyoku);
                    return;
                case "RecordDealTile":
                    handleDealTile(e, kyoku);
                    return;
                case "RecordChiPengGang":
                    switch (e.type) {
                        case 0: handleChii(e, kyoku); return;
                        case 1: handlePon(e, kyoku); return;
                        case 2: handleDaiminkan(e, kyoku); return;
                        default:
                            console.log("didn't know what to do with " + action.name + "(" + leafidx + ")");
                            return;
                    }
                case "RecordAnGangAddGang":
                    switch (e.type) {
                        case 3: handleAnkan(e, kyoku); return;
                        case 2: handleShouminkan(e, kyoku); return;
                        default:
                            console.log("didn't know what to do with " + action.name + " type: " + e.type);
                            return;
                    }
                case "RecordBaBei":
                    handleBaBei(e, kyoku);
                    return;
                case "RecordLiuJu":
                    log.push(handleLiuJu(e, kyoku));
                    return;
                case "RecordNoTile":
                    log.push(handleNoTile(e, kyoku));
                    return;
                case "RecordHule":
                    {
                        const agari: any[] = [];
                        let ura: number[] = [];
                        e.hules.forEach((f: any) => {
                            if (ura.length < (f.li_doras ? f.li_doras.length : 0))
                                ura = f.li_doras.map((g: string) => tm2t(g));
                            agari.push(parsehule(f, kyoku, cfg));
                        });
                        const entry = dumpKyoku(kyoku, ura);
                        entry.push([RUNES.agari[JPNAME]].concat(agari.flat()));
                        log.push(entry);
                        return;
                    }
                default:
                    console.log("didn't know what to do with " + action.name + "(" + leafidx + ")");
                    return;
            }
        });

        return log;
    }

    interface TenhouResult {
        [key: string]: any;
    }

    function buildRuleDisplay(record: any, nplayers: number, cfg: CfgTables): { ruledisp: string; lobby: string; nakas: number } {
        let ruledisp = "";
        let lobby = "";
        let nakas = nplayers - 1;

        if (3 == nplayers && JPNAME == NAMEPREF)
            ruledisp += RUNES.sanma[JPNAME];
        if (record.head.config.meta.mode_id)
            ruledisp += (JPNAME == NAMEPREF) ?
                cfg.matchmode[String(record.head.config.meta.mode_id)].room_name_jp
                : cfg.matchmode[String(record.head.config.meta.mode_id)].room_name_en;
        else if (record.head.config.meta.room_id) {
            lobby = ": " + record.head.config.meta.room_id;
            ruledisp += RUNES.friendly[NAMEPREF];
            nakas = record.head.config.mode.detail_rule.dora_count;
            TSUMOLOSSOFF = (3 == nplayers) ? !record.head.config.mode.detail_rule.have_zimosun : false;
        }
        else if (record.head.config.meta.contest_uid) {
            lobby = ": " + record.head.config.meta.contest_uid;
            ruledisp += RUNES.tournament[NAMEPREF];
            nakas = record.head.config.mode.detail_rule.dora_count;
            TSUMOLOSSOFF = (3 == nplayers) ? !record.head.config.mode.detail_rule.have_zimosun : false;
        }
        if (1 == record.head.config.mode.mode)
            ruledisp += RUNES.tonpuu[NAMEPREF];
        else if (2 == record.head.config.mode.mode)
            ruledisp += RUNES.hanchan[NAMEPREF];

        return { ruledisp, lobby, nakas };
    }

    function buildRuleConfig(ruledisp: string, record: any, nakas: number, nplayers: number): { disp: string; aka53: number; aka52: number; aka51: number } {
        if (!record.head.config.meta.mode_id && !record.head.config.mode.detail_rule.dora_count) {
            if (JPNAME != NAMEPREF)
                ruledisp += RUNES.nored[NAMEPREF];
            return { "disp": ruledisp, "aka53": 0, "aka52": 0, "aka51": 0 };
        }
        if (JPNAME == NAMEPREF)
            ruledisp += RUNES.red[JPNAME];
        return { "disp": ruledisp, "aka53": 1, "aka52": (4 == nakas ? 2 : 1), "aka51": (4 == nplayers ? 1 : 0) };
    }

    function buildPlayerData(record: any, nplayers: number, cfg: CfgTables): { dan: string[]; rate: string[]; sx: string[]; name: string[] } {
        const dan = new Array(4).fill('');
        const rate = new Array(4).fill('');
        const sx = new Array(4).fill('C');
        const name = new Array(4).fill('AI');

        record.head.accounts.forEach((e: any) => {
            dan[e.seat] = (JPNAME == NAMEPREF) ?
                cfg.level[String(e.level.id)].full_name_jp
                : cfg.level[String(e.level.id)].full_name_en;
            rate[e.seat] = e.level.score;
            const sexCode = cfg.character[String(e.character.charid)].sex;
            sx[e.seat] = (1 == sexCode) ? "F" : (2 == sexCode ? "M" : "C");
            name[e.seat] = e.nickname;
        });

        if (3 == nplayers) {
            name[3] = "";
            sx[3] = "";
        }

        return { dan, rate, sx, name };
    }

    //this is the json struct that we write to file
    function parse(record: DecodedRecord, cfg: CfgTables = cfgTables()): TenhouResult {
        TSUMOLOSSOFF = false;
        const nplayers = record.head.result.players.length;

        const { ruledisp, lobby, nakas } = buildRuleDisplay(record, nplayers, cfg);
        const rule = buildRuleConfig(ruledisp, record, nakas, nplayers);
        const players = buildPlayerData(record, nplayers, cfg);

        const scores = record.head.result.players
            .map((e: any) => [e.seat, e.part_point_1, e.total_point / 1000]);
        const sc = new Array(8).fill(0);
        scores.forEach((e: any) => { sc[2 * e[0]] = e[1]; sc[2 * e[0] + 1] = e[2]; });

        const res: TenhouResult = {
            ver: "2.3",
            ref: record.head.uuid,
            log: generatelog(record.actions, cfg),
            ratingc: "PF" + nplayers,
            rule,
            lobby: 0,
            dan: players.dan,
            rate: players.rate,
            sx: players.sx,
            name: players.name,
            sc,
            title: [
                rule.disp + lobby,
                (new Date(record.head.end_time * 1000)).toLocaleString()
            ],
        };

        if (VERBOSELOG) {
            res["mjshead"] = record.head;
            res["mjslog"] = record.actions.map(action => action.data);
            res["mjsrecordtypes"] = record.actions.map(action => action.name);
        }

        return res;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    export { parse };
