<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    fill="none"
    viewBox="0 0 24 24"
    :stroke="iconColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: number | string;
  height?: number | string;
  iconColor?: string;
}>(), {
  width: 24,
  height: 24,
  iconColor: "currentColor",
});
</script>
