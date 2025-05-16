import CallbackCommand from '../../CallbackCommand.js';
import Database from '../../../../lib/DB/index.js';
import { logger } from '../../../../logger.js';

// prettier-ignore
new CallbackCommand({
	trigger: 'cancel',
	message_type: ['pm'],
	func: async (context, bot) => {
		try {
			const chatId = BigInt(context.chat.id);

			const hash = context.update.callback_query.data.replace('cancel$', '');

			const record = await Database.name('PayloadHash').query('findUnique',{
				where: { hash },
			});

			if (!record) {
				await context.answerCbQuery('❗️ Истёк срок действия или неверные данные');
			
				return bot.instance.telegram.deleteMessage(
					chatId.toString(),
					context.update.callback_query.message.message_id
				)
			}

			const id = +record.data;

			const reminder = await Database.name('Reminder').query('findFirst', {
				where: { id },
			});

			if (!reminder) {
				await context.answerCbQuery('⏰ Не удалось найти напоминание.');

				return bot.instance.telegram.deleteMessage(
					chatId.toString(),
					context.update.callback_query.message.message_id
				);
			}

			await Database.name('Reminder').query('delete', {
				where: { id },
			});

			return bot.instance.telegram.editMessageText(
				chatId.toString(),
				context.update.callback_query.message.message_id,
				null,
				'⏰ Вы успешно отменили напоминание.'
			);
		} catch (error) {
			logger.error(`Ошибка при отмене напоминания`, error);
			await context.answerCbQuery(`❗️ Произошла ошибка! Повторите попытку позже.`);
		}
	},
	source: 'bot',
});
