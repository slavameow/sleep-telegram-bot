import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { logger } from '../../../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getSceneFiles(directory) {
	return readdirSync(directory).filter((file) => file.endsWith('.js'));
}

async function loadScene(path) {
	try {
		const module = await import(path);

		return module.default;
	} catch (error) {
		console.log(error);
		// prettier-ignore
		logger.error(`[SCENE_LOADER] Ошибка загрузки сцены ${path}:`, error.message);
		throw new Error(`Ошибка инициализации сцены: ${path}`);
	}
}

async function loadScenes(directory) {
	const files = getSceneFiles(directory);

	// prettier-ignore
	const promises = files.map((file) =>
        loadScene(join(directory, file))
    );

	return Promise.all(promises);
}

const directory = join(__dirname, 'list');
const scenes = await loadScenes(directory);

export default scenes;
