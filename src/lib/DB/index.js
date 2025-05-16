import config from '../../DB/config.js';
import Database from './DB.js';

class DatabaseManager {
	constructor() {
		this.database = new Database();
		this.config = config;
	}

	async connect() {
		await this.database.connect();
	}

	name(modelName) {
		return {
			query: async (methodName, args = []) => {
				return await this.database.query(modelName, methodName, args);
			},
		};
	}
}

export default new DatabaseManager();
