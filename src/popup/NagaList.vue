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
      <select @change="handleRuleChange" class="w-48 bg-white border border-gray-300 rounded-md py-2 px-3 text-base"
        v-model="Rule">
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
import { extractTable, toSoulTable, toNagaLog, fixScoreRonTileWasReachTile } from "@/lib/naga";
import { POINTS, getPtEV } from "@/lib/points";
import { useDisplayLang } from "@/composables/useDisplayLang";

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

    const isChecked = ref(false);
    /**
     * submitボタンを押したら選択状態の局の番号をまとめて、その局のデータを
     */
    const submitNaga = () => {
      const useKyokus = [];
      for (let i = 0; i < Kyoku_info.length; i++) {
        if (Kyoku_info[i].isSelect === true) {
          useKyokus.push(Kyoku_info[i].id);
        }
      }
      let URLstring = "";
      for (const useKyoku of useKyokus) {
        URLstring = `${URLstring + (toNagaData[useKyoku])}\n`;
      }
      //匿名モード
      if (isChecked.value === true) {
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
        if (Kyoku_info[j].isSelect === true) {
          count = count + 1;
        }
      }
      if (count === Kyoku_info.length) {
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
        if (Kyoku_info[i].isSelect === true) {
          useKyokus.push(Kyoku_info[i].id);
        }
      }
      return (useKyokus.length * 10) + msg
    });

    /**
     * content-scriptから牌譜データを受け取る
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const title = "疎通";
      console.log('4.listner');
      fixScoreRonTileWasReachTile(request.message)
      processData(request.message);
      for (let s = 0; s < request.message.name.length; s++) {
        request.message.name[s] = request.message.name[s].replace(/[!#<>"%&$*]/gi, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
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
        const kyoku = {};
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
            if (message.log[i][16][2 * t][0] === message.log[i][16][2 * t][1]) {//ツモの場合
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
          const ryukyoku = [message.log[i][16][0]];
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

    const DisplayLang = useDisplayLang();

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

    // Based on: 雀魂の牌譜をNAGAに解析させる－完全版－ (https://lions.blue/07813) by ちぃといつ
    // Licensed under Apache License 2.0
    //雀魂の牌譜jsonを天鳳形式に変換
    function soul2naga(results) {
      const INDENT = " ".repeat(4);
      const soulJson = JSON.stringify(results, null, INDENT)
        .replace(new RegExp(`\n${INDENT}+`, 'g'), " ") //bring up log array items
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
          const pointArray = POINTS.others[Rule.value]
          ptEV = [pointArray, pointArray, pointArray, pointArray, 1]
        } else {
          ptEV = getPtEV(wind, soulPaifu.dan)
        }
      } else {
        ptEV = getPtEV(wind, soulPaifu.dan, table)
      }
      console.log("ptEV", ptEV)
      // title内の卓名を雀魂っぽく変換する。
      //
      // 変換前のtitle:
      //     "title": [ "玉の間南喰赤", "2021/10/20 20:48:01" ]
      // 変換後のtitle:
      //     "title": [ "玉の間四人南", "2021/10/20 20:48:01" ]
      const title = JSON.parse(JSON.stringify(soulPaifu.title));
      title[0] = toSoulTable(title[0]);

      // rule内の卓名を雀魂っぽく変換する。
      //
      // 変換前のrule:
      //     "rule": { "disp": "玉の間南喰赤", "aka53": 1, "aka52": 1, "aka51": 1 }
      // 変換後のrule:
      //     "rule": { "disp": "玉の間四人南", "aka53": 1, "aka52": 1, "aka51": 1 }
      const rule = JSON.parse(JSON.stringify(soulPaifu.rule));
      rule.disp = toSoulTable(rule.disp);

      // logを局ごとのデータに分割し、牌譜エディタのURL群として返す。
      return soulPaifu.log.map((v) => (
          EDITOR_URL_PREFIX +
          JSON.stringify({
            title: [title, JSON.stringify(ptEV).slice(1, -1)],
            name: soulPaifu.name,
            rule: rule,
            log: [toNagaLog(v)],
          })
        ));
    }
    const handleRuleChange = (event) => {
      Rule.value = event.target.value
      chrome.storage.local.set({ rule: event.target.value })
      // Vueの再読み込み
      location.reload()
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
