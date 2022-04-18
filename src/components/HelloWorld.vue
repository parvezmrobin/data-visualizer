<script setup lang="ts">
import hljs from 'highlight.js';
import { nextTick, ref, watch } from 'vue';
import VSelect from 'vue-select';
import {
  useFieldVisibility,
  useFileSystem,
  useFiltering,
} from './HelloWorldComposers';

const { dirNames, selectedDirname, filenames, selectedFilename, fileContent } =
  useFileSystem();

const {
  selectedFilterField,
  filterFields,
  selectedFilterValue,
  filterValues,
  selectedEntry,
} = useFiltering(selectedFilename, fileContent);

const { visibleFields } = useFieldVisibility(filterFields);

const entryViewCount = ref<number>(0);
watch(selectedFilename, () => {
  entryViewCount.value = 0;
});

watch(selectedFilterValue, () => {
  entryViewCount.value++;
});

watch([selectedEntry, visibleFields], async () => {
  if (!selectedEntry.value.length) {
    return;
  }

  await nextTick();

  hljs.highlightAll();
});

const pickRandomly = () => {
  const randomIndex = Math.floor(Math.random() * filterValues.value.length);
  const randomValue = filterValues.value[randomIndex];
  selectedFilterValue.value = randomValue;
};
</script>

<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="form-floating">
          <select
            id="dirname"
            v-model="selectedDirname"
            name="dirname"
            class="form-control"
          >
            <option v-for="dirname in dirNames" :key="dirname" :value="dirname">
              {{ dirname }}
            </option>
          </select>
          <label for="dirname">Select Directory</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <select
            id="filename"
            v-model="selectedFilename"
            name="filename"
            class="form-control"
          >
            <option
              v-for="filename in filenames"
              :key="filename"
              :value="filename"
            >
              {{ filename.replace('.', '/') }}
            </option>
          </select>
          <label for="filename">Select File</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <select
            id="field"
            v-model="selectedFilterField"
            name="field"
            class="form-control"
          >
            <option
              v-for="fieldName in filterFields"
              :key="fieldName"
              :value="fieldName"
            >
              {{ fieldName }}
            </option>
          </select>
          <label for="field">Select Filter Field</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <VSelect
            id="field-value"
            v-model="selectedFilterValue"
            placeholder="Select Filter Value"
            :options="filterValues"
            :clearable="false"
          />
        </div>
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

    <div v-show="filterValues.length" class="row-cols-auto">
      <button class="btn btn-outline-info" @click="pickRandomly">
        Pick Randomly
      </button>

      <span class="badge bg-info mx-1">
        viewed {{ entryViewCount }}
        {{ entryViewCount > 1 ? 'entries' : 'entry' }}
      </span>
    </div>

    <div v-show="filterFields.length">
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
                <template v-else-if="field.endsWith('patch')">
                  <pre><code class='language-diff'>{{ selectedEntry[i] }}</code></pre>
                </template>
                <template v-else-if="field.endsWith('content')">
                  <pre><code class='language-python'>{{ selectedEntry[i] }}</code></pre>
                </template>
                <template v-else-if="selectedEntry[i].includes('{')">
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
