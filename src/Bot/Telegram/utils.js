import Database from '../../lib/DB/index.js';

import TextCommand from './TextCommand.js';
import CallbackCommand from './CallbackCommand.js';

import { logger } from '../../logger.js';

class TelegramUtils {
	constructor(instance) {
		this.textCommands = TextCommand.manager;
		this.callbackCommands = CallbackCommand.manager;

		this.Database = Database;
		this.config = this.Database.config;

		this.bot = instance;
	}

	// prettier-ignore
	async getUserData(userId) {
      try {
        const userData = await this.Database.name('User').query('upsert', {
            where: { id: userId },
            create: { id: userId },
            update: {},
          });

         return userData;
      } catch (error) {
         logger.error(`Не удалось выполнить операцию с пользовательскими данными: ${error.message}`);
      }
   }
}

export default TelegramUtils;
