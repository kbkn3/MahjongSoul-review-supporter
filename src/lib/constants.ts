const JPNAME = 0;
const RONAME = 1;
const ENNAME = 2;
const RUNES: Record<string, [string, string, string]> = {
    "mangan": ["満貫", "Mangan ", "Mangan "],
    "haneman": ["跳満", "Haneman ", "Haneman "],
    "baiman": ["倍満", "Baiman ", "Baiman "],
    "sanbaiman": ["三倍満", "Sanbaiman ", "Sanbaiman "],
    "yakuman": ["役満", "Yakuman ", "Yakuman "],
    "kazoeyakuman": ["役満", "Kazoe Yakuman ", "Counted Yakuman "],
    "kiriagemangan": ["切り上げ満貫", "Kiriage Mangan ", "Rounded Mangan "],
    "agari": ["和了", "Agari", "Agari"],
    "ryuukyoku": ["流局", "Ryuukyoku", "Exhaustive Draw"],
    "nagashimangan": ["流し満貫", "Nagashi Mangan", "Mangan at Draw"],
    "suukaikan": ["四開槓", "Suukaikan", "Four Kan Abortion"],
    "sanchahou": ["三家和", "Sanchahou", "Three Ron Abortion"],
    "kyuushukyuuhai": ["九種九牌", "Kyuushu Kyuuhai", "Nine Terminal Abortion"],
    "suufonrenda": ["四風連打", "Suufon Renda", "Four Wind Abortion"],
    "suuchariichi": ["四家立直", "Suucha Riichi", "Four Riichi Abortion"],
    "fu": ["符", "符", "Fu"],
    "han": ["飜", "飜", "Han"],
    "points": ["点", "点", "Points"],
    "all": ["∀", "∀", "∀"],
    "pao": ["包", "pao", "Responsibility"],
    "tonpuu": ["東喰", " East", " East"],
    "hanchan": ["南喰", " South", " South"],
    "friendly": ["友人戦", "Friendly", "Friendly"],
    "tournament": ["大会戦", "Tournament", "Tournament"],
    "sanma": ["三", "3-Player ", "3-Player "],
    "red": ["赤", " Red", " Red Fives"],
    "nored": ["", " Aka Nashi", " No Red Fives"]
};

const DAISANGEN = 37;
const DAISUUSHI = 50;
const TSUMOGIRI = 60;

export {
    JPNAME,
    RONAME,
    ENNAME,
    RUNES,
    DAISANGEN,
    DAISUUSHI,
    TSUMOGIRI,
};
