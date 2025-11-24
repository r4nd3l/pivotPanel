<template>
	<div class="w-full">
		<ul class="flex flex-col items-center justify-around w-full list-none p-0 m-0 gap-2">
			<li 
				v-for="(day, index) in displayedDays" 
				:key="day.date" 
				:class="[
					'flex flex-row items-center justify-start h-[330px] w-full rounded-xl shadow-lg transition-all duration-300',
					index === 2 
						? 'bg-linear-to-r from-blue-500 to-indigo-600 border-4 border-blue-400 shadow-2xl transform scale-[1.02]' 
						: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300'
				]"
			>
				<div :class="[
					'flex flex-col items-center justify-center gap-4 h-full w-[550px] rounded-l-xl p-6',
					index === 2 
						? 'bg-white/20 backdrop-blur-sm border-r-4 border-white/30' 
						: 'bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-r-2 border-gray-300 dark:border-gray-600'
				]">
					<div class="flex items-center gap-3 mb-2">
						<i :class="[
							'mdi text-5xl',
							index === 2 ? 'mdi-calendar-star text-yellow-300' : 'mdi-calendar text-gray-500 dark:text-gray-400'
						]"></i>
						<span :class="[
							'text-5xl font-bold m-0 p-0',
							index === 2 ? 'text-white' : 'text-gray-800 dark:text-gray-100'
						]">{{ day.day_name }}</span>
					</div>
					<span :class="[
						'text-4xl font-semibold m-0 p-0',
						index === 2 ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'
					]">{{ formatDate(day) }}</span>
					<span :class="[
						'text-2xl px-4 py-2 rounded-lg font-medium',
						index === 2 
							? 'text-white bg-white/20' 
							: day.type === 'Hétköznap' 
								? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' 
								: 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
					]">{{ day.type }}</span>
				</div>
				<div class="w-full h-full text-center flex flex-col justify-center p-6">
					<div
						v-if="index === 2"
						class="mb-4 pb-4 border-b-2 border-white/30"
					>
						<div class="flex flex-row items-center justify-center gap-3 mb-2">
							<i class="mdi mdi-star-circle text-4xl text-yellow-300"></i>
							<span class="text-3xl font-bold text-white">
								{{ t("today") }}
							</span>
						</div>
						<span v-if="day.bank_holiday" class="flex items-center justify-center gap-2 text-xl text-yellow-200 bg-red-600/30 rounded-lg px-4 py-2 mt-2">
							<i class="mdi mdi-calendar-alert"></i>
							<span class="lowercase">{{ t("bank_holiday") }}: {{ day.bank_holiday }}</span>
						</span>
					</div>
					<div class="w-full h-full flex flex-col items-center justify-center gap-4">
						<div
							v-if="
								(day.day_name === t('week.monday') ||
									day.day_name === t('week.tuesday') ||
									day.day_name === t('week.friday')) &&
								!day.bank_holiday
							"
							:class="[
								'flex flex-col items-center gap-3 p-6 rounded-xl',
								index === 2 
									? 'bg-white/20 backdrop-blur-sm' 
									: 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
							]"
						>
							<div class="flex items-center gap-2 mb-2">
								<i :class="[
									'mdi text-4xl',
									index === 2 ? 'mdi-check-circle text-green-300' : 'mdi-check-circle text-green-600 dark:text-green-400'
								]"></i>
								<p :class="[
									'text-3xl font-bold',
									index === 2 ? 'text-white' : 'text-green-700 dark:text-green-400'
								]">{{ t("work_today") }}</p>
							</div>
							<div 
								v-if="day.week_type === t('week_even')"
								:class="[
									'text-4xl font-mono font-bold px-6 py-3 rounded-lg',
									index === 2 
										? 'text-white bg-blue-600/40' 
										: 'text-green-800 dark:text-green-300 bg-green-200 dark:bg-green-800/40'
								]"
							>
								07:30 - 12:00
							</div>
							<div 
								v-if="day.week_type === t('week_odd')"
								:class="[
									'text-4xl font-mono font-bold px-6 py-3 rounded-lg',
									index === 2 
										? 'text-white bg-blue-600/40' 
										: 'text-green-800 dark:text-green-300 bg-green-200 dark:bg-green-800/40'
								]"
							>
								12:30 - 17:00
							</div>
						</div>
						<div 
							v-else 
							:class="[
								'flex flex-col items-center gap-3 p-6 rounded-xl',
								index === 2 
									? 'bg-red-500/20 backdrop-blur-sm' 
									: 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'
							]"
						>
							<i :class="[
								'mdi mdi-close-circle text-5xl',
								index === 2 ? 'text-red-200' : 'text-red-500 dark:text-red-400'
							]"></i>
							<p :class="[
								'text-3xl font-bold',
								index === 2 ? 'text-white' : 'text-red-700 dark:text-red-400'
							]">{{ t("no_work_today") }}</p>
						</div>
					</div>
				</div>
			</li>
		</ul>
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
 * Find the index of the current day in the calendar array
 */
const findCurrentDayIndex = () => {
	const currentDate = getCurrentDateString();
	return props.data.calendar.findIndex((day) => day.date === currentDate);
};

/**
 * Get the 5 days to display: 2 before, today, 2 after
 */
const displayedDays = computed(() => {
	if (!props.data || !props.data.calendar || props.data.calendar.length === 0) {
		return [];
	}

	const currentIndex = findCurrentDayIndex();

	// If current day not found, return empty array
	if (currentIndex === -1) {
		return [];
	}

	// Calculate the range: 2 days before to 2 days after (5 days total)
	const startIndex = Math.max(0, currentIndex - 2);
	const endIndex = Math.min(props.data.calendar.length - 1, currentIndex + 2);

	// Get the 5 days
	const days = props.data.calendar.slice(startIndex, endIndex + 1);

	// If we don't have enough days before, pad with what we have
	if (days.length < 5 && startIndex === 0) {
		// We're at the beginning, can't get more previous days
		return days;
	}

	// If we don't have enough days after, we can't pad
	if (days.length < 5 && endIndex === props.data.calendar.length - 1) {
		return days;
	}

	// Ensure we have exactly 5 days centered on today
	if (days.length === 5) {
		return days;
	}

	// Adjust to get exactly 5 days if possible
	const targetStart = Math.max(0, currentIndex - 2);
	const targetEnd = Math.min(props.data.calendar.length - 1, targetStart + 4);
	return props.data.calendar.slice(targetStart, targetEnd + 1);
});

/**
 * Format date in Hungarian format: "Nov. 23"
 * @param {CalendarDay} day - The day object from the API
 * @returns {string} Formatted date string
 */
const formatDate = (day) => {
	// Extract day number from date string (YYYY-MM-DD format)
	const [, , dayNumber] = day.date.split("-");

	// Get abbreviated Hungarian month name (first 3 letters + period)
	const monthAbbr = day.month_name.substring(0, 3) + ".";

	return `${monthAbbr} ${dayNumber}.`;
};
</script>

<style scoped></style>
