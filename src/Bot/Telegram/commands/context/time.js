import TextCommand from '../../TextCommand.js';
import Database from '../../../../lib/DB/index.js';
import { logger } from '../../../../logger.js';

import crypto from 'crypto';
import { Markup } from 'telegraf';
import { format } from '@gramio/format';

const PHASE = 80;
const CYCLE = 24 * 60;

function generateHash(length = 16) {
	return crypto.randomBytes(length).toString('hex');
}

async function savePayloadHash(data) {
	const hash = generateHash();

	await Database.name('PayloadHash').query('create', {
		data: {
			hash,
			data,
		},
	});

	return hash;
}

function normalizeTime(time) {
	if (time < 0) {
		return CYCLE + time;
	} else if (time >= CYCLE) {
		return time - CYCLE;
	}

	return time;
}

function formatTime(time) {
	const hours = Math.floor(time / 60);
	const minutes = time % 60;

	// prettier-ignore
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function parseTime(text) {
	const parts = text.split(':');

	if (parts.length !== 2) {
		throw new Error('Неверный формат времени');
	}

	const h = parseInt(parts[0], 10);
	const m = parseInt(parts[1], 10);

	if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
		throw new Error('Неверный формат времени');
	}

	return h * 60 + m;
}

// prettier-ignore
new TextCommand({
	trigger: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
	message_type: ['pm'],
	func: async (context) => {
		try {
			const timeText = context.update.message.text;
			const awake = parseTime(timeText);
			const sleepBase = normalizeTime(awake - PHASE * 5);

			const times = [];
			for (let i = -3; i <= 2; i++) {
				times.push(normalizeTime(sleepBase - PHASE * i));
			}

			times.sort((a, b) => {
				const firstDiff = normalizeTime(a - awake);
				const secondDiff = normalizeTime(b - awake);

				return firstDiff - secondDiff;
			});

			const formattedTimes = times.map(formatTime);

			const firstRow = await Promise.all(
				formattedTimes.slice(0, 3).map(async (time) => {
					const hash = await savePayloadHash(time);
					return Markup.button.callback(time, `time$${hash}`);
				})
			);

			const secondRow = await Promise.all(
				formattedTimes.slice(3, 6).map(async (time) => {
					const hash = await savePayloadHash(time);
					return Markup.button.callback(time, `time$${hash}`);
				})
			);

			const keyboard = Markup.inlineKeyboard([firstRow, secondRow]);

			return context.reply(format`
				🛏 <b>Лучшее время, чтобы лечь спать, если хочешь проснуться в ${timeText}:</b>
				Выбери удобное время нажатием на кнопку ниже:`, 
			{ reply_markup: keyboard.reply_markup, disable_notification: true, parse_mode: 'HTML'});
		} catch (error) {
			logger.error('Ошибка в калькуляторе сна:', error);
			return context.reply('❗️ Ошибка! Пожалуйста, введи время в формате ЧЧ:ММ, например: 07:00', {
                disable_notification: true,
            });
		}
	},
	source: 'bot',
});
