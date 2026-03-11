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

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { parseKyokuResult, getDrawsForSeat, getDiscardsForSeat, getScoreAndBonus } from "@/lib/naga";
import type { TenhouMessage, KyokuResultAgari } from "@/lib/naga";
import { useDisplayLang } from "@/composables/useDisplayLang";

const TableText = ref("牌譜を読み込めていません");

/* eslint-disable @typescript-eslint/no-explicit-any */
const onMessageListener = (request: any) => {
  for (let s = 0; s < request.message.name.length; s++) {
    request.message.name[s] = request.message.name[s].replace(
      /[#<>"%]/gi,
      ""
    );
  }
  processData(request.message, request.message.ref);
};

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessageListener);
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(onMessageListener);
});

const processData = (message: TenhouMessage, ref_id: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TableData: any[][] = [
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

  const score: number[] = [];
  for (let j = 0; j < message.name.length; j++) {
    TableData[j + 1][0] = ref_id;
    TableData[j + 1][1] = message.name[j];
    const { score: rawScore, bonus } = getScoreAndBonus(message.sc, j);
    TableData[j + 1][2] = rawScore;
    TableData[j + 1][10] = message.log.length;
    score.push(bonus);
  }
  const sorted = score.slice().sort((a, b) => b - a);
  const ranks = score.slice().map((x) => sorted.indexOf(x) + 1);
  for (let k = 0; k < 4; k++) {
    TableData[k + 1][3] = ranks[k];
  }

  for (let i = 0; i < message.log.length; i++) {
    const parsed = parseKyokuResult(message.log[i][16]);
    if (parsed.type === "和了") {
      for (const agari of (parsed as KyokuResultAgari).agaris) {
        TableData[agari.winnerSeat + 1][4]++;
        if (agari.isTsumo) {
          TableData[agari.winnerSeat + 1][8]++;
        } else {
          TableData[agari.winnerSeat + 1][9]++;
          TableData[agari.loserSeat + 1][5]++;
        }
      }
    } else {
      for (let s = 0; s < 4; s++) {
        TableData[s + 1][11]++;
      }
    }
    for (let s = 0; s < 4; s++) {
      if (
        getDrawsForSeat(message.log[i], s).filter(RegExp.prototype.test, /[.*(c|p).*]/).length
      ) {
        TableData[s + 1][7]++;
      }
      if (
        getDiscardsForSeat(message.log[i], s).filter(RegExp.prototype.test, /[.*r.*]/).length
      ) {
        TableData[s + 1][6]++;
      }
    }
  }

  let text = ""
  for (let a = 1; a < TableData.length; a++) {
    text += `${TableData[a].join('\t')}\n`;
  }
  TableText.value = text;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const DisplayLang = useDisplayLang();
const description = ["Excelやスプレッドシートにコピペできる戦績です。", "The results can be copied and pasted into Excel or spreadsheets.", "结果可以被复制并粘贴到Excel或电子表格中。"];
const descriptionColumn = ["ゲームID,名前,素点,順位,和了,放銃,立直,副露,ツモ,ロン,局数,流局数",
  "gameID,name,Table Points,rank,num of Win,num of Deal-in,num of riichi,num of meld,num of Tsumo,num of Ron,num of game,num of exhaustive",
  "gameID,帐户名,标准分之和,名次,和了数,放銃数,立直数,副露数,自摸数,榮和数,局数,荒牌数"];
</script>
