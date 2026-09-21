// 出力は日本語に固定する。天鳳形式の文字列は後段が日本語前提で読むため切り替えられない:
// naga.ts の役名変換は「役牌:場風牌(1飜)」、卓判定は「銅/銀/玉」、順位点は「雀豪★1」を鍵にしている。
const RUNES: Record<string, string> = {
    "mangan": "満貫",
    "haneman": "跳満",
    "baiman": "倍満",
    "sanbaiman": "三倍満",
    "yakuman": "役満",
    "kazoeyakuman": "役満",
    "agari": "和了",
    "ryuukyoku": "流局",
    "nagashimangan": "流し満貫",
    "suukaikan": "四開槓",
    "sanchahou": "三家和",
    "kyuushukyuuhai": "九種九牌",
    "suufonrenda": "四風連打",
    "suuchariichi": "四家立直",
    "fu": "符",
    "han": "飜",
    "points": "点",
    "all": "∀",
    "pao": "包",
    "tonpuu": "東喰",
    "hanchan": "南喰",
    "friendly": "友人戦",
    "tournament": "大会戦",
    "sanma": "三",
    "red": "赤"
};

const DAISANGEN = 37;
const DAISUUSHI = 50;
const TSUMOGIRI = 60;

export {
    RUNES,
    DAISANGEN,
    DAISUUSHI,
    TSUMOGIRI,
};
