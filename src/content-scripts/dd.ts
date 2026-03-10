    import { tm2t, padRight as pad_right, tlround as tlroundPure } from "../lib/tile";
    import { JPNAME, RUNES, DAISANGEN, DAISUUSHI } from "../lib/constants";
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

    //global variables - don't touch
    let ALLOW_KIRIAGE = false; //potentially allow this to be true
    let TSUMOLOSSOFF = false; //sanma tsumo loss, is set true for sanma when tsumo loss off

    const tlround = (x: number) => tlroundPure(TSUMOLOSSOFF, x);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let kyoku: KyokuState = {} as KyokuState;

    //parse mjs hule into tenhou agari list
    function parsehule(h: any, k: KyokuState) {   //tenhou log viewer requires 点, 飜) or 役満) to end strings, rest of scoring string is entirely optional
        //who won, points from (self if tsumo), who won or if pao: who's responsible
        const res: any[] = [h.seat, h.zimo ? h.seat : k.ldseat, h.seat];
        let delta: number[] = []; //we need to compute the delta ourselves to handle double/triple ron
        let points: string | number = 0;
        const rp = (-1 != k.nriichi) ? 1000 * (k.nriichi + k.round[2]) : 0; //riichi stick points, -1 means already taken
        const hb = 100 * k.round[1]; //base honba payment

        //sekinin barai logic
        let pao = false;
        let liableseat = -1;
        let liablefor = 0;

        if (h.yiman) {   //only worth checking yakuman hands
            h.fans.forEach((e: any) => {
                if (DAISUUSHI == e.id && (-1 != k.paowind)) {   //daisuushi pao
                    pao = true;
                    liableseat = k.paowind;
                    liablefor += e.val; //realistically can only be liable once
                }
                else if (DAISANGEN == e.id && (-1 != k.paodrag)) {
                    pao = true;
                    liableseat = k.paodrag;
                    liablefor += e.val;
                }
            });
        }

        if (h.zimo) {   //ko-oya payment for non-dealer tsumo
            //delta  = [...new Array(k.nplayers)].map(()=> (-hb - h.point_zimo_xian));
            delta = new Array(k.nplayers).fill(-hb - h.point_zimo_xian - tlround((1 / 2) * (h.point_zimo_xian)))
            if (h.seat == k.dealerseat) //oya tsumo
            {
                delta[h.seat] = rp + (k.nplayers - 1) * (hb + h.point_zimo_xian) + 2 * tlround((1 / 2) * (h.point_zimo_xian));
                points = h.point_zimo_xian + tlround((1 / 2) * (h.point_zimo_xian));
            }
            else  //ko tsumo
            {
                delta[h.seat] = rp + hb + h.point_zimo_qin + (k.nplayers - 2) * (hb + h.point_zimo_xian) + 2 * tlround((1 / 2) * (h.point_zimo_xian));
                delta[k.dealerseat] = -hb - h.point_zimo_qin - tlround((1 / 2) * (h.point_zimo_xian));
                points = h.point_zimo_xian + "-" + h.point_zimo_qin;
            }
        }
        else {   //ron
            delta = new Array(k.nplayers).fill(0.)
            delta[h.seat] = rp + (k.nplayers - 1) * hb + h.point_rong;
            delta[k.ldseat] = -(k.nplayers - 1) * hb - h.point_rong;
            points = h.point_rong;
            k.nriichi = -1; //mark the sticks as taken, in case of double ron
        }

        //sekinin barai payments
        //    treat pao as the liable player paying back the other players - safe for multiple yakuman
        const OYA = 0;
        const KO = 1;
        const RON = 2;
        const YSCORE = [ //yakuman scoring table
            //oya,    ko,   ron  pays
            [0, 16000, 48000], //oya wins
            [16000, 8000, 32000]  //ko  wins
        ];

        if (pao) {
            res[2] = liableseat; //this is how tenhou does it - doesn't really seem to matter to akochan or tenhou.net/5

            if (h.zimo) //liable player needs to payback n yakuman tsumo payments
            {
                if (h.qinjia) //dealer tsumo
                {   //should treat tsumo loss as ron, luckily all yakuman values round safely for north bisection
                    delta[liableseat] -= 2 * hb + liablefor * 2 * YSCORE[OYA][KO] + tlround((1 / 2) * liablefor * YSCORE[OYA][KO]); // 1? only paying back other ko
                    delta.forEach((_e, i) => {
                        if (liableseat != i && h.seat != i && k.nplayers >= i)
                            delta[i] += hb + liablefor * YSCORE[OYA][KO] + tlround((1 / 2) * liablefor * (YSCORE[OYA][KO]));
                    });
                    if (3 == k.nplayers) //dealer should get north's payment from liable
                        delta[h.seat] += (TSUMOLOSSOFF ? 0 : liablefor * YSCORE[OYA][KO]);
                }
                else  //non-dealer tsumo
                {
                    delta[liableseat] -= (k.nplayers - 2) * hb + liablefor * (YSCORE[KO][OYA] + YSCORE[KO][KO]) + tlround((1 / 2) * liablefor * YSCORE[KO][KO]); //^^same 1st, but ko
                    delta.forEach((_e, i) => {
                        if (liableseat != i && h.seat != i && k.nplayers >= i) {
                            if (k.dealerseat == i)
                                delta[i] += hb + liablefor * YSCORE[KO][OYA] + tlround((1 / 2) * liablefor * YSCORE[KO][KO]); //^^same 1st ...
                            else
                                delta[i] += hb + liablefor * YSCORE[KO][KO] + tlround((1 / 2) * liablefor * YSCORE[KO][KO]); //^^same 1st ...
                        }
                    });
                }
            }
            else      //ron
            {
                //liable seat pays the deal-in seat 1/2 yakuman + full honba
                delta[liableseat] -= (k.nplayers - 1) * hb + (1 / 2) * liablefor * YSCORE[h.qinjia ? OYA : KO][RON];
                delta[k.ldseat] += (k.nplayers - 1) * hb + (1 / 2) * liablefor * YSCORE[h.qinjia ? OYA : KO][RON];
            }
        } //if pao
        //append point symbol
        points += RUNES.points[JPNAME] + ((h.zimo && h.qinjia) ? RUNES.all[NAMEPREF] : "");

        //score string
        const fuhan = h.fu + RUNES.fu[JPNAME] + h.count + RUNES.han[JPNAME];
        if (h.yiman) //yakuman
            res.push((SHOWFU ? fuhan : "") + RUNES.yakuman[JPNAME] + points);
        else if (13 <= h.count) //kazoe
            res.push((SHOWFU ? fuhan : "") + RUNES.kazoeyakuman[JPNAME] + points);
        else if (11 <= h.count) //sanbaiman
            res.push((SHOWFU ? fuhan : "") + RUNES.sanbaiman[JPNAME] + points);
        else if (8 <= h.count) //baiman
            res.push((SHOWFU ? fuhan : "") + RUNES.baiman[JPNAME] + points);
        else if (6 <= h.count) //haneman
            res.push((SHOWFU ? fuhan : "") + RUNES.haneman[JPNAME] + points);
        else if (5 <= h.count || (4 <= h.count && 40 <= h.fu) || (3 <= h.count && 70 <= h.fu)) //mangan
            res.push((SHOWFU ? fuhan : "") + RUNES.mangan[JPNAME] + points);
        else if (ALLOW_KIRIAGE && ((4 == h.count && 30 == h.fu) || (3 == h.count && 60 == h.fu))) //kiriage
            res.push((SHOWFU ? fuhan : "") + RUNES.kiriagemangan[JPNAME] + points);
        else //ordinary hand
            res.push(fuhan + points);

        h.fans.forEach((e: any) => res.push(
            (JPNAME == NAMEPREF ? cfg.fan.fan.map_[e.id].name_jp : cfg.fan.fan.map_[e.id].name_en)
            + "(" + (h.yiman ? (RUNES.yakuman[JPNAME]) : (e.val + RUNES.han[JPNAME])) + ")"
        ));

        return [pad_right(delta, 4, 0.), res];
    }

    //convert mjs records to tenhou log
    function generatelog(mjslog: any[]): any[] {
        const log: any[] = [];
        mjslog.forEach((e, leafidx) => {
            switch (e.constructor.name) {
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
                            console.log("didn't know what to do with " + e.constructor.name + "(" + leafidx + ")");
                            return;
                    }
                case "RecordAnGangAddGang":
                    switch (e.type) {
                        case 3: handleAnkan(e, kyoku); return;
                        case 2: handleShouminkan(e, kyoku); return;
                        default:
                            console.log("didn't know what to do with " + e.constructor.name + " type: " + e.type);
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
                            agari.push(parsehule(f, kyoku));
                        });
                        const entry = dumpKyoku(kyoku, []);
                        entry.push([RUNES.agari[JPNAME]].concat(agari.flat()));
                        log.push(entry);
                        return;
                    }
                default:
                    console.log("didn't know what to do with " + e.constructor.name + "(" + leafidx + ")");
                    return;
            }
        });

        return log;
    }

    interface TenhouResult {
        [key: string]: any;
    }

    //this is the json struct that we write to file
    function parse(record: any): TenhouResult {
        TSUMOLOSSOFF = false;
        const res: TenhouResult = {};
        let ruledisp = "";
        let lobby = ""; //usually 0, is the custom lobby number
        const nplayers = record.head.result.players.length;
        let nakas = nplayers - 1; //default
        // anon edit 1 start
        const mjslog: any[] = [];
        const mjsact = net.MessageWrapper.decodeMessage(record.data).actions;
        mjsact.forEach((e: any) => { if (e.result.length !== 0) mjslog.push(net.MessageWrapper.decodeMessage(e.result)) });
        // anon edit 1 end

        res["ver"] = "2.3"; // mlog version number
        res["ref"] = record.head.uuid; // game id - copy and paste into "other" on the log page to view
        res["log"] = generatelog(mjslog);
        //PF4 is yonma, PF3 is sanma
        res["ratingc"] = "PF" + nplayers;

        //rule display
        if (3 == nplayers && JPNAME == NAMEPREF)
            ruledisp += RUNES.sanma[JPNAME];
        if (record.head.config.meta.mode_id) //ranked or casual
            ruledisp += (JPNAME == NAMEPREF) ?
                cfg.desktop.matchmode.map_[record.head.config.meta.mode_id].room_name_jp
                : cfg.desktop.matchmode.map_[record.head.config.meta.mode_id].room_name_en;
        else if (record.head.config.meta.room_id) //friendly
        {
            lobby = ": " + record.head.config.meta.room_id; //can set room number as lobby number
            ruledisp += RUNES.friendly[NAMEPREF]; //"Friendly";
            nakas = record.head.config.mode.detail_rule.dora_count;
            TSUMOLOSSOFF = (3 == nplayers) ? !record.head.config.mode.detail_rule.have_zimosun : false;
        }
        else if (record.head.config.meta.contest_uid) //tourney
        {
            lobby = ": " + record.head.config.meta.contest_uid;
            ruledisp += RUNES.tournament[NAMEPREF]; //"Tournament";
            nakas = record.head.config.mode.detail_rule.dora_count;
            TSUMOLOSSOFF = (3 == nplayers) ? !record.head.config.mode.detail_rule.have_zimosun : false;
        }
        if (1 == record.head.config.mode.mode) {
            ruledisp += RUNES.tonpuu[NAMEPREF]; //" East";
        }
        else if (2 == record.head.config.mode.mode) {
            ruledisp += RUNES.hanchan[NAMEPREF]; //" South";
        }
        if (!record.head.config.meta.mode_id && !record.head.config.mode.detail_rule.dora_count) {
            if (JPNAME != NAMEPREF)
                ruledisp += RUNES.nored[NAMEPREF];
            res["rule"] = { "disp": ruledisp, "aka53": 0, "aka52": 0, "aka51": 0 };
        }
        else {
            if (JPNAME == NAMEPREF)
                ruledisp += RUNES.red[JPNAME];
            res["rule"] = { "disp": ruledisp, "aka53": 1, "aka52": (4 == nakas ? 2 : 1), "aka51": (4 == nplayers ? 1 : 0) };
        }

        res["lobby"] = 0; //tenhou custom lobby - could be tourney id or friendly room for mjs. appending to title instead to avoid 3->C etc. in tenhou.net/5
        // autism to fix logs with AI
        // ranks
        res["dan"] = new Array(4).fill('');
        record.head.accounts.forEach((e: any) =>
            res["dan"][e.seat] = (JPNAME == NAMEPREF) ?
                cfg.level_definition.level_definition.map_[e.level.id].full_name_jp
                : cfg.level_definition.level_definition.map_[e.level.id].full_name_en
        );
        // level score, no real analog to rate
        res["rate"] = new Array(4).fill('');
        record.head.accounts.forEach((e: any) => res["rate"][e.seat] = e.level.score); //level score, closest thing to rate
        // sex
        res["sx"] = new Array(4).fill('C')
        record.head.accounts.forEach((e: any) => {
            const sex = cfg.item_definition.character.map_[e.character.charid].sex;
            res["sx"][e.seat] = (1 == sex) ? "F" : (2 == sex ? "M" : "C");
        });
        // >names
        res["name"] = new Array(4).fill('AI');
        record.head.accounts.forEach((e: any) => res["name"][e.seat] = e.nickname);
        // clean up for sanma AI
        if (3 == nplayers) {
            res["name"][3] = "";
            res["sx"][3] = "";
        }
        // scores
        const scores = record.head.result.players
            .map((e: any) => [e.seat, e.part_point_1, e.total_point / 1000]);
        res["sc"] = new Array(8).fill(0);
        scores.forEach((e: any) => { res["sc"][2 * e[0]] = e[1]; res["sc"][2 * e[0] + 1] = e[2]; });
        //optional title - why not give the room and put the timestamp here; 1000 for unix to .js timestamp convention
        res["title"] = [ruledisp + lobby,
        (new Date(record.head.end_time * 1000)).toLocaleString()
        ];
        //optionally dump mjs records NOTE: this will likely make the file too large for tenhou.net/5 viewer
        if (VERBOSELOG) {
            res["mjshead"] = record.head;
            res["mjslog"] = mjslog;
            res["mjsrecordtypes"] = mjslog.map(e => e.constructor.name);
        }

        return res;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    export { parse };
