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
import Kyoku from "./Kyoku.vue";
import { soul2naga } from "../../src/utils/dataConversion.js";

export default {
  components: { Kyoku },
  setup() {
    // 牌譜データから表示用のデータを抽出したもの
    const Kyoku_info = reactive([]);
    // jsonデータから天鳳形式に変換したものを受け取る
    let toNagaData = [];
    // 段位戦以外の場合に設定するルール
    const Rule = ref('dani');
    const isChecked = ref(false);

    // 局選択機能
    const select = (num) => {
      Kyoku_info[num].isSelect = !Kyoku_info[num].isSelect;
    }

    // 選択した局数に応じてNAGAで何ポイント消費するかを計算して表示する
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

    // submitボタンを押したら選択状態の局の番号をまとめて、その局のデータを
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
      // 匿名モード
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

    // Akochan reviewerの形式になった牌譜から表示用のデータを取り出して、local storageに保存する
    const processData = (message) => {
      console.log('Processing data in NagaList with log.length:', message.log?.length);
      Kyoku_info.length = 0; // 配列をクリア
      
      for (let i = 0; i < message.log.length; i++) {
        const kyoku = {};
        kyoku.id = i;
        // 場風
        kyoku.Ba = ~~(message.log[i][0][0] / 4);
        // 局数
        kyoku.Kyoku_num = (message.log[i][0][0] % 4) + 1;
        // 本場
        kyoku.Honba = message.log[i][0][1];
        // 局の結果
        kyoku.result = [];
        if (message.log[i][16][0] === "和了") {// 和了がいる場合
          let t = 0;
          for (t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {// ダブロン・トリロンに対応
            let one = [];
            if (message.log[i][16][2 * t][0] === message.log[i][16][2 * t][1]) {// ツモの場合
              one = [
                "ツモ和", // 結果
                message.name[message.log[i][16][2 * t][0]], // 和了者
                "", // 放銃者
                message.log[i][16][t][message.log[i][16][2 * t][0]], // 和了点
                "" // 放銃点
              ];
            } else {
              one = [
                "ロン和", // 結果
                message.name[message.log[i][16][2 * t][0]], // 和了者
                message.name[message.log[i][16][2 * t][1]], // 放銃者
                message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]], // 和了点
                message.log[i][16][2 * t - 1][message.log[i][16][2 * t][1]] // 放銃点
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
      console.log('Processed Kyoku_info.length:', Kyoku_info.length);
    }

    // リーチ宣言牌がロンになったときの差分を修正
    function fixScoreRonTileWasReachTile(message) {
      for (let i = 0; i < message.log.length; i++) {
        if (message.log[i][16][0] === "和了") {// 和了がいる場合
          let t = 0;
          for (t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {// ダブロン・トリロンに対応
            if (message.log[i][16][2 * t][0] !== message.log[i][16][2 * t][1]) {// ロンの場合
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
      const targetPointEven = message.log[i][16][2 * t - 1][message.log[i][16][2 * t][1]] === message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]]
      // 条件を満たすか確認
      if (targetArray && !targetPointEven) {
        const lastElement = targetArray[targetArray.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('r');
      }
      return false;
    }

    const handleRuleChange = (event) => {
      Rule.value = event.target.value
      chrome.storage.local.set({ rule: event.target.value })
      // Vueの再読み込み
      location.reload()
    }

    // 表示用言語の設定をlocal storageから呼び出す
    const DisplayLang = ref(0)
    chrome.storage.local.get("DisplayLang", (result) => {
      if (typeof result.DisplayLang !== "undefined") {
        DisplayLang.value = result.DisplayLang;
      }
    });

    // content-scriptからruntime.sendMessage経由で牌譜データを受け取る
    console.log('Setting up runtime.onMessage listener in NagaList.vue');
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('NagaList runtime.onMessage received:', request);
      console.log('Request structure:', {
        hasMessage: !!request.message,
        messageType: typeof request.message,
        keys: Object.keys(request)
      });
      
      if (request.message && typeof request.message === 'object') {
        const title = "疎通";
        console.log('Processing game data in NagaList');
        console.log('Message data structure:', {
          ver: request.message.ver,
          name: request.message.name,
          logLength: request.message.log?.length,
          hasNagaUrls: !!request.message.nagaUrls
        });
        
        try {
          fixScoreRonTileWasReachTile(request.message);
          processData(request.message);
          
          // 名前の特殊文字を全角に変換
          for (let s = 0; s < request.message.name.length; s++) {
            request.message.name[s] = request.message.name[s].replace(/[!#<>"%&$*]/gi, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
          }
          
          toNagaData = soul2naga(request.message);
          console.log('Generated NAGA data:', toNagaData);
          sendResponse(title);
        } catch (error) {
          console.error('Error processing data:', error);
          sendResponse('Error: ' + error.message);
        }
      } else {
        console.warn('Invalid message format received:', request);
        sendResponse('Invalid format');
      }
    });

    // content-scriptに通信して牌譜を送信させる
    onMounted(() => {
      console.log('NagaList mounted, sending tabNaga message to content script');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'tabNaga' }, (response) => {
          console.log('tabs.sendMessage response:', response);
          // レスポンスはステータス確認のみ。実際のデータはruntime.onMessageで受信
          if (!response || response.status === 'error') {
            alert('Cannot Get! Try Reload First! Error: ' + (response?.message || 'Unknown'));
            return;
          }
          console.log('Data request initiated successfully, waiting for runtime.onMessage...');
        });
      });
      
      chrome.storage.local.get("rule", (result) => {
        if (typeof result.rule !== "undefined") {
          Rule.value = result.rule;
        }
      });
    });

    return {
      Kyoku_info,
      select,
      submitNaga,
      selectAll,
      processData,
      DisplayLang,
      btn_msg,
      isChecked,
      handleRuleChange,
      Rule
    };
  },
};
</script>