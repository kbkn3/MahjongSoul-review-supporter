<template>
    <div class="mx-1 my-2 block max-w-sm rounded-lg border-2  bg-mjsoul-grad-dark-blue p-2 shadow-md hover:bg-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
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
            <div v-if="result.length == 1" class="flex flex-row items-end">
                <div class="text-left text-base w-1/4 hudetext text-pink-500">{{ Win_str[Language][0] }}</div>
                <div class="text-center text-base text-gray-300 w-1/2 ">{{ result[0][1] }}</div>
                <div class="text-right text-base text-gray-300 w-1/4">+{{ result[0][3] }}</div>
            </div>
            <div v-if="result.length == 2">
                <div class="flex flex-row items-end">
                    <div class="text-left text-base w-1/4 hudetext text-pink-500">{{ Win_str[Language][0] }}</div>
                    <div class="text-center text-base text-gray-300 w-1/2 ">{{ result[0][1] }}</div>
                    <div class="text-right text-base text-gray-300 w-1/4">+{{ result[0][3] }}</div>
                </div>
                <div class="flex flex-row items-end">
                    <div class="text-left text-base w-1/4 hudetext text-pink-500"></div>
                    <div class="text-center text-base text-gray-300 w-1/2 ">{{ result[1][1] }}</div>
                    <div class="text-right text-base text-gray-300 w-1/4">+{{ result[1][3] }}</div>
                </div>
            </div>
            <div v-if="result.length == 3">
                <div class="flex flex-row items-end">
                    <div class="text-left text-base w-1/4 hudetext text-pink-500">{{ Win_str[Language][0] }}</div>
                    <div class="text-center text-base text-gray-300 w-1/2 ">{{ result[0][1] }}</div>
                    <div class="text-right text-base text-gray-300 w-1/4">+{{ result[0][3] }}</div>
                </div>
                <div class="flex flex-row items-end">
                    <div class="text-left text-base w-1/4 hudetext text-pink-500"></div>
                    <div class="text-center text-base text-gray-300 w-1/2 ">{{ result[1][1] }}</div>
                    <div class="text-right text-base text-gray-300 w-1/4">+{{ result[1][3] }}</div>
                </div>
                <div class="flex flex-row items-end">
                    <div class="text-left text-base w-1/4 hudetext text-pink-500"></div>
                    <div class="text-center text-base text-gray-300 w-1/2 ">{{ result[2][1] }}</div>
                    <div class="text-right text-base text-gray-300 w-1/4">+{{ result[2][3] }}</div>
                </div>
            </div>
            <hr />
            <div class="flex flex-row items-end">
                <div class="text-left text-base w-1/4 hudetext text-purple-500">{{ Deal_str[Language] }}</div>
                <div class="text-center text-base text-gray-300 w-1/2">{{ result[0][2] }}</div>
                <div v-if="result.length == 1" class="text-right text-base text-gray-300 w-1/4">{{ result[0][4] }}</div>
                <div v-if="result.length == 2" class="text-right text-base text-gray-300 w-1/4">{{ result[0][4]+result[1][4] }}</div>
                <div v-if="result.length == 3" class="text-right text-base text-gray-300 w-1/4">{{ result[0][4]+result[1][4]+result[2][4] }}</div>
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
<script>

export default {
    props: {
        Language: { type: Number, },
        Ba: { type: Number, },//場風
        Kyoku_num: { type: Number },//局数
        Honba: { type: Number, },//本場
        result: { type: Array, },
        isSelect: {
            type: Boolean,
            default: false,
        }
    },
    // eslint-disable-next-line no-unused-vars
    setup(_props, _context) {
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
        return {
            Ba_str, Honba_str, Win_str, Deal_str
        }
    },
};
</script>
