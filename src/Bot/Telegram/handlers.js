import Database from '../../lib/DB/index.js';

import { format } from '@gramio/format';

class HandlersTelegram {
	constructor(bot) {
		this.bot = bot;
		this.Database = Database;

		this.botInfo = null;
		this.loadBotInfo();
	}

	async loadBotInfo() {
		this.botInfo = await this.bot.instance.telegram.getMe();
	}

	async getState(context) {
		const user = await this.bot.utils.getUserData(context.from.id);
		//	prettier-ignore
		const isAdmin = Database.config.admins.telegram.includes(context.from.id);

		const state = {
			user: {
				...user,
				isAdmin,
			},
		};

		return state;
	}

	async message(context) {
		const message = context.message;

		const text = message.text || message.caption || '';
		const cmd = this.cleanCommand(text, message.entities);

		const command = this.bot.utils.textCommands.find(cmd, 'bot');

		if (command) {
			const state = await this.getState(context);

			if (!state) {
				throw new Error('Пользователь не найден');
			}

			context.state = {
				...state,
			};

			return command.execute(context, this.bot);
		}

		// prettier-ignore
		if (message.chat.type === 'private') {
			return context.reply(format`
				➡️ Чтобы рассчитать <b>оптимальное время для сна</b>, просто напиши, <b>во сколько ты хочешь проснуться</b> 
				(например, <code>07:30</code> или <code>23:00</code>).
			`, { parse_mode: 'HTML', disable_notification: true });
		}
	}

	cleanCommand(text, entities = []) {
		if (!text) {
			return '';
		}

		// prettier-ignore
		if (entities.some((e) => e.type === 'bot_command' || e.type === 'mention')) {
			return text.replace(`@${this.botInfo.username}`, '').trim();
		}

		return text.trim();
	}

	async callbackQuery(context) {
		const query = context.callbackQuery;

		if (!query?.data || query.from?.is_bot) {
			return;
		}

		const [action, eventId] = query.data.split('$');

		// prettier-ignore
		const command = this.bot.utils.callbackCommands.find(action, 'bot');

		if (command) {
			const state = await this.getState(context);

			if (!state) {
				throw new Error('Пользователь не найден');
			}

			context.state = {
				...state,
				eventId,
			};

			await command.execute(context, this.bot);
		}
	}

	bind(updates) {
		updates.on('message', this.message.bind(this));
		updates.on('callback_query', this.callbackQuery.bind(this));
	}
}

export default HandlersTelegram;
