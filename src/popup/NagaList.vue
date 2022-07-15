<template>
  <div>
    <div>
      <div class="text-lg font-semibold text-mjsoul-text-lightblue">Select hand</div>
      <div v-for="info_obj in Kyoku_info" :key="info_obj.id">
        <Kyoku :Language=Number(DisplayLang) v-bind="info_obj" @click="select(info_obj.id)"></Kyoku>
      </div>
      </div>
      <div class="w-36 my-2 mx-1">
        <button type="button" class="my-button" @click="submitNaga">Submit</button>
      </div>
  </div>
</template>

<script>
import { onMounted, reactive,ref } from "vue";
import Kyoku from "@/popup/Kyoku.vue";

export default {
  components: { Kyoku },
  setup() {
    const Kyoku_info = reactive([]);
    let toNagaData = [];
    const select = (num) => {
      Kyoku_info[num].isSelect = !Kyoku_info[num].isSelect;
    }
    const submitNaga = () => {
      const useKyokus = [];
      for (let i = 0; i < Kyoku_info.length; i++) {
        if (Kyoku_info[i].isSelect == true) {
          useKyokus.push(Kyoku_info[i].id);
        }
      }
      console.log(useKyokus);
      let URLstring = "";
      for (const useKyoku of useKyokus){
        URLstring = URLstring + (toNagaData[useKyoku]) + "\n";
      }

      chrome.storage.local.set({ "toNagaData": URLstring });
      chrome.tabs.create({
        url: 'https://naga.dmv.nico/naga_report/order_form/'
      });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      let title = "疎通";
      console.log('4.listner');
      processData(request.message);
      toNagaData = soul2naga(request.message);
      sendResponse(title);
    });

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
                message.log[i][16][t][message.log[i][16][2 * t][0]], //和了点
                message.log[i][16][t][message.log[i][16][2 * t][1]] //放銃点
              ];
            }
            kyoku.result.push(one);
          }
        } else {
          let ryukyoku = [message.log[i][16][0]];
          message.log[i][16][1].forEach((score, index) => {
            if (score > 0) {
              ryukyoku.push(message.name[index])
            }
          });
          kyoku.result.push(ryukyoku);

        }
        kyoku.isSelect = false;
        Kyoku_info.push(kyoku);
      }
    }
    const DisplayLang = ref(0)
    chrome.storage.local.get("DisplayLang", (result) => {
      // join langs
      if (typeof result.DisplayLang !== "undefined") {
         DisplayLang.value = result.DisplayLang;
      }
    });
    onMounted(() => {

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'tabNaga' }, (content) => {
          if (!content) {
            alert('Cannot Get! Try Reload First!');
            return;
          }
          console.log(content);
        });
      });

    })

    function soul2naga(results) {
      const soulJson = JSON.stringify(results, null, "    ")
        .replace(/\n       \s+/g, " ") //bring up log array items
        .replace(/], \[/g, "],\n        [") //bump nested lists back down
        .replace(/\n\s+]/g, " ]") //bring up isolated right brackets
        .replace(/\n\s+},\n/g, " },\n");
      const urls = createViewerUrls(soulJson);
      return urls;
    }

    // 天鳳牌譜エディタのURLにおいて、牌譜データに先行する部分の文字列。
    const EDITOR_URL_PREFIX = "https://tenhou.net/6/#json=";

    function createViewerUrls(soulJson) {
      // 雀魂の牌譜JSONをオブジェクトに変換する。
      const soulPaifu = JSON.parse(soulJson);

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
            title: title,
            name: soulPaifu.name,
            rule: rule,
            log: [toNagaLog(v)],
          })
        );
      });
    }

    /**
     * ダウンロードリンクのhref属性を組み立てる。
     *
     * @param {Array<String>} urls 牌譜エディタのURL群を指定する。
     * @returns {String} ダウンロードリンクのhref属性を返す。
     */
    function buildDownloadHref(urls) {
      // ダウンロードリンクのhref属性を組み立てる。
      return DOWNLOAD_HREF_PREFIX + encodeURIComponent(urls.join("\n"));
    }

    /**
     * 卓名を雀魂っぽく変換する。
     *
     * @param {String} tenhouTable 天鳳っぽい卓名を指定する。
     * @returns {String} 雀魂っぽい卓名を返す。
     */
    function toSoulTable(tenhouTable) {
      // 表記の好みの問題なので、必ずしも必要となる処理ではない。
      return tenhouTable.replace("南喰赤", "四人南");
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
      return tenhouTable.replace("南喰赤", "四人南");
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

    return {
      Kyoku_info,
      select,
      submitNaga,
      processData,
      soul2naga,
      DisplayLang,

    };
  },
};
</script>
