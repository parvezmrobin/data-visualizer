import axios from 'axios';
import { computed, onBeforeMount, Ref, ref, watch } from 'vue';

export function useFileSystem() {
  const dirNames = ref<string[]>([]);
  const selectedDirname = ref<string>('');
  onBeforeMount(async () => {
    const dirnameResp = await axios.get<string[]>(
      `${location.origin.replace(/:(\d+)/, ':5000')}/directories`
    );
    dirNames.value = dirnameResp.data;
  });

  const filenames = ref<string[]>([]);
  const selectedFilename = ref<string>('');
  watch(selectedDirname, async () => {
    const filenameResp = await axios.get<string[]>(
      `${location.origin.replace(/:(\d+)/, ':5000')}/${
        selectedDirname.value
      }/files`
    );
    filenames.value = filenameResp.data;
    selectedFilename.value = '';
  });

  const fileContent = ref<string[][]>([]);
  watch(selectedFilename, async () => {
    if (!selectedFilename.value.length) {
      return;
    }
    const contentResp = await axios.get<string[][]>(
      `${location.origin.replace(/:(\d+)/, ':5000')}/${selectedDirname.value}/${
        selectedFilename.value
      }`
    );
    fileContent.value = contentResp.data;
  });

  return {
    dirNames,
    selectedDirname,
    filenames,
    selectedFilename,
    fileContent,
  };
}

export function useFiltering(
  fileContent: Ref<string[][]>,
  randomPickingInProgress: Ref<boolean>
) {
  const filterFields = ref<string[]>([]);
  const selectedFilterField = ref<string>('');
  const selectedEntry = ref<string[]>([]);

  watch(fileContent, () => {
    if (randomPickingInProgress.value) {
      return;
    }

    // if random selection is NOT ongoing, reset filter-fields
    if (!fileContent.value.length) {
      filterFields.value = [];
    } else if (
      JSON.stringify(filterFields.value.sort()) !==
      JSON.stringify(fileContent.value[0].sort())
    ) {
      // update only if the field-list is updated
      filterFields.value = fileContent.value[0];
      selectedFilterField.value = '';
    }
  });

  const selectedFilterValue = ref<string>('');

  const filterValues = computed<string[]>(() => {
    if (!fileContent.value.length || !selectedFilterField.value) {
      return [];
    }
    const fieldIndex = filterFields.value.indexOf(selectedFilterField.value);
    return fileContent.value.slice(1).map((row) => row[fieldIndex]);
  });

  watch(filterValues, () => {
    if (randomPickingInProgress.value) {
      selectedFilterValue.value = getRandomValueFrom(filterValues.value);
      randomPickingInProgress.value = false;
    } else {
      selectedFilterValue.value = '';
    }
  });

  watch(selectedFilterValue, () => {
    if (!selectedFilterValue.value) {
      selectedEntry.value = [];
    } else {
      const rowIndex = filterValues.value.indexOf(selectedFilterValue.value);
      selectedEntry.value = fileContent.value[rowIndex + 1];
    }
  });

  return {
    selectedFilterField,
    filterFields,
    selectedFilterValue,
    filterValues,
    selectedEntry,
  };
}

export function useFieldVisibility(filterFields: Ref<string[]>) {
  const visibleFields = ref<Record<string, boolean>>({});
  watch(filterFields, () => {
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
  return { visibleFields };
}

export function getRandomValueFrom<T>(list: T[]): T {
  const randomIndex = Math.floor(Math.random() * list.length);
  const randomValue = list[randomIndex];
  return randomValue;
}
