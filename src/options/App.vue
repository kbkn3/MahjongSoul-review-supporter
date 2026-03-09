<template>
  <div class="m-5">
    <div class="text-2xl text-black m-2">Mahjong Soul Review Supporter Settings Page</div>
    <div class="flex flex-wrap">
      <div class="w-full">
        <div
          class="relative flex flex-col min-w-0 break-words bg-white w-full m-2 shadow-lg rounded-sm"
        >
          <LangList></LangList>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LangList from "@/options/LangList.vue";
</script>


