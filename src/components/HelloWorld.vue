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
const {
  dirNames,
  selectedDirname,
  filenames,
  selectedFilename,
  fileContent,
  updateFile,
} = useFileSystem(randomPickingInProgress, true);

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

const isNumber = ref(false);
const minimumFilter = ref(0);
const maximumFilter = ref(0);

watch(isNumber, async () => {
  if (isNumber.value === pickFromRandomFile.value) {
    await nextTick();
    isNumber.value = !isNumber.value;
  }
});

const pickFromRandomFile = ref(true);

const pickRandomly = () => {
  if (pickFromRandomFile.value) {
    randomPickingInProgress.value = true;
    selectedFilename.value = getRandomValueFrom(filenames.value);
  } else {
    let values: string[];
    if (isNumber.value && minimumFilter.value && maximumFilter.value) {
      values = filterValues.value
        .map(Number.parseFloat)
        .filter(
          (val) => val >= minimumFilter.value && val <= maximumFilter.value
        )
        .map((val) => val.toString());
    } else {
      values = filterValues.value;
    }
    selectedFilterValue.value = getRandomValueFrom(values);
  }
};

const selectedEditField = ref('');
function selectNextEntry() {
  const idx = filterValues.value.indexOf(selectedFilterValue.value);
  if (idx === filterValues.value.length - 1) {
    alert(
      'You have reached the end of the file. Consider saving the file to the server'
    );
    return;
  }
  selectedFilterValue.value = filterValues.value[idx + 1];
}
async function saveInServer() {
  const ok = confirm('Are you sure to save the file in server?');
  if (!ok) {
    return;
  }

  await updateFile();

  alert('File content updated in serve');
}
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

    <div v-show="selectedEntry.length" class="row">
      <div class="col">
        <button class="btn btn-outline-info" @click="pickRandomly">
          Pick Randomly
        </button>

        <div class="form-check form-check-inline mx-1">
          <input
            id="pick-from-random-file"
            v-model="pickFromRandomFile"
            class="form-check-input border-info"
            type="checkbox"
          />
          <label class="form-check-label" for="pick-from-random-file">
            From Random File
          </label>
        </div>

        <div class="form-check form-check-inline mx-1">
          <input
            id="is-number"
            v-model="isNumber"
            name="is-number"
            class="form-check-input border-info"
            type="checkbox"
          />
          <label for="is-number" class="form-check-label">
            With numeric condition
          </label>
        </div>

        <div v-if="isNumber" class="d-inline-flex" style="width: 200px">
          <div class="input-group input-group-sm">
            <input
              v-model="minimumFilter"
              type="number"
              class="form-control"
              placeholder="Minimum"
            />
            <span class="input-group-text">≤ value ≤</span>
            <input
              v-model="maximumFilter"
              type="number"
              class="form-control"
              placeholder="Maximum"
            />
          </div>
        </div>

        <span class="badge bg-info mx-1">
          viewed {{ entryViewCount }}
          {{ entryViewCount > 1 ? 'entries' : 'entry' }}
        </span>
      </div>
      <div v-if="selectedFilename.endsWith('.csv')" class="col-3 ms-auto">
        <div class="">
          <label for="field-value" class="text-black-50">
            Select Edit Field
          </label>
          <VSelect
            id="field-value"
            v-model="selectedEditField"
            :options="filterFields"
            :clearable="false"
          />
        </div>
      </div>
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
                <div v-if="field === selectedEditField" class="input-group">
                  <input
                    v-model="selectedEntry[i]"
                    type="text"
                    class="form-control"
                  />
                  <button class="btn btn-outline-info" @click="selectNextEntry">
                    Next
                  </button>
                  <button class="btn btn-outline-warning" @click="saveInServer">
                    Save File In Server
                  </button>
                </div>
                <code v-else-if="field.endsWith('sha')">{{
                  selectedEntry[i]
                }}</code>
                <code
                  v-else-if="
                    field.endsWith('filename') || field.endsWith('path')
                  "
                  >{{ selectedEntry[i] }}</code
                >
                <a
                  v-else-if="field.endsWith('url')"
                  :href="selectedEntry[i]"
                  target="_blank"
                >
                  {{ selectedEntry[i] }}
                </a>

                <pre
                  v-else-if="
                    field.endsWith('patch') ||
                    field.startsWith('diff') ||
                    field.endsWith('input')
                  "
                >
                  <code class='language-diff'>{{ selectedEntry[i] }}</code>
                </pre>
                <pre
                  v-else-if="field.endsWith('content') || field == 'context'"
                ><code class='language-python'>{{ selectedEntry[i] }}</code></pre>
                <pre
                  v-else-if="
                    selectedEntry[i]?.startsWith('{') ||
                    selectedEntry[i]?.startsWith('[')
                  "
                ><code class='language-json'>{{ selectedEntry[i] }}</code></pre>
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

.form-check-input.border-info:checked {
  background-color: var(--bs-info);
}
</style>
