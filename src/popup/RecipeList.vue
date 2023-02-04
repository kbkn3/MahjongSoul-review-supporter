<template>
  <div class="template-box">
    <div class="template-title">Result Output</div>
    <div class="pt-2 text-xs">
      <p class="mb-2 text-mjsoul-text-lightblue">
        {{ description[DisplayLang] }}
      </p>
      <p class="mb-2 text-mjsoul-text-lightblue">
        {{ descriptionColumn[DisplayLang] }}
      </p>
      <textarea v-model="TableText" readonly></textarea>

    </div>
  </div>
</template>

<script>
import { ref} from "vue";
export default {
  setup() {
    //牌譜データから表示用のデータを抽出したもの
    let TableText = ref("牌譜を読み込めていません");
    /**
     * content-scriptから牌譜データを受け取る
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      for (let s = 0; s < request.message.name.length; s++) {
        request.message.name[s] = request.message.name[s].replace(
          /[#<>"%]/gi,
          ""
        );
      }
      processData(request.message, request.message.ref);
    });

    /**
     * Akochan reviewerの形式になった牌譜から表示用のデータを取り出して、local storageに保存する
     * @param {*} message 牌譜データのjson
     */
    const processData = (message, ref_id) => {
      let TableData = [
        [
          "ゲームID",
          "名前",
          "素点",
          "順位",
          "和了",
          "放銃",
          "立直",
          "副露",
          "ツモ",
          "ロン",
          "局数",
          "流局",
        ],
        ["ID", "name", 25000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ["ID", "name", 25000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ["ID", "name", 25000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ["ID", "name", 25000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ];

      //固定データの記入
      let score=[];
      for (let j = 0; j < message.name.length; j++) {
        TableData[j + 1][0] = ref_id; //ゲームID
        TableData[j + 1][1] = message.name[j]; //名前
        TableData[j + 1][2] = message.sc[2 * j]; //素点
        TableData[j + 1][10] = message.log.length; //局数
        score.push(message.sc[2 * j+1]); //順位点込みのポイント
      }
      //順位計算
      let sorted = score.slice().sort(function (a, b) {
        return b - a;
      });
      let ranks = score.slice().map(function (x) {
        return sorted.indexOf(x) + 1;
      });
      for (let k = 0; k < 4; k++) {
        TableData[k + 1][3] = ranks[k];
      }

      //局ごとの値確認
      for (let i = 0; i < message.log.length; i++) {
        if (message.log[i][16][0] === "和了") {
          //和了がいる場合
          for (let t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {
            //ダブロン・トリロンに対応
            if (message.log[i][16][2 * t][0] == message.log[i][16][2 * t][1]) {
              //ツモの場合
              TableData[message.log[i][16][2 * t][0] + 1][4]++; //和了回数
              TableData[message.log[i][16][2 * t][0] + 1][8]++; //ツモ回数
            } else {
              TableData[message.log[i][16][2 * t][0] + 1][4]++; //和了回数
              TableData[message.log[i][16][2 * t][0] + 1][9]++; //ロン回数
              TableData[message.log[i][16][2 * t][1] + 1][5]++; //放銃回数
            }
          }
        } else {
          for (let s = 0; s < 4; s++) {
            TableData[s + 1][11]++; //流局回数
          }
        }
        for (let s = 0; s < 4; s++) {
          if (
            message.log[i][3 * s + 5].filter(RegExp.prototype.test, /[.*(c|p).*]/).length
          ) {
            TableData[s + 1][7]++;
          }
          if (
            message.log[i][3 * s + 6].filter(RegExp.prototype.test, /[.*r.*]/).length
          ) {
            TableData[s + 1][6]++;
          }
        }
      }

      let text = ""
      for (let a = 1; a < TableData.length; a++) {
        text += TableData[a].join('\t') + "\n";
      }
      TableText.value = text;
    };

    //表示用言語の設定をlocal storageから呼び出す
    const DisplayLang = ref(0)
    chrome.storage.local.get("DisplayLang", (result) => {
      // join langs
      if (typeof result.DisplayLang !== "undefined") {
        DisplayLang.value = result.DisplayLang;
      }
    });
    const description = ["Excelやスプレッドシートにコピペできる戦績です。", "The results can be copied and pasted into Excel or spreadsheets.", "结果可以被复制并粘贴到Excel或电子表格中。"]
    const descriptionColumn = ["ゲームID,名前,素点,順位,和了,放銃,立直,副露,ツモ,ロン,局数,流局数",
      "gameID,name,Table Points,rank,num of Win,num of Deal-in,num of riichi,num of meld,num of Tsumo,num of Ron,num of game,num of exhaustive", 
      "gameID,帐户名,标准分之和,名次,和了数,放銃数,立直数,副露数,自摸数,榮和数,局数,荒牌数"]
    return {
      processData,
      TableText,
      DisplayLang,
      description,
      descriptionColumn
    };
  },
};
</script>

<style>

</style>
