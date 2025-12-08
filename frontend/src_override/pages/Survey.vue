<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b px-5 py-3">
      <h1 class="text-xl font-semibold text-gray-900">Survey</h1>
      <div class="flex space-x-4">
        <button @click="activeTab = 'question'" :class="[
          'px-3 py-2 text-sm font-medium rounded-md',
          activeTab === 'question'
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-500 hover:text-gray-700',
        ]">
          Question
        </button>
        <button @click="activeTab = 'answer'" :class="[
          'px-3 py-2 text-sm font-medium rounded-md',
          activeTab === 'answer'
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-500 hover:text-gray-700',
        ]">
          Answer
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-5">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <div class="text-gray-500">Loading survey...</div>
      </div>
      <div v-else-if="error" class="flex h-full items-center justify-center">
        <div class="text-red-500">{{ error }}</div>
      </div>

      <div v-else-if="activeTab === 'question'" class="h-full">
        <div v-if="!surveyJsonQuestion" class="flex h-full items-center justify-center">
          <div class="text-gray-500">Question not found.</div>
        </div>
        <SurveyComponent v-else :model="surveyQuestionModel" />
      </div>

      <div v-else-if="activeTab === 'answer'" class="h-full">
        <div v-if="!surveyJsonAnswer" class="flex h-full items-center justify-center">
          <div class="text-gray-500">Answer not found.</div>
        </div>
        <SurveyComponent v-else :model="surveyAnswerModel" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, watch } from 'vue'
import { Model } from 'survey-core'
import { SurveyComponent } from 'survey-vue3-ui'
import { call, usePageMeta } from 'frappe-ui'
import 'survey-core/defaultV2.min.css'

usePageMeta(() => {
  return { title: 'Survey' }
})

const loading = ref(true)
const error = ref(null)
const activeTab = ref('question')

const surveyJsonQuestion = ref(null)
const surveyJsonAnswer = ref(null)

const surveyQuestionModel = shallowRef(null)
const surveyAnswerModel = shallowRef(null)

onMounted(async () => {
  try {
    const result = await call('customizations.api.survey.get_latest_survey')
    if (result) {
      if (result.survey_json_question) {
        surveyJsonQuestion.value = JSON.parse(result.survey_json_question)
        surveyQuestionModel.value = new Model(surveyJsonQuestion.value)
      }

      if (result.survey_json_answer) {
        surveyJsonAnswer.value = JSON.parse(result.survey_json_answer)
        // For answers, we use the same question definition but populate data
        // If answer JSON is just data, we need the question definition to render it
        // Assuming survey_json_answer contains the DATA, and we use survey_json_question structure
        // If survey_json_answer contains structure AND data, we use that.
        // Based on typical usage, let's assume survey_json_answer is the DATA.
        // But the user said "create_survey should create survey with questions and results json".
        // Let's try to use question definition and set data.

        if (surveyJsonQuestion.value) {
          surveyAnswerModel.value = new Model(surveyJsonQuestion.value)
          surveyAnswerModel.value.mode = 'display'
          surveyAnswerModel.value.data = surveyJsonAnswer.value
        } else {
          // If no question definition, maybe answer json has it? Unlikely but fallback
          // Or just display raw json if we can't render
          // For now, if no question, we can't easily render answers in SurveyJS without schema
          // We will handle this by checking if we have question schema
        }
      }
    }
  } catch (e) {
    error.value = 'Failed to load survey: ' + e.message
  } finally {
    loading.value = false
  }
})
</script>
