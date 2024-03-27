<template>
  <div class="template-box">
    <div>
      <div class="template-title">NAGA</div>
      <div class="w-full px-2 grid grid-cols-6 gap-4">
        <div class="text-base font-semibold text-mjsoul-text-lightblue py-2 col-start-1 col-span-3">Select hand</div>
        <div class="text-base font-semibold text-mjsoul-text-lightblue py-2 text-right col-start-4 col-span-2">{{
          btn_msg }}</div>
        <button type="button" class="my-button col-start-6 col-span-2" @click="selectAll">All</button>
      </div>
      <div v-for="info_obj in Kyoku_info" :key="info_obj.id">
        <Kyoku :Language=Number(DisplayLang) v-bind="info_obj" @click="select(info_obj.id)"></Kyoku>
      </div>
    </div>
    <div class="w-full px-2 py-2">
      <div class="text-sm font-semibold text-mjsoul-text-lightblue mt-2 mb-6 mx-12">※友人戦・大会戦の場合は順位点の期待値を指定してください</div>
      <select @change="handleRuleChange" class="w-48 bg-white border border-gray-300 rounded-md py-2 px-3 text-base" v-model="Rule">
        <option value="dani">段位戦</option>
        <option value="1030">10-30（M League）</option>
        <option value="1020">10-20</option>
        <option value="515">5-15（四象戦）</option>
        <option value="510">5-10</option>
        <option value="tenho">ラス回避(90, 45, 0, -135)</option>
      </select>
    </div>
    <div class="w-full my-2 px-2 grid grid-cols-6 gap-4">
      <div class="col-start-2 col-span-2 py-3">
        <input type="checkbox" class="form-checkbox py-3" id="checkbox" v-model="isChecked">
        <label class="text-base text-mjsoul-text-lightblue ml-1 py-2" for="checkbox">
          匿名
        </label>
      </div>
      <p class="text-lg font-semibold text-mjsoul-text-lightblue py-2 text-right col-start-4 col-span-2">{{ btn_msg }}
      </p>
      <button type="button" class="my-button col-start-6 col-span-1" @click="submitNaga">Go</button>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, computed } from "vue";
import Kyoku from "@/popup/Kyoku.vue";

export default {
  components: { Kyoku },
  setup() {
    //牌譜データから表示用のデータを抽出したもの
    const Kyoku_info = reactive([]);
    //jsonデータから天鳳形式に変換したものを受け取る
    let toNagaData = [];
    //局選択機能
    const select = (num) => {
      Kyoku_info[num].isSelect = !Kyoku_info[num].isSelect;
    }

    let isChecked = ref(false);
    /**
     * submitボタンを押したら選択状態の局の番号をまとめて、その局のデータを
     */
    const submitNaga = () => {
      const useKyokus = [];
      for (let i = 0; i < Kyoku_info.length; i++) {
        if (Kyoku_info[i].isSelect == true) {
          useKyokus.push(Kyoku_info[i].id);
        }
      }
      let URLstring = "";
      for (const useKyoku of useKyokus) {
        URLstring = URLstring + (toNagaData[useKyoku]) + "\n";
      }
      //匿名モード
      if (isChecked.value == true) {
        const regexp = /"name":\[.+\],"rule"/g;
        URLstring = URLstring.replace(regexp, '"name":["Aさん","Bさん","Cさん","Dさん"],"rule"');
      }

      chrome.storage.local.set({ "toNagaData": URLstring });
      chrome.tabs.create({
        url: 'https://naga.dmv.nico/naga_report/order_form/'
      });
    }
    const selectAll = () => {
      let count = 0;
      for (let j = 0; j < Kyoku_info.length; j++) {
        if (Kyoku_info[j].isSelect == true) {
          count = count + 1;
        }
      }
      if (count == Kyoku_info.length) {
        for (let j = 0; j < Kyoku_info.length; j++) {
          Kyoku_info[j].isSelect = false;
        }
      } else {
        for (let j = 0; j < Kyoku_info.length; j++) {
          Kyoku_info[j].isSelect = true;
        }
      }
    }
    /**
     * 選択した局数に応じてNAGAで何ポイント消費するかを計算して表示する
     */
    const btn_msg = computed(() => {
      const msg = "NP";
      const useKyokus = [];
      for (let i = 0; i < Kyoku_info.length; i++) {
        if (Kyoku_info[i].isSelect == true) {
          useKyokus.push(Kyoku_info[i].id);
        }
      }
      return (useKyokus.length * 10) + msg
    });

    /**
     * content-scriptから牌譜データを受け取る
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      let title = "疎通";
      console.log('4.listner');
      fixScoreRonTileWasReachTile(request.message)
      processData(request.message);
      for (let s = 0; s < request.message.name.length; s++) {
        request.message.name[s] = request.message.name[s].replace(/[!#<>"%&$*]/gi, function (s) { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0) });
      }
      toNagaData = soul2naga(request.message);
      console.log(toNagaData)
      sendResponse(title);
    });

    /**
     * Akochan reviewerの形式になった牌譜から表示用のデータを取り出して、local storageに保存する
     * @param {*} message 牌譜データのjson
     */
    const processData = (message) => {
      for (let i = 0; i < message.log.length; i++) {
        let kyoku = {};
        kyoku.id = i;
        //場風
        kyoku.Ba = ~~(message.log[i][0][0] / 4);
        //局数
        kyoku.Kyoku_num = (message.log[i][0][0] % 4) + 1;
        //本場
        kyoku.Honba = message.log[i][0][1];
        //局の結果
        kyoku.result = [];
        if (message.log[i][16][0] === "和了") {//和了がいる場合
          let t = 0;
          for (t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {//ダブロン・トリロンに対応
            let one = [];
            if (message.log[i][16][2 * t][0] == message.log[i][16][2 * t][1]) {//ツモの場合
              one = [
                "ツモ和", //結果
                message.name[message.log[i][16][2 * t][0]], //和了者
                "", //放銃者
                message.log[i][16][t][message.log[i][16][2 * t][0]], //和了点
                "" //放銃点
              ];
            } else {
              one = [
                "ロン和", //結果
                message.name[message.log[i][16][2 * t][0]], //和了者
                message.name[message.log[i][16][2 * t][1]], //放銃者
                message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]], //和了点
                message.log[i][16][2 * t - 1][message.log[i][16][2 * t][1]] //放銃点
              ];
            }
            kyoku.result.push(one);
          }
        } else {
          let ryukyoku = [message.log[i][16][0]];
          if (message.log[i][16][1]) {
            message.log[i][16][1].forEach((score, index) => {
              if (score > 0) {
                ryukyoku.push(message.name[index])
              }
            });
          }
          kyoku.result.push(ryukyoku);

        }
        kyoku.isSelect = false;
        Kyoku_info.push(kyoku);
      }
    }

    //表示用言語の設定をlocal storageから呼び出す
    const DisplayLang = ref(0)
    chrome.storage.local.get("DisplayLang", (result) => {
      // join langs
      if (typeof result.DisplayLang !== "undefined") {
        DisplayLang.value = result.DisplayLang;
      }
    });

    //content-scriptに通信して牌譜を送信させる
    onMounted(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'tabNaga' }, (content) => {
          if (!content) {
            alert('Cannot Get! Try Reload First!');
            return;
          }
        });
      });
      chrome.storage.local.get("rule", (result) => {
        // join rule
        if (typeof result.rule !== "undefined") {
          Rule.value = result.rule;
        }
      });
    })

    //雀魂の牌譜jsonを天鳳形式に変換
    function soul2naga(results) {
      const soulJson = JSON.stringify(results, null, "    ")
        // eslint-disable-next-line no-regex-spaces
        .replace(/\n       \s+/g, " ") //bring up log array items
        .replace(/], \[/g, "],\n        [") //bump nested lists back down
        .replace(/\n\s+]/g, " ]") //bring up isolated right brackets
        .replace(/\n\s+},\n/g, " },\n");
      const urls = createViewerUrls(soulJson);
      return urls;
    }

    // 天鳳牌譜エディタのURLにおいて、牌譜データに先行する部分の文字列。
    const EDITOR_URL_PREFIX = "https://tenhou.net/6/#json=";
    // 段位戦以外の場合に設定するルール
    const Rule = ref('dani')
    function createViewerUrls(soulJson) {
      // 雀魂の牌譜JSONをオブジェクトに変換する。
      const soulPaifu = JSON.parse(soulJson);

      // 段位ポイント期待値(段位ptEV)の基準を算出する
      let ptEV;
      // 東風/東南判定
      const wind = soulPaifu.rule.disp.includes('南') ? "south" : "east";
      // 卓名
      const table = extractTable(soulPaifu.rule.disp)
      // ルール
      chrome.storage.local.get("rule", (result) => {
        // join rule
        if (typeof result.rule !== "undefined") {
          Rule.value = result.rule;
        }
      });
      // 段位戦以外の牌譜の場合
      if (table === 'others') {
        // 段位戦配分を設定した場合
        if (Rule.value !== 'dani') {
          const rule = Rule.value
          const pointArray = POINTS[table][rule]
          ptEV = [pointArray, pointArray, pointArray, pointArray, 1]
        } else {
          ptEV = getRankPtEV(wind, table, soulPaifu)
        }
      } else {
        ptEV = getRankPtEV(wind, table, soulPaifu)
      }

      // title内の卓名を雀魂っぽく変換する。
      //
      // 変換前のtitle:
      //     "title": [ "玉の間南喰赤", "2021/10/20 20:48:01" ]
      // 変換後のtitle:
      //     "title": [ "玉の間四人南", "2021/10/20 20:48:01" ]
      const title = deepCopy(soulPaifu.title);
      title[0] = toSoulTable(title[0]);

      // rule内の卓名を雀魂っぽく変換する。
      //
      // 変換前のrule:
      //     "rule": { "disp": "玉の間南喰赤", "aka53": 1, "aka52": 1, "aka51": 1 }
      // 変換後のrule:
      //     "rule": { "disp": "玉の間四人南", "aka53": 1, "aka52": 1, "aka51": 1 }
      const rule = deepCopy(soulPaifu.rule);
      rule.disp = toSoulTable(rule.disp);

      // logを局ごとのデータに分割し、牌譜エディタのURL群として返す。
      return soulPaifu.log.map(function (v) {
        return (
          EDITOR_URL_PREFIX +
          JSON.stringify({
            title: [title, JSON.stringify(ptEV).slice(1, -1)],
            name: soulPaifu.name,
            rule: rule,
            log: [toNagaLog(v)],
          })
        );
      });
    }
    function getRankPtEV(wind, table, soulPaifu) {
      let ptEV
      // 頂上決戦判定（魂天のみの試合）
      if (wind === "east" && soulPaifu.dan.every(dan => dan.match(/魂天Lv\d+/))) {
        ptEV = [[0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], 1]
      } else if (wind === "south" && soulPaifu.dan.every(dan => dan.match(/魂天Lv\d+/))) {
        ptEV = [[1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], 1]
      } else {
        ptEV = soulPaifu.dan.map(
          (dan) => {
            if (wind === "east" && dan.match(/魂天Lv\d+/)) {
              return [0.6, 0.3, -0.3, -0.6]
            } else if (wind === "south" && dan.match(/魂天Lv\d+/)) {
              return [1.0, 0.4, -0.4, -1.0]
            } else {
              return POINTS[wind][table][dan]
            }
          }
        )
        ptEV.push(1)
      }
      return ptEV
    }

    const handleRuleChange = (event) => {
      Rule.value = event.target.value
      chrome.storage.local.set({rule: event.target.value})
      // Vueの再読み込み
      location.reload()
    }
    /**
     * オブジェクトをディープコピーする。
     *
     * @param {Object} src コピー対象のオブジェクトを指定する。
     * @returns {Object} 複製したオブジェクトを返す。
     */
    function deepCopy(src) {
      // JSON文字列化してからオブジェクトに戻すことでディープコピーを実現する。
      return JSON.parse(JSON.stringify(src));
    }

    /**
     * 卓名を雀魂っぽく変換する。
     *
     * @param {String} tenhouTable 天鳳っぽい卓名を指定する。
     * @returns {String} 雀魂っぽい卓名を返す。
     */
    function toSoulTable(tenhouTable) {
      // 表記の好みの問題なので、必ずしも必要となる処理ではない。
      return tenhouTable.replace("南喰赤", "四人南").replace("東喰赤", "四人東");
    }

    /**
     * logをNAGAが解析可能な形式に変換する。
     *
     * @param {Array<Array>} soulLog 雀魂形式のlogを指定する。
     * @returns {Array<Array>} NAGAで解析可能な形式のlogを返す。
     */
    function toNagaLog(soulLog) {
      // 流局のデータは変換の必要がない。
      if (soulLog[16].length < 3) {
        return soulLog;
      }
      const nagaLog = deepCopy(soulLog);

      // 当該局の場風を算出する。
      //
      // 局を表す数字と意味:
      //     0 => 東1局, 1 => 東2局, ...
      const prevalent = ["東", "南", "西", "北"][Math.floor(nagaLog[0][0] / 4)];

      // 役名をNAGAが解析可能な表記に変換する。
      // ダブロン・トリロンに対応するため複数回繰り返す。
      for (let i = 1; i < nagaLog[16].length; i += 2) {
        // 当該局における和了者の自風を設定する。
        //
        // 算出方法:
        //     (和了者のプレイヤー番号 - 親の位置 + 4) % 4
        const seat = ["東", "南", "西", "北"][
          (nagaLog[16][i].indexOf(Math.max(...nagaLog[16][i])) -
            (nagaLog[0][0] % 4) +
            4) %
          4
        ];

        // 役名をNAGAが解析可能な表記に変換する。
        nagaLog[16][i + 1] = nagaLog[16][i + 1].slice(0, 4).concat(
          nagaLog[16][i + 1].slice(4).map(function (v) {
            return toNagaHand(v, prevalent, seat);
          })
        );
      }

      // 変換後のlogを返す。
      return nagaLog;
    }

    /**
     * 役名をNAGAが解析可能な表記に変換する。
     *
     * @param {String} hand 和了役を指定する。
     * @param {String} prevalent 場風を指定する。
     * @param {String} seat 和了者の自風を指定する。
     * @returns {String} NAGAで解析可能な表記の役名を返す。
     */
    function toNagaHand(hand, prevalent, seat) {
      // 対応が必要な役が判明次第、随時追加する。
      switch (hand) {
        case "役牌:場風牌(1飜)":
          return `場風 ${prevalent}(1飜)`;
        case "役牌:自風牌(1飜)":
          return `自風 ${seat}(1飜)`;
        case "ダブル立直(2飜)":
          return "両立直(2飜)";
        default:
          return hand;
      }
    }

    // 段位ごとのポイント配分
    const POINTS = {
      east: {
        bronze: {
          "初心★1": [25, 10, -5, -15],
          "初心★2": [25, 10, -5, -15],
          "初心★3": [25, 10, -5, -15],
          "雀士★1": [25, 10, -5, -25],
          "雀士★2": [25, 10, -5, -35],
          "雀士★3": [25, 10, -5, -45]
        },
        silver: {
          "雀士★1": [35, 15, -5, -25],
          "雀士★2": [35, 15, -5, -35],
          "雀士★3": [35, 15, -5, -45],
          "雀傑★1": [35, 15, -5, -55],
          "雀傑★2": [35, 15, -5, -65],
          "雀傑★3": [35, 15, -5, -75]
        },
        gold: {
          "雀傑★1": [55, 25, -5, -55],
          "雀傑★2": [55, 25, -5, -65],
          "雀傑★3": [55, 25, -5, -75],
          "雀豪★1": [55, 25, -5, -95],
          "雀豪★2": [55, 25, -5, -105],
          "雀豪★3": [55, 25, -5, -115]
        },
        tama: {
          "雀豪★1": [70, 35, -5, -95],
          "雀豪★2": [70, 35, -5, -105],
          "雀豪★3": [70, 35, -5, -115],
          "雀聖★1": [70, 35, -5, -125],
          "雀聖★2": [70, 35, -5, -135],
          "雀聖★3": [70, 35, -5, -145]
        },
        king: {
          "雀聖★1": [75, 35, -5, -125],
          "雀聖★2": [75, 35, -5, -135],
          "雀聖★3": [75, 35, -5, -145],
        }
      },
      south: {
        bronze: {
          "初心★1": [35, 15, -5, -15],
          "初心★2": [35, 15, -5, -15],
          "初心★3": [35, 15, -5, -15],
          "雀士★1": [35, 15, -5, -35],
          "雀士★2": [35, 15, -5, -55],
          "雀士★3": [35, 15, -5, -75]
        },
        silver: {
          "雀士★1": [55, 25, -5, -35],
          "雀士★2": [55, 25, -5, -55],
          "雀士★3": [55, 25, -5, -75],
          "雀傑★1": [55, 25, -5, -95],
          "雀傑★2": [55, 25, -5, -115],
          "雀傑★3": [55, 25, -5, -135]
        },
        gold: {
          "雀傑★1": [95, 45, -5, -95],
          "雀傑★2": [95, 45, -5, -115],
          "雀傑★3": [95, 45, -5, -135],
          "雀豪★1": [95, 45, -5, -180],
          "雀豪★2": [95, 45, -5, -195],
          "雀豪★3": [95, 45, -5, -210]
        },
        tama: {
          "雀豪★1": [125, 60, -5, -180],
          "雀豪★2": [125, 60, -5, -195],
          "雀豪★3": [125, 60, -5, -210],
          "雀聖★1": [125, 60, -5, -225],
          "雀聖★2": [125, 60, -5, -240],
          "雀聖★3": [125, 60, -5, -255]
        },
        king: {
          "雀聖★1": [135, 65, -5, -225],
          "雀聖★2": [135, 65, -5, -240],
          "雀聖★3": [135, 65, -5, -255],
        }
      },
      others: {
        1030: [50, 10, -10, -30],
        1020: [40, 10, -10, -20],
        515: [35, 5, -5, -15],
        510: [30, 5, -5, -10],
        tenho: [90, 45, 0, -135],
      }
    }
    // 卓名変換
    const extractTable = (tableName) => {
      if (tableName.includes('銅')) {
        return 'blonze';
      } else if (tableName.includes('銀')) {
        return 'silver';
      } else if (tableName.includes('金')) {
        return 'gold';
      } else if (tableName.includes('玉')) {
        return 'tama';
      } else if (tableName.includes('王座')) {
        return 'king';
      } else {
        return 'others'
      }
    }
    // リーチ宣言牌がロンになったときの差分を修正
    function fixScoreRonTileWasReachTile(message) {
      for (let i = 0; i < message.log.length; i++) {
        let kyoku = {};
        kyoku.id = i;
        //場風
        kyoku.Ba = ~~(message.log[i][0][0] / 4);
        //局数
        kyoku.Kyoku_num = (message.log[i][0][0] % 4) + 1;
        //本場
        kyoku.Honba = message.log[i][0][1];
        //局の結果
        kyoku.result = [];
        if (message.log[i][16][0] === "和了") {//和了がいる場合
          let t = 0;
          for (t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {//ダブロン・トリロンに対応
            if (message.log[i][16][2 * t][0] !== message.log[i][16][2 * t][1]) {//ロンの場合
              if (checkRonTileIsReachTile(message, i, t)) {
                message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]] -= 1000
              }
            }
          }
        }
      }
    }
    // リーチ宣言牌がロンの場合を判定
    function checkRonTileIsReachTile(message, i, t) {

      // 放銃者の捨牌の配列
      const targetArray = message.log[i][message.log[i][16][2 * t][1] * 3 + 6]
      // 放銃者と和了者の間の移動点数が等しいかの判定（ダブロン/トリロン判定）
      const targetPointEven = message.log[i][16][2 * t - 1][message.log[i][16][2 * t][1]] == message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]]
      // 条件を満たすか確認
      if (targetArray && !targetPointEven) {
        const lastElement = targetArray[targetArray.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('r');
      }

      return false;
    }

    return {
      Kyoku_info,
      select,
      submitNaga,
      selectAll,
      processData,
      soul2naga,
      DisplayLang,
      btn_msg,
      isChecked,
      handleRuleChange,
      Rule
    };
  },
};
</script>
