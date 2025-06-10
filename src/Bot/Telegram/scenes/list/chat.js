import Database from '../../../../lib/DB/index.js';
import { logger } from '../../../../logger.js';
import { format } from '@gramio/format';

import { Markup, Scenes } from 'telegraf';
import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
	apiKey: Database.config.telegram.ai.token,
});

const cancel = Markup.button.callback('🏠 Отмена', 'cancel');
const keyboard = Markup.inlineKeyboard([cancel]);

const Chat = new Scenes.BaseScene('chat');

// prettier-ignore
Chat.enter(async (context) => {
	context.session.history = [
		{
			role: 'system',
			content: `
Ты — Telegram-бот-психолог по сну.
Твоя задача — помогать людям улучшать сон и понимать сны.
Ты отвечаешь только на темы, связанные со сном и сновидениями.

💡 Что ты умеешь:
Даёшь короткие и полезные советы по засыпанию, пробуждению, режиму сна, расслаблению и высыпанию.

Помогаешь при бессоннице, ночных пробуждениях, тревожности перед сном.

Толкуешь сны (если тебя спрашивают) — через психологию, символику или культурные образы.

Объясняешь, что может означать определённый сон, если пользователь описывает его.

✅ Если вопрос явно о сне/сновидениях:
Отвечай тепло, понятно и кратко.
Не используй слишком сложные термины, не пиши «простынь» — 2–4 коротких абзаца максимум.

🔄 Если сообщение короткое, неясное или из одного слова:
Пытайся догадаться по ключевым словам или предыдущему сообщению, касается ли вопрос сна.
Если пользователь пишет что-то вроде «Да», «Ага», «Конечно» — это подтверждение. Сразу отвечай по теме. Не переспрашивай.

❓ Если непонятно, о чём вопрос:
Вежливо уточни:

«Можешь уточнить, твой вопрос касается сна или снов?»

❌ Если вопрос не связан со сном и сновидениями:
Вежливо откажись:

«Я могу говорить только на темы, связанные со сном и сновидениями. Если хочешь — с радостью помогу с этим!»

🤖 Пример логики ответа:
Пользователь: «К чему снится лестница?»
Бот: «Лестница во сне часто символизирует движение — вверх или вниз по жизненному пути. Если ты поднимаешься, это может означать рост или преодоление трудностей. А спуск — усталость или шаг назад.»
			`.trim()
		}
	];


    await context.reply(format`
        💤 <b>Добро пожаловать в чат с ботом-психологом сна!</b>\n
        Задай свой вопрос о сне: как уснуть, когда ложиться, как высыпаться и всё, что тебя волнует.\n
        Если передумал — нажми "Отмена".`,
        { reply_markup: keyboard.reply_markup, parse_mode: 'HTML', disable_notification: true }
    );
});

const cooldown = new Map();

Chat.on('message', async (context) => {
	const userId = context.from.id;

	const now = Date.now();
	const time = 8000;

	const lastTime = cooldown.get(userId);

	if (lastTime && now - lastTime < time) {
		const secondsLeft = Math.ceil((time - (now - lastTime)) / 1000);

		// prettier-ignore
		return context.reply(`⏳ Подожди ${secondsLeft} сек. перед следующим вопросом.`);
	}

	const text = context.message.text;

	if (!text) {
		return context.reply(`🎯 Пожалуйста, отправь текстовый вопрос о сне.`);
	}

	cooldown.set(userId, now);

	// prettier-ignore
	try {
		const message = await context.reply('💭 Подождите, я обрабатываю ваш запрос...');

		context.session.history.push({
			role: 'user',
			content: text
		});

		// Ограничим размер истории (например, до 20 сообщений + system)
		if (context.session.history.length > 22) {
			context.session.history = [
				context.session.history[0],
				...context.session.history.slice(-21)
			];
		}

		const answer = await generateAnswer(context.session.history);
		cooldown.set(userId, now);

		context.session.history.push({
			role: 'assistant',
			content: answer
		});

		await context.deleteMessage(message.message_id);

		await context.reply(MarkdownV2(bold(answer)), { 
			reply_markup: keyboard.reply_markup,
			parse_mode: 'MarkdownV2' 
		});
	} catch (error) {
		logger.error(error);
		return context.reply(`❌ Произошла ошибка при генерации ответа! Попробуйте позже.`);
	}
});

Chat.action('cancel', async (context) => {
	await context.editMessageText('🍪 Чат завершён.');
	return context.scene.leave();
});
function bold(text) {
	return text.replace(/\*\*(.+?)\*\*/g, '*$1*');
}

function MarkdownV2(text) {
	return text.replace(/[_\[\]()~`>#+=|{}.!\\-]/g, '\\$&');
}

async function generateAnswer(history) {
	const response = await mistral.chat.complete({
		model: 'mistral-large-latest',
		temperature: 0.9,
		top_p: 0.95,
		messages: history,
	});

	console.log(response.choices[0].message);

	return response.choices[0].message.content;
}

export default Chat;
