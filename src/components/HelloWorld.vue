<script setup lang="ts">
import hljs from 'highlight.js';
import { nextTick, ref, watch } from 'vue';
import VSelect from 'vue-select';
import {
  getRandomValueFrom,
  useFieldVisibility,
  useFileSystem,
  useFiltering,
} from './HelloWorldComposers';

const randomPickingInProgress = ref(false);
const { dirNames, selectedDirname, filenames, selectedFilename, fileContent } =
  useFileSystem(randomPickingInProgress, true);

const {
  selectedFilterField,
  filterFields,
  selectedFilterValue,
  filterValues,
  selectedEntry,
} = useFiltering(fileContent, randomPickingInProgress);

const { visibleFields } = useFieldVisibility(filterFields);

const entryViewCount = ref<number>(0);
watch(selectedDirname, () => {
  entryViewCount.value = 0;
});

watch(selectedFilterValue, () => {
  entryViewCount.value++;
});

watch(selectedEntry, async () => {
  if (!selectedEntry.value.length) {
    return;
  }

  await nextTick();

  hljs.highlightAll();
});

watch(
  visibleFields,
  async () => {
    await nextTick();
    hljs.highlightAll();
  },
  { deep: true }
);

const pickFromRandomFile = ref(true);

const pickRandomly = () => {
  if (pickFromRandomFile.value) {
    randomPickingInProgress.value = true;
    selectedFilename.value = getRandomValueFrom(filenames.value);
  } else {
    selectedFilterValue.value = getRandomValueFrom(filterValues.value);
  }
};
</script>

<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <label for="dirname" class="text-black-50">Select Directory</label>
        <VSelect
          id="dirname"
          v-model="selectedDirname"
          :options="dirNames"
          :clearable="false"
        />
      </div>
      <div class="col">
        <label for="filename" class="text-black-50">Select File</label>
        <VSelect
          id="filename"
          v-model="selectedFilename"
          :options="filenames"
          :clearable="false"
          :get-option-label="(filename) => filename.replace('.', '/')"
        />
      </div>
      <div class="col">
        <label for="field" class="text-black-50">Select Filter Field</label>
        <VSelect
          id="field"
          v-model="selectedFilterField"
          :options="filterFields"
          :clearable="false"
        />
      </div>
      <div class="col">
        <label for="field-value" class="text-black-50"
          >Select Filter Value</label
        >
        <VSelect
          id="field-value"
          v-model="selectedFilterValue"
          :options="filterValues"
          :clearable="false"
        />
      </div>
    </div>

    <div class="row-cols-auto">
      <div
        v-for="visibleField in Object.keys(visibleFields)"
        :key="visibleField"
        class="form-check form-check-inline"
      >
        <input
          :id="visibleField"
          v-model="visibleFields[visibleField]"
          class="form-check-input"
          type="checkbox"
        />
        <label class="form-check-label" :for="visibleField">
          {{ visibleField }}
        </label>
      </div>
    </div>

    <div v-show="selectedEntry.length" class="row-cols-auto">
      <button class="btn btn-outline-info" @click="pickRandomly">
        Pick Randomly
      </button>

      <div class="form-check form-check-inline mx-1">
        <input
          id="pick-from-random-file"
          v-model="pickFromRandomFile"
          class="form-check-input bg-info border-info"
          type="checkbox"
        />
        <label class="form-check-label" for="pick-from-random-file">
          From Random File
        </label>
      </div>

      <span class="badge bg-info mx-1">
        viewed {{ entryViewCount }}
        {{ entryViewCount > 1 ? 'entries' : 'entry' }}
      </span>
    </div>

    <div v-if="selectedEntry.length">
      <table class="table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(field, i) in filterFields" :key="field">
            <template v-if="visibleFields[field]">
              <td>
                <var>{{ field }}</var>
              </td>
              <td>
                <template v-if="field.endsWith('sha')">
                  <code>{{ selectedEntry[i] }}</code>
                </template>
                <template
                  v-else-if="
                    field.endsWith('filename') || field.endsWith('path')
                  "
                >
                  <code>{{ selectedEntry[i] }}</code>
                </template>
                <template v-else-if="field.endsWith('url')">
                  <a :href="selectedEntry[i]" target="_blank">
                    {{ selectedEntry[i] }}
                  </a>
                </template>
                <template
                  v-else-if="field.endsWith('patch') || field.endsWith('input')"
                >
                  <pre><code class='language-diff'>{{ selectedEntry[i] }}</code></pre>
                </template>
                <template v-else-if="field.endsWith('content')">
                  <pre><code class='language-python'>{{ selectedEntry[i] }}</code></pre>
                </template>
                <template v-else-if="selectedEntry[i]?.includes('{')">
                  <pre><code class='language-json'>{{selectedEntry[i]}}</code></pre>
                </template>
                <template v-else>
                  {{ selectedEntry[i] }}
                </template>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
tr > :first-child {
  text-align: right;
}

tr > :last-child {
  text-align: left;
  padding-left: 1em;
}
</style>
