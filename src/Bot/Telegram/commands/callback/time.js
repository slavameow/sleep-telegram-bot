import CallbackCommand from '../../CallbackCommand.js';
import Database from '../../../../lib/DB/index.js';
import { logger } from '../../../../logger.js';

import { format } from '@gramio/format';
import { DateTime } from 'luxon';

function parseTimeToDate(time) {
	const [h, m] = time.split(':').map(Number);
	const now = DateTime.now().setZone('Asia/Vladivostok');

	let target = now.set({ hour: h, minute: m, second: 0, millisecond: 0 });

	if (target <= now) {
		target = target.plus({ days: 1 });
	}

	return target.toUTC().startOf('minute').toJSDate();
}

// prettier-ignore
new CallbackCommand({
	trigger: 'time',
	message_type: ['pm'],
	func: async (context, bot) => {
		try {
			const hash = context.update.callback_query.data.replace('time$', '');

			const record = await Database.name('PayloadHash').query('findUnique', {
				where: { hash }
			});

			if (!record) {
				await context.answerCbQuery('❗️ Истёк срок действия или неверные данные');
			}

			const time = record.data;

			const userId = BigInt(context.from.id);
			const chatId = BigInt(context.chat.id);

			const timeInt = parseTimeToDate(time)
			const messageId = context.update.callback_query.message.message_id;

			await Database.name('Reminder').query('upsert', {
				where: { userId },
				update: { time: timeInt },
				create: { userId, time: timeInt },
			});

			await context.answerCbQuery(`⏰ Вы успешно сделали выбор!`);

			const messageText = format`
                <b>🌟 Отличный выбор!</b> Вы выбрали время: <i>${time}</i>. Это время, когда вы сможете спокойно отдохнуть и восстановить силы. 💤\n
                Бот обязательно напомнит вам об этом времени, чтобы вы могли лечь спать вовремя и проснуться бодрым и полным энергии! 🚀\n
                <b>Не забывайте</b>, что хороший сон — залог здоровья и отличного настроения! 😊
            `;

			return bot.instance.telegram.editMessageText(
				chatId.toString(),
				messageId,
				null,
				messageText,
				{ parse_mode: 'HTML', disable_notification: true }
			);
		} catch (error) {
			logger.error(`Произошла ошибка при выборе времени: ${error.message}`);
			await context.answerCbQuery(`❗️ Произошла ошибка! Повторите попытку позже.`);
		}
	},
	source: 'bot',
});
