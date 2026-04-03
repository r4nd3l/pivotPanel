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
						v-if="today.work === 'yes' && !today.bank_holiday"
						class="flex flex-col items-center gap-3 p-6 rounded-xl bg-white/20 backdrop-blur-sm"
					>
						<div class="flex items-center gap-2 mb-1">
							<i class="mdi mdi-check-circle text-5xl text-green-300"></i>
							<p class="text-4xl font-bold text-white">{{ t("work_today") }}</p>
						</div>
						<div
							v-if="today.week_type === t('week_even')"
							class="text-5xl font-mono font-bold px-6 py-3 rounded-lg text-white bg-blue-600/40"
						>
							07:30 - 12:00
						</div>
						<div
							v-if="today.week_type === t('week_odd')"
							class="text-5xl font-mono font-bold px-6 py-3 rounded-lg text-white bg-blue-600/40"
						>
							12:30 - 17:00
						</div>
					</div>
					<div
						v-if="marcsiText(today)"
						class="flex flex-col items-center justify-center gap-3 p-6 rounded-xl text-center shrink-0 bg-white/20 backdrop-blur-sm"
					>
						<p class="text-3xl font-semibold px-4 py-3 rounded-lg text-pretty text-white bg-blue-600/40">{{ marcsiText(today) }}</p>
					</div>
					<div
						v-if="ilonaText(today)"
						class="flex flex-col items-center justify-center gap-3 p-6 rounded-xl text-center shrink-0 bg-white/20 backdrop-blur-sm"
					>
						<p class="text-3xl font-semibold px-4 py-3 rounded-lg text-pretty text-white bg-blue-600/40">{{ ilonaText(today) }}</p>
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

/**
 * @param {CalendarDay} day
 * @returns {string}
 */
const marcsiText = (day) => {
	if (!day || typeof day !== "object") return "";
	const v = day["marcsi_day"] ?? "";
	return typeof v === "string" ? v.trim() : "";
};

/**
 * @param {CalendarDay} day
 * @returns {string}
 */
const ilonaText = (day) => {
	if (!day || typeof day !== "object") return "";
	const v = day["ilona_day"] ?? "";
	return typeof v === "string" ? v.trim() : "";
};

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
