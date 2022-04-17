<script setup lang="ts">
import axios from 'axios';
import hljs from 'highlight.js';
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';
import VSelect from 'vue-select';

const dirNames = ref<string[]>([]);
const filenames = ref<string[]>([]);
const selectedDirname = ref<string>('');
const selectedFilename = ref<string>('');

const fileContent = ref<string[][]>([]);

const selectedFilterField = ref<string>('');
const visibleFields = ref<Record<string, boolean>>({});
const filterFields = computed<string[]>(() => {
  if (!fileContent.value.length) {
    return [];
  }

  return fileContent.value[0];
});

watch(filterFields, () => {
  // clear filter value
  selectedFilterValue.value = '';

  // update visible field list
  const newVisibleFields: Record<string, boolean> = {};
  for (const filterField of filterFields.value) {
    if (!(filterField in visibleFields.value)) {
      // if this field is newly introduced, show it
      newVisibleFields[filterField] = true;
    } else {
      // otherwise, keep previous settings
      newVisibleFields[filterField] = visibleFields.value[filterField];
    }
  }

  visibleFields.value = newVisibleFields;
});

const filterValues = computed<string[]>(() => {
  if (!fileContent.value.length) {
    return [];
  }
  const fieldIndex = filterFields.value.indexOf(selectedFilterField.value);

  return fileContent.value.slice(1).map((row) => row[fieldIndex]);
});
const selectedFilterValue = ref<string>('');

const selectedEntry = computed<string[]>(() => {
  if (!fileContent.value.length) {
    return [];
  }

  const rowIndex = filterValues.value.indexOf(selectedFilterValue.value) + 1;
  return fileContent.value[rowIndex];
});

watch([selectedEntry, visibleFields], async () => {
  if (!selectedEntry.value.length) {
    return;
  }

  await nextTick();

  hljs.highlightAll();
});

onBeforeMount(async () => {
  const dirnameResp = await axios.get<string[]>(
    `${location.origin.replace(/:(\d+)/, ':5000')}/directories`
  );
  dirNames.value = dirnameResp.data;
});

watch(selectedDirname, async () => {
  const filenameResp = await axios.get<string[]>(
    `${location.origin.replace(/:(\d+)/, ':5000')}/${
      selectedDirname.value
    }/files`
  );
  filenames.value = filenameResp.data;
  selectedFilename.value = '';
});

watch(selectedFilename, async () => {
  const contentResp = await axios.get<string[][]>(
    `${location.origin.replace(/:(\d+)/, ':5000')}/${selectedDirname.value}/${
      selectedFilename.value
    }`
  );
  fileContent.value = contentResp.data;
  selectedFilterField.value = '';
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
