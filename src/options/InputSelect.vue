<template>
  <div class="text-base text-gray-700">
    <label>
      {{ label }}
      <select
        @change="inputHandler"
        class="block w-52 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-xs focus:outline-hidden focus:ring-primary-500 focus:border-primary-500"
        :name="label"
      >
        <option
          v-for="option in options"
          :key="option.key"
          :value="option.value"
          :selected="option.value == modelValue"
        >
          {{ option.key }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

interface SelectOption {
  key: string;
  value: string;
}

const props = defineProps<{
  label: string;
  options: SelectOption[];
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputHandler = (e: Event) => {
  emit("update:modelValue", (e.target as HTMLSelectElement).value);
};

onMounted(() => {
  emit("update:modelValue", props.options[0].value);
});
</script>
