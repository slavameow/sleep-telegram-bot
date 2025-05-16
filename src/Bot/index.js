import Database from '../lib/DB/index.js';
import Telegram from './Telegram/index.js';

import './Telegram/commands/contextLoader.js';
import './Telegram/commands/callbackLoader.js';

class BotManager {
	constructor() {
		this.telegram = new Telegram(Database.config.telegram.bot);
	}

	async start() {
		await Promise.all([this.telegram.start()]);
	}
}

export default new BotManager();
