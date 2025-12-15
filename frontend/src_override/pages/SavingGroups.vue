<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" routeName="Saving Groups" />
    </template>
    <template #right-header>
      <CustomActions v-if="savingGroupsListView?.customListActions" :actions="savingGroupsListView.customListActions" />
      <Button variant="solid" :label="__('Create')" iconLeft="plus" @click="showSavingGroupModal = true" />
    </template>
  </LayoutHeader>
  <ViewControls ref="viewControls" v-model="savingGroups" v-model:loadMore="loadMore"
    v-model:resizeColumn="triggerResize" v-model:updatedPageCount="updatedPageCount" doctype="CRM Organization" />
  <SavingGroupsListView ref="savingGroupsListView" v-if="savingGroups.data && rows.length"
    v-model="savingGroups.data.page_length_count" v-model:list="savingGroups" :rows="rows"
    :columns="savingGroups.data.columns" :options="{
      showTooltip: false,
      resizeColumn: true,
      rowCount: savingGroups.data.row_count,
      totalCount: savingGroups.data.total_count,
    }" @loadMore="() => loadMore++" @columnWidthUpdated="() => triggerResize++"
    @updatePageCount="(count) => (updatedPageCount = count)" @applyFilter="(data) => viewControls.applyFilter(data)"
    @applyLikeFilter="(data) => viewControls.applyLikeFilter(data)" @likeDoc="(data) => viewControls.likeDoc(data)"
    @selectionsChanged="
      (selections) => viewControls.updateSelections(selections)
    " />
  <div v-else-if="savingGroups.data" class="flex h-full items-center justify-center">
    <div class="flex flex-col items-center gap-3 text-xl font-medium text-ink-gray-4">
      <PeopleIcon class="h-10 w-10" />
      <span>{{ __('No {0} Found', [__('Saving Groups')]) }}</span>
      <Button :label="__('Create')" iconLeft="plus" @click="showSavingGroupModal = true" />
    </div>
  </div>
  <SavingGroupModal v-if="showSavingGroupModal" v-model="showSavingGroupModal" />
</template>
<script setup>
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import CustomActions from '@/components/CustomActions.vue'
import PeopleIcon from '@/components/Icons/PeopleIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import SavingGroupModal from '@/components/Modals/SavingGroupModal.vue'
import ViewControls from '@/components/ViewControls.vue'
import { getMeta } from '@/stores/meta'
import { formatDate, timeAgo, website } from '@/utils'
import { call } from 'frappe-ui'
import { ref, computed } from 'vue'
import SavingGroupsListView from '../components/ListViews/SavingGroupsListView.vue'

const { getFormattedPercent, getFormattedFloat, getFormattedCurrency } =
  getMeta('CRM Organization')

const savingGroupsListView = ref(null)
const showSavingGroupModal = ref(false)

// savingGroups (CRM Organization) data is loaded in the ViewControls component
const savingGroups = ref({})
const loadMore = ref(1)
const triggerResize = ref(1)
const updatedPageCount = ref(20)
const viewControls = ref(null)

const rows = computed(() => {
  if (
    !savingGroups.value?.data?.data ||
    !['list', 'group_by'].includes(savingGroups.value.data.view_type)
  )
    return []
  return savingGroups.value?.data.data.map((savingGroup) => {
    let _rows = {}
    savingGroups.value?.data.rows.forEach((row) => {
      _rows[row] = savingGroup[row]

      let fieldType = savingGroups.value?.data.columns?.find(
        (col) => (col.key || col.value) == row,
      )?.type

      if (
        fieldType &&
        ['Date', 'Datetime'].includes(fieldType) &&
        !['modified', 'creation'].includes(row)
      ) {
        _rows[row] = formatDate(
          savingGroup[row],
          '',
          true,
          fieldType == 'Datetime',
        )
      }

      if (fieldType && fieldType == 'Currency') {
        _rows[row] = getFormattedCurrency(row, savingGroup)
      }

      if (fieldType && fieldType == 'Float') {
        _rows[row] = getFormattedFloat(row, savingGroup)
      }

      if (fieldType && fieldType == 'Percent') {
        _rows[row] = getFormattedPercent(row, savingGroup)
      }

      if (row === 'organization_name') {
        _rows[row] = {
          label: savingGroup.organization_name,
          logo: savingGroup.organization_logo,
        }
      } else if (row === 'website') {
        _rows[row] = website(savingGroup.website)
      } else if (['modified', 'creation'].includes(row)) {
        _rows[row] = {
          label: formatDate(savingGroup[row]),
          timeAgo: __(timeAgo(savingGroup[row])),
        }
      }
    })
    return _rows
  })
})
</script>
