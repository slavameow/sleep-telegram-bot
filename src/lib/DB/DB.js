import { PrismaClient } from '@prisma/client';
import { logger } from '../../logger.js';

export default class Database {
	constructor() {
		this.prisma = new PrismaClient();
	}

	async connect() {
		try {
			await this.prisma.$connect();
			logger.info(`СУБД подключена.`);
		} catch (error) {
			// prettier-ignore
			logger.error(`Произошла ошибка при подключении к базе данных: ${error.message}`);
		}
	}

	async disconnect() {
		try {
			await this.prisma.$disconnect();
			logger.warn('СУБД отключена.');
		} catch (error) {
			// prettier-ignore
			logger.error(`Произошла ошибка при отключении от базы данных: ${error.message}`);
		}
	}

	async query(modelName, methodName, args = {}) {
		if (!this.prisma[modelName]) {
			throw new Error(`Модель ${modelName} не найдена в PrismaClient`);
		}

		const model = this.prisma[modelName];

		if (typeof model[methodName] !== 'function') {
			// prettier-ignore
			throw new Error(`Метод ${methodName} не обнаружен в модели ${modelName}`);
		}

		try {
			return await model[methodName](args);
		} catch (error) {
			// prettier-ignore
			throw new Error(`Ошибка при выполнении метода ${methodName} для модели ${modelName}: ${error.message}`);
		}
	}
}
