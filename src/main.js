import Bot from './Bot/index.js';
import Database from './lib/DB/index.js';

import { logger } from './logger.js';

// prettier-ignore
async function main() {
	try {
        Bot.start()

		await Promise.all([
	        Database.connect(),
        ])
		
		logger.info(`Чат-бот успешно проинициализирован.`);
	} catch (error) {
		logger.error(`При инициализации чат-бота произошла ошибка: ${error.message}. Стек вызовов: ${error.stack}`);
	}
}

main();
