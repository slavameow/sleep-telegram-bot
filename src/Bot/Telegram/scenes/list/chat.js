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

		const answer = await generateAnswer(text);
		cooldown.set(userId, now);
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

async function generateAnswer(text) {
	const response = await mistral.chat.complete({
		model: 'mistral-small-latest',
		temperature: 0.9,
		top_p: 0.95,
		messages: [
			{
				role: 'system',
				content: `
Ты — бот-психолог сна. Твоя задача — помогать людям наладить сон: давать советы по засыпанию, пробуждению, циклам сна, расслаблению, высыпанию и всем, что связано со сном.

Если вопрос явно связан со сном, дай полезный, дружелюбный и краткий ответ.

Если вопрос короткий, неясный или неоднозначный, попробуй понять, связан ли он с темой сна, используя ключевые слова, предыдущий контекст и логические догадки.

Если пользователь отвечает «да», «угу», «конечно», «ага» или другим коротким подтверждением, считай это подтверждением того, что его предыдущий вопрос был о сне, и сразу отвечай по теме — **не переспрашивай**.

Если не можешь точно определить, связан ли вопрос со сном, вежливо попроси уточнить, например: «Можешь уточнить, твой вопрос касается сна?»

Если вопрос не относится ко сну, вежливо откажись и скажи, что ты можешь говорить только на темы, связанные со сном.

Отвечай по существу, тепло и кратко. Избегай лишних переспросов.

Примеры вопросов, относящихся ко сну:  
• «Во сколько лучше ложиться спать?»  
• «Как справиться с бессонницей?»  
• «Что делать, если не могу заснуть?»  
• «Почему я просыпаюсь ночью?»  
• «Как улучшить качество сна?»  
• «Можно ли пить кофе вечером?»  
• «Помогают ли упражнения уснуть?»

Примеры вопросов, не относящихся ко сну:  
• «Что поешь на завтрак?»  
• «Какая сегодня погода?»  
• «Расскажи анекдот.»  
• «Во сколько начинается футбол?»  
• «Какая у тебя любимая еда?»
 `.trim(),
			},
			{
				role: 'user',
				content: text,
			},
		],
	});

	console.log(response.choices[0].message);

	return response.choices[0].message.content;
}

export default Chat;
