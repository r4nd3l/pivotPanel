<template>
	<div v-if="today" class="w-full h-full flex flex-col bg-linear-to-r from-blue-500 to-indigo-600 rounded-xl shadow-2xl border-4 border-blue-400 overflow-hidden">
		<div class="w-full text-center flex flex-col justify-between h-full p-6 overflow-y-auto">
			<div class="flex flex-col justify-start gap-4">
				<div class="shrink-0 pb-4 border-b-2 border-white/30">
					<div class="flex flex-row items-center justify-center gap-3 mb-3 flex-wrap">
						<i class="mdi mdi-calendar-star text-5xl text-yellow-300"></i>
						<span class="text-4xl font-bold text-white">{{ t("today") }}</span>
						<span class="text-4xl px-4 py-2 rounded-lg font-medium text-white bg-white/20">{{ today.day_name }}</span>
						<span class="text-4xl font-bold text-white">{{ t("today_is") }}</span>
						<span class="text-4xl px-4 py-2 rounded-lg font-medium text-white bg-white/20">{{ today.type }}</span>
					</div>
					<div class="flex flex-row items-center justify-center gap-4 mt-3">
						<span class="text-3xl font-bold text-white">{{ t("today_date") }}</span>
						<span class="text-4xl font-semibold text-blue-100">{{ formatDate(today) }}</span>
						<span class="text-4xl font-semibold text-blue-100">({{ new Date().getFullYear() }})</span>
					</div>
					<span v-if="today.bank_holiday" class="flex items-center justify-center gap-2 text-2xl text-yellow-200 bg-red-600/30 rounded-lg px-4 py-2 mt-3">
						<i class="mdi mdi-calendar-alert text-3xl"></i>
						<span class="lowercase">{{ t("bank_holiday") }}: {{ today.bank_holiday }}</span>
					</span>
				</div>
				<div class="w-full flex flex-col items-center justify-start gap-4 shrink-0">
					<div
						v-for="(message, index) in visitMessages"
						:key="index"
						class="flex flex-col items-center justify-center gap-3 p-6 rounded-xl text-center shrink-0 bg-white/20 backdrop-blur-sm w-full"
					>
						<p class="text-3xl font-semibold px-4 py-3 rounded-lg text-pretty text-white bg-blue-600/40">{{ message }}</p>
					</div>
				</div>
			</div>
			<div class="mt-auto pt-4 shrink-0 flex flex-col gap-3 rounded-xl p-4 bg-white/10 backdrop-blur-sm border border-white/20">
				<div class="flex items-center gap-3" v-if="today.medicine">
					<i class="mdi mdi-pill text-4xl text-pink-300"></i>
					<span class="text-3xl font-medium text-white/90">{{ today.medicine }}</span>
				</div>
				<div class="flex items-center gap-3" v-if="today.hand_creme">
					<i class="mdi mdi-hand-heart text-4xl text-amber-300"></i>
					<span class="text-3xl font-medium text-white/90">{{ today.hand_creme }}</span>
				</div>
				<div class="flex items-center gap-3" v-if="today.phone">
					<i class="mdi mdi-cellphone-check text-4xl text-cyan-300"></i>
					<span class="text-3xl font-medium text-white/90">{{ today.phone }}</span>
				</div>
				<div class="flex items-center gap-3" v-if="today.lunch">
					<i class="mdi mdi-food text-4xl text-green-300"></i>
					<span class="text-3xl font-medium text-white/90">{{ today.lunch }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getCurrentDateString } from "../utils/dateUtils.js";
/** @typedef {import('../types/schedule.js').CalendarDay} CalendarDay */
/** @typedef {import('../types/schedule.js').ScheduleApiResponse} ScheduleApiResponse */

const { t } = useI18n();

const props = defineProps({
	/** @type {ScheduleApiResponse} */
	data: {
		type: Object,
		required: true,
	},
});

/** @type {readonly (keyof CalendarDay)[]} */
const VISIT_FIELDS = [
	"magdi_day",
	"adrienn_beforenoon",
	"adrienn_afternoon",
	"ildiko",
];

/**
 * Today's calendar entry
 */
const today = computed(() => {
	if (!props.data || !props.data.calendar || props.data.calendar.length === 0) {
		return null;
	}
	const currentDate = getCurrentDateString();
	return props.data.calendar.find((day) => day.date === currentDate) ?? null;
});

const visitMessages = computed(() => {
	const day = today.value;
	if (!day) return [];
	return VISIT_FIELDS
		.map((field) => {
			const value = day[field];
			return typeof value === "string" ? value.trim() : "";
		})
		.filter(Boolean);
});

/**
 * Format date in Hungarian format: "Feb. 14."
 * @param {CalendarDay} day
 * @returns {string}
 */
const formatDate = (day) => {
	const [, , dayNumber] = day.date.split("-");
	const monthAbbr = day.month_name.substring(0, 3) + ".";
	return `${monthAbbr} ${dayNumber}.`;
};
</script>

<style scoped></style>
