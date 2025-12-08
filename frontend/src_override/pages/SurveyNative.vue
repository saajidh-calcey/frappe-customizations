<template>
    <div class="flex h-full flex-col">
        <div class="flex items-center justify-between border-b px-5 py-3">
            <h1 class="text-xl font-semibold text-gray-900">Survey Native</h1>
            <Button variant="solid" :loading="saving" @click="saveAnswers">
                Update
            </Button>
        </div>
        <div class="flex-1 overflow-y-auto p-5">
            <div v-if="loading" class="flex h-full items-center justify-center">
                <div class="text-gray-500">Loading survey...</div>
            </div>
            <div v-else-if="error" class="flex h-full items-center justify-center">
                <div class="text-red-500">{{ error }}</div>
            </div>
            <div v-else-if="!surveyData" class="flex h-full items-center justify-center">
                <div class="text-gray-500">No survey found.</div>
            </div>

            <div v-else class="mx-auto max-w-3xl space-y-6">
                <h2 class="text-2xl font-bold text-gray-900">{{ surveyTitle }}</h2>

                <div v-for="element in elements" :key="element.name" class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">
                        {{ element.title || element.name }}
                    </label>

                    <!-- Text / Comment / Date -->
                    <FormControl v-if="['text', 'comment'].includes(element.type)"
                        :type="element.type === 'comment' ? 'textarea' : (element.inputType || 'text')"
                        v-model="answers[element.name]" :placeholder="element.placeholder" />

                    <!-- Dropdown -->
                    <FormControl v-else-if="element.type === 'dropdown'" type="select" :options="getOptions(element)"
                        v-model="answers[element.name]" />

                    <!-- Boolean -->
                    <div v-else-if="element.type === 'boolean'" class="flex items-center space-x-2">
                        <input type="checkbox" :id="element.name" v-model="answers[element.name]"
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span class="text-sm text-gray-600">{{ element.label || 'Yes' }}</span>
                    </div>

                    <!-- Checkbox -->
                    <div v-else-if="element.type === 'checkbox'" class="space-y-2">
                        <div v-for="choice in element.choices" :key="choice" class="flex items-center space-x-2">
                            <input type="checkbox" :value="choice" v-model="answers[element.name]"
                                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="text-sm text-gray-700">{{ choice }}</span>
                        </div>
                    </div>

                    <!-- Radiogroup -->
                    <div v-else-if="element.type === 'radiogroup'" class="space-y-2">
                        <div v-for="choice in element.choices" :key="choice" class="flex items-center space-x-2">
                            <input type="radio" :name="element.name" :value="choice" v-model="answers[element.name]"
                                class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="text-sm text-gray-700">{{ choice }}</span>
                        </div>
                    </div>

                    <!-- Rating -->
                    <div v-else-if="element.type === 'rating'" class="flex space-x-2">
                        <button v-for="i in (element.rateMax || 5)" :key="i" @click="answers[element.name] = i"
                            type="button" :class="[
                                'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                                answers[element.name] === i
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            ]">
                            {{ i }}
                        </button>
                    </div>

                    <!-- Ranking (Simple implementation as sortable list is complex, using text area or dropdowns might be better but let's try a simple list of selects for now or just text input for simplicity as requested 'native style') -->
                    <!-- For simplicity and robustness, rendering ranking as a list of dropdowns for 1st, 2nd, 3rd choice -->
                    <div v-else-if="element.type === 'ranking'" class="space-y-2">
                        <div v-for="(choice, index) in element.choices" :key="index"
                            class="flex items-center space-x-2">
                            <span class="w-6 text-sm font-medium text-gray-500">{{ index + 1 }}.</span>
                            <FormControl type="select" :options="getOptions(element)"
                                v-model="answers[element.name][index]" placeholder="Select..." />
                        </div>
                        <div class="text-xs text-gray-500">Note: Please select unique values for each rank.</div>
                    </div>

                    <!-- Matrix -->
                    <div v-else-if="element.type === 'matrix'" class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col"
                                        class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    </th>
                                    <th v-for="col in element.columns" :key="col" scope="col"
                                        class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {{ col }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="row in element.rows" :key="row">
                                    <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {{ row }}
                                    </td>
                                    <td v-for="col in element.columns" :key="col"
                                        class="px-3 py-2 whitespace-nowrap text-center">
                                        <input type="radio" :name="element.name + '_' + row" :value="col"
                                            v-model="answers[element.name][row]"
                                            class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="rounded-md bg-yellow-50 p-4">
                        <div class="text-sm text-yellow-700">
                            Unsupported field type: {{ element.type }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { call, FormControl, Button, usePageMeta } from 'frappe-ui'

usePageMeta(() => {
    return { title: 'Survey Native' }
})

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const surveyData = ref(null)
const answers = ref({})
const elements = ref([])
const surveyName = ref('')
const surveyTitle = ref('')

onMounted(async () => {
    try {
        const result = await call('customizations.api.survey.get_latest_survey')
        if (result) {
            surveyData.value = result
            surveyName.value = result.name

            if (result.survey_json_question) {
                const questionJson = JSON.parse(result.survey_json_question)
                surveyTitle.value = questionJson.title
                elements.value = questionJson.elements || []
            }

            if (result.survey_json_answer) {
                answers.value = JSON.parse(result.survey_json_answer)
            }

            // Initialize missing answers structures
            elements.value.forEach(el => {
                if (answers.value[el.name] === undefined) {
                    if (el.type === 'checkbox') answers.value[el.name] = []
                    else if (el.type === 'ranking') answers.value[el.name] = []
                    else if (el.type === 'matrix') answers.value[el.name] = {}
                    else answers.value[el.name] = null
                }
            })
        }
    } catch (e) {
        error.value = 'Failed to load survey: ' + e.message
    } finally {
        loading.value = false
    }
})

function getOptions(element) {
    if (!element.choices) return []
    return element.choices.map(c => ({ label: c, value: c }))
}

async function saveAnswers() {
    saving.value = true
    try {
        await call('customizations.api.survey.update_survey_answer', {
            name: surveyName.value,
            survey_json_answer: JSON.stringify(answers.value)
        })
        // Show success toast or message? For now just log
        console.log('Saved!')
    } catch (e) {
        alert('Failed to save: ' + e.message)
    } finally {
        saving.value = false
    }
}
</script>
