import cron from 'node-cron';
import crypto from 'crypto';
import { DateTime } from 'luxon';

import { instance } from '../Bot/Telegram/index.js';
import { logger } from '../logger.js';
import Database from '../lib/DB/index.js';

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

// prettier-ignore
async function sendReminder(userId, message, keyboard = null) {
	try {
		const options = keyboard ? { reply_markup: keyboard } : {};

		await instance.telegram.sendMessage(userId.toString(), message, options);
		return true;
	} catch (err) {
		console.error('Ошибка при отправке напоминания:', err);
	}
}

async function getCancelKeyboard(reminderId) {
	const hash = await savePayloadHash(reminderId.toString());

	return {
		inline_keyboard: [
			[
				{
					text: '❌ Отменить напоминания',
					callback_data: `cancel$${hash}`,
				},
			],
		],
	};
}

// prettier-ignore
cron.schedule('*/1 * * * *', async () => {
	try {
		const now = DateTime.now().setZone('Asia/Vladivostok').toUTC().startOf('minute');

		const nowPlus15 = now.plus({ minutes: 15 });
		const nowPlus30 = now.plus({ minutes: 30 });

		const reminders = await Database.name('Reminder').query('findMany', {
			where: {
				time: {
					lte: nowPlus30.toJSDate(),
				},
			},
			include: {
				user: true,
			},
		});

		for (const reminder of reminders) {
			try {
				const reminderTime = DateTime.fromJSDate(reminder.time);

				if (reminderTime <= now) {
					await sendReminder(reminder.userId,`🌙 ВНИМАНИЕ! Пора ложиться спать, чтобы проснуться вовремя! 🚨`);

					await Database.name('Reminder').query('delete', {
						where: { id: reminder.id },
					});
				} else if (reminderTime <= nowPlus15 && !reminder.sent15minWarning) {
					const sent = await sendReminder(reminder.userId,
						`⏰ Через 15 минут пора спать!\n\nПодготовься ко сну, завершай дела! 🌙\n\n"Утро вечера мудренее" — и это правда! ✨`,
						await getCancelKeyboard(reminder.id)
					);
                    
                    if (sent) {
                        await Database.name('Reminder').query('update', {
                            where: { id: reminder.id },
                            data: { sent15minWarning: true },
                        });
                    }
				} else if (reminderTime <= nowPlus30 && !reminder.sent30minWarning) {
					const sent = await sendReminder(reminder.userId,
						`🕖 Через 30 минут время сна!\n\nНачинай закругляться с делами, скоро отбой! ⏳\n\nПомни: хороший сон = продуктивный день! 💪`,
						await getCancelKeyboard(reminder.id)
					);

					if (sent) {
                        await Database.name('Reminder').query('update', {
                            where: { id: reminder.id },
                            data: { sent30minWarning: true },
                        });
                    }
				}
			} catch (err) {
				console.error('Ошибка при обработке напоминания:', err);
			}
		}
	} catch (error) {
		logger.error('[SLEEP_TIME_ERROR]', error);
	}
});

// prettier-ignore
cron.schedule('0 */1 * * *', async () => {
	try {
		const rubbish = DateTime.now().minus({ hours: 2 }).toJSDate();

		const deleted = await Database.name('PayloadHash').query('deleteMany', {
			where: {
				createdAt: {
					lt: rubbish,
				},
			},
		});

		logger.info(`[HASH_CLEANUP] Удалено записей: ${deleted.count || 0}`);
	} catch (error) {
		logger.error('[HASH_CLEANUP_ERROR]', error);
	}
});

logger.info('Cron-задачи запущены.');

export default cron;
