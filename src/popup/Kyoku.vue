<template>
    <div class="mx-1 my-2 block max-w-sm rounded-lg border-2  bg-mjsoul-grad-dark-blue p-2 shadow-md hover:bg-gray-800"
        :class="{ 'border-gray-200': !isSelect, 'border-red-600': isSelect }">
        <div class="text-lg  text-mjsoul-text-lightblue hudetext" v-if="Language !== 1">
            {{ Ba_str[Language][Ba] }}
            {{ Kyoku_num }} 局 {{ Honba }} 本場
        </div>
        <div class="text-lg  text-mjsoul-text-lightblue hudetext" v-if="Language === 1">
            {{ Ba_str[Language][Ba] }}
            {{ Kyoku_num }}&emsp;{{ Honba }}Counter Repeat
        </div>

        <!-- Ron pattern -->
        <div v-if="result[0][0] === 'ロン和'">
            <div v-for="(r, idx) in result" :key="idx" class="flex flex-row items-end">
                <div class="text-left text-base w-1/4 hudetext text-pink-500">{{ idx === 0 ? Win_str[Language][0] : '' }}</div>
                <div class="text-center text-base text-gray-300 w-1/2 ">{{ r[1] }}</div>
                <div class="text-right text-base text-gray-300 w-1/4">+{{ r[3] }}</div>
            </div>
            <hr />
            <div class="flex flex-row items-end">
                <div class="text-left text-base w-1/4 hudetext text-purple-500">{{ Deal_str[Language] }}</div>
                <div class="text-center text-base text-gray-300 w-1/2">{{ result[0][2] }}</div>
                <div class="text-right text-base text-gray-300 w-1/4">{{ result.reduce((sum, r) => sum + r[4], 0) }}</div>
            </div>
        </div>

        <!-- Tsumo pattern -->
        <div v-if="result[0][0] === 'ツモ和'">
            <div class="flex flex-row items-end">
                <div class="text-left text-base w-1/4 hudetext text-pink-500"> {{ Win_str[Language][1] }}</div>
                <div class="text-center text-base text-gray-300 w-1/2">{{ result[0][1] }}</div>
                <div class="text-right text-base text-gray-300 w-1/4">+{{ result[0][3] }}</div>
            </div>
        </div>

        <!-- Ryukyoku pattern -->
        <div v-if="result[0][0] === '流局'">
            <div v-for="n in ((result[0].length) - 1)" :key="n" class="flex flex-row items-end">
                <div class="text-left text-base w-1/4 hudetext text-gray-300"> {{ result[0][0] }}</div>
                <div class="text-center text-base text-gray-300 w-1/2">{{ result[0][n] }}</div>
                <div class="text-right text-base text-gray-300 w-1/4">+{{ 3000 / ((result[0].length) - 1) }}</div>
            </div>
        </div>

        <!-- Others pattern -->
        <div v-if="result[0][0] !== 'ツモ和' && result[0][0] !== 'ロン和' && result[0][0] !== '流局'">
            <div class="text-left text-base w-1/4 hudetext text-gray-300"> {{ result[0][0] }}</div>
        </div>
    </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{
    Language: number;
    Ba: number;
    Kyoku_num: number;
    Honba: number;
    result: any[][]; // eslint-disable-line @typescript-eslint/no-explicit-any
    isSelect?: boolean;
}>(), {
    isSelect: false,
});

const Ba_str = [
    ["東", "南", "西", "北"],
    ["East", "South", "West", "North"],
    ["東", "南", "西", "北"],
];
const Honba_str = ["本場", "Repeat Counter", "本場"];
const Win_str = [
    ["ロン和", "ツモ和"],
    ["Ron", "Tsumo"],
    ["榮和", "自摸"],
];
const Deal_str = ["放銃", "Deal-in", "放銃"];
</script>
