import { Telegraf, Scenes, session } from 'telegraf';

import Bot from '../Bot.js';
import scenes from './scenes/index.js';

import HandlersTelegram from './handlers.js';
import UtilsTelegram from './utils.js';

import cron from '../../Tasks/cron.js';
import { logger } from '../../logger.js';

let instance = null;

// prettier-ignore
class TelegramBot extends Bot {
   constructor(options) {
      super();

      if (!options.token) {
         throw new Error("Отсутствует обязательный параметр 'token' для инициализации бота.");
      }

      this.instance = new Telegraf(options.token);

      this.utils = new UtilsTelegram(this.instance);
      this.handlers = new HandlersTelegram(this);

      const stage = new Scenes.Stage(scenes);
      this.instance.use(session());
      this.instance.use(stage.middleware());

      this.handlers.bind(this.instance);
      this.instance.catch((err) => {
         logger.error(`Произошла критическая ошибка: ${err.message}\n${err.stack}`);
      });

      instance = this.instance;
   }

   async start() {
      logger.info('Telegram-бот запущен.');

      await this.instance.launch({
         dropPendingUpdates: true,
      });
   }
}

export { instance };
export default TelegramBot;
