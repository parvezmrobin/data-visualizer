import axios from 'axios';
import { computed, ComputedRef, onBeforeMount, Ref, ref, watch } from 'vue';

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
  selectedFileName: Ref<string>,
  fileContent: Ref<string[][]>
) {
  const selectedFilterField = ref<string>('');
  watch(selectedFileName, () => {
    selectedFilterField.value = '';
  });
  const filterFields = computed<string[]>(() => {
    if (!fileContent.value.length) {
      return [];
    }

    return fileContent.value[0];
  });

  watch(filterFields, () => {
    // clear filter value
    selectedFilterValue.value = '';
  });

  const selectedFilterValue = ref<string>('');
  const filterValues = computed<string[]>(() => {
    if (!fileContent.value.length) {
      return [];
    }
    const fieldIndex = filterFields.value.indexOf(selectedFilterField.value);

    return fileContent.value.slice(1).map((row) => row[fieldIndex]);
  });

  const selectedEntry = computed<string[]>(() => {
    if (!fileContent.value.length) {
      return [];
    }

    const rowIndex = filterValues.value.indexOf(selectedFilterValue.value) + 1;
    return fileContent.value[rowIndex];
  });

  return {
    selectedFilterField,
    filterFields,
    selectedFilterValue,
    filterValues,
    selectedEntry,
  };
}

export function useFieldVisibility(filterFields: ComputedRef<string[]>) {
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
