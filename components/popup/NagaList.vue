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
import { soul2naga } from "../../utils/dataConversion.js";

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
      console.log('Popup received message from content script:', request);
      
      if (request.message && request.message.log) {
        console.log('Processing game data in popup...');
        
        try {
          fixScoreRonTileWasReachTile(request.message);
          processData(request.message);
          
          // 名前の文字化け対策
          for (let s = 0; s < request.message.name.length; s++) {
            request.message.name[s] = request.message.name[s].replace(/[!#<>"%&$*]/gi, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
          }
          
          toNagaData = soul2naga(request.message, Rule.value);
          console.log('NAGA data generated successfully:', toNagaData);
          
          sendResponse({ status: 'success', message: 'Data processed successfully' });
        } catch (error) {
          console.error('Error processing game data:', error);
          sendResponse({ status: 'error', message: error.message });
        }
      } else {
        console.log('Invalid message received:', request);
        sendResponse({ status: 'error', message: 'Invalid data format' });
      }
      
      return true; // 非同期レスポンス
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
        if (!tabs[0]) {
          console.warn('No active tab found');
          return;
        }

        // 雀魂サイトかチェック
        const tab = tabs[0];
        const majsoulUrls = [
          'game.mahjongsoul.com',
          'mahjongsoul.game.yo-star.com', 
          'game.maj-soul.net',
          'game.maj-soul.com',
        ];
        
        const isMajsoulSite = majsoulUrls.some(url => tab.url && tab.url.includes(url));
        if (!isMajsoulSite) {
          console.warn('Not on Majsoul site. Current URL:', tab.url);
          alert('雀魂のページで拡張機能を使用してください。');
          return;
        }

        // WXTの推奨するメッセージング実装
        chrome.tabs.sendMessage(tab.id, { message: 'tabNaga' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Message sending failed:', chrome.runtime.lastError.message);
            
            // エラーの種類に応じた詳細なメッセージ
            const errorMsg = chrome.runtime.lastError.message;
            if (errorMsg.includes('Receiving end does not exist')) {
              alert("Content scriptが読み込まれていません。ページをリロードしてください。");
            } else if (errorMsg.includes('message port closed')) {
              console.log('Message port closed - this is normal when data is sent via runtime.sendMessage');
              // これは正常な状態 - データはruntime.onMessage.addListenerで受信される
            } else {
              alert("通信エラーが発生しました。雀魂のページが完全に読み込まれているか確認してください。");
            }
            return;
          }
          
          if (response && response.status === 'error') {
            console.error('Content script returned error:', response.message);
            alert(`エラー: ${response.message}`);
            return;
          }
          
          console.log('Successfully triggered content script. Waiting for game data...');
        });
      });
      chrome.storage.local.get("rule", (result) => {
        // join rule
        if (typeof result.rule !== "undefined") {
          Rule.value = result.rule;
        }
      });
    })


    // 段位戦以外の場合に設定するルール
    const Rule = ref('dani')
    const handleRuleChange = (event) => {
      Rule.value = event.target.value
      chrome.storage.local.set({ rule: event.target.value })
      // Vueの再読み込み
      location.reload()
    }


    // リーチ宣言牌がロンになったときの差分を修正
    function fixScoreRonTileWasReachTile(message) {
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
      const targetPointEven = message.log[i][16][2 * t - 1][message.log[i][16][2 * t][1]] === message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]]
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
      DisplayLang,
      btn_msg,
      isChecked,
      handleRuleChange,
      Rule
    };
  },
};
</script>
