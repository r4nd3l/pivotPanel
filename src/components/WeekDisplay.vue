<template>
	<div class="w-full">
		<ul class="flex flex-col items-center justify-around w-full list-none p-0 m-0">
			<li v-for="(day, index) in displayedDays" :key="day.date" class="flex flex-row items-center justify-start h-[330px] border-t w-full">
				<div class="flex flex-col items-center justify-center gap-4 border-r border-gray-500 h-full w-[550px]">
					<span class="text-[4rem] font-semibold m-0 p-0">{{ day.day_name }}</span>
					<span class="text-[3rem] m-0 p-0">{{ formatDate(day) }}</span>
					<span class="text-[2rem] text-gray-600 m-0 p-0">{{ day.type }}</span>
				</div>
				<div class="w-full h-full text-center">
					<span
						v-if="index === 2"
						class="text-[2rem] px-4 text-center w-full flex flex-row items-center justify-center gap-2 font-bold text-blue-500 mt-1 border-b border-gray-500"
					>
						{{ t("today") }}
						<span v-if="day.bank_holiday" class="lowercase text-red-500">
							<i class="mr-1">{{ t("bank_holiday") }}:</i>
							{{ day.bank_holiday }}
						</span>
					</span>
					<div class="w-full h-full flex items-center justify-center gap-4">
						<div
							v-if="
								(day.day_name === t('week.monday') ||
									day.day_name === t('week.tuesday') ||
									day.day_name === t('week.friday')) &&
								!day.bank_holiday
							"
							class="text-[3rem] text-gray-500"
						>
							<p>{{ t("work_today") }}</p>                        
                            <div v-if="day.week_type === t('week_even')">
                                <b>07:30 - 12:00</b>
                            </div>
                            <div v-if="day.week_type === t('week_odd')">
                                <b>12:30 - 17:00</b>
                            </div>                        
						</div>
						<div v-else class="text-[3rem] text-red-500">
							{{ t("no_work_today") }}
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
