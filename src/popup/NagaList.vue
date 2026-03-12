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

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed } from "vue";
import Kyoku from "@/popup/Kyoku.vue";
import { fixScoreRonTileWasReachTile, parseKyokuResult } from "@/lib/naga";
import type { TenhouMessage, KyokuResultAgari, KyokuResultDraw } from "@/lib/naga";
import { sanitizePlayerNames, soul2naga } from "@/lib/viewer";
import { useDisplayLang } from "@/composables/useDisplayLang";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface KyokuInfo {
  id: number;
  Ba: number;
  Kyoku_num: number;
  Honba: number;
  result: any[][];
  isSelect: boolean;
}

const Kyoku_info = reactive<KyokuInfo[]>([]);
let toNagaData: string[] = [];

const select = (num: number) => {
  Kyoku_info[num].isSelect = !Kyoku_info[num].isSelect;
};

const isChecked = ref(false);

const submitNaga = () => {
  const useKyokus: number[] = [];
  for (let i = 0; i < Kyoku_info.length; i++) {
    if (Kyoku_info[i].isSelect === true) {
      useKyokus.push(Kyoku_info[i].id);
    }
  }
  let URLstring = "";
  for (const useKyoku of useKyokus) {
    URLstring = `${URLstring + (toNagaData[useKyoku])}\n`;
  }
  if (isChecked.value === true) {
    const regexp = /"name":\[.+\],"rule"/g;
    URLstring = URLstring.replace(regexp, '"name":["Aさん","Bさん","Cさん","Dさん"],"rule"');
  }

  chrome.storage.local.set({ "toNagaData": URLstring });
  chrome.tabs.create({
    url: 'https://naga.dmv.nico/naga_report/order_form/'
  });
};

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
};

const btn_msg = computed(() => {
  const msg = "NP";
  const useKyokus: number[] = [];
  for (let i = 0; i < Kyoku_info.length; i++) {
    if (Kyoku_info[i].isSelect === true) {
      useKyokus.push(Kyoku_info[i].id);
    }
  }
  return (useKyokus.length * 10) + msg
});

const onMessageListener = (request: any, _sender: any, sendResponse: (response: string) => void) => {
  const title = "疎通";
  console.log('4.listner');
  fixScoreRonTileWasReachTile(request.message)
  request.message.name = sanitizePlayerNames(request.message.name);
  processData(request.message);
  toNagaData = soul2naga(request.message, Rule.value);
  console.log(toNagaData)
  sendResponse(title);
};

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessageListener);
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(onMessageListener);
});

const processData = (message: TenhouMessage) => {
  for (let i = 0; i < message.log.length; i++) {
    const kyoku: KyokuInfo = {
      id: i,
      Ba: ~~(message.log[i][0][0] / 4),
      Kyoku_num: (message.log[i][0][0] % 4) + 1,
      Honba: message.log[i][0][1],
      result: [],
      isSelect: false,
    };
    const parsed = parseKyokuResult(message.log[i][16]);
    if (parsed.type === "和了") {
      for (const agari of (parsed as KyokuResultAgari).agaris) {
        if (agari.isTsumo) {
          kyoku.result.push([
            "ツモ和",
            message.name[agari.winnerSeat],
            "",
            agari.deltas[agari.winnerSeat],
            ""
          ]);
        } else {
          kyoku.result.push([
            "ロン和",
            message.name[agari.winnerSeat],
            message.name[agari.loserSeat],
            agari.deltas[agari.winnerSeat],
            agari.deltas[agari.loserSeat]
          ]);
        }
      }
    } else {
      const ryukyoku: any[] = [parsed.type];
      const draw = parsed as KyokuResultDraw;
      if (draw.deltas) {
        draw.deltas.forEach((score: number, index: number) => {
          if (score > 0) {
            ryukyoku.push(message.name[index])
          }
        });
      }
      kyoku.result.push(ryukyoku);
    }
    Kyoku_info.push(kyoku);
  }
};

const DisplayLang = useDisplayLang();

// onMessageリスナーより先にRule値を確定させるため、setup()直下で取得を開始する
chrome.storage.local.get("rule", (result) => {
  if (typeof result.rule !== "undefined") {
    Rule.value = result.rule as string;
  }
});

onMounted(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id!, { message: 'tabNaga' }, (content: any) => {
      if (!content) {
        alert('Cannot Get! Try Reload First!');
        return;
      }
    });
  });
});

// Based on: 雀魂の牌譜をNAGAに解析させる－完全版－ (https://lions.blue/07813) by ちぃといつ
// Licensed under Apache License 2.0
const Rule = ref('dani')

const handleRuleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  Rule.value = value;
  chrome.storage.local.set({ rule: value });
};
/* eslint-enable @typescript-eslint/no-explicit-any */
</script>
