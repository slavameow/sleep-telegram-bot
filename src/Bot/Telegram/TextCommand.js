import { Manager, Command } from '../../../../commands-manager/src/index.js';

function escapeRegExp(text) {
	if (typeof text !== 'string') {
		throw new Error('Expected a string for escapeRegExp');
	}

	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

class TextCommand extends Command {
	constructor(params) {
		super(params);

		this.trigger = params.trigger;
		this.source = params.source;
		this.func = params.func;
		this.message_type = params.message_type;
		this.enabled = params.enabled !== false;

		// prettier-ignore
		if (!this.message_type) {
            throw new Error("The required field 'message_type' is not specified! Please add it.");
        }

		// prettier-ignore
		if (typeof params.trigger === "string") {
            this.trigger = new RegExp(`^${escapeRegExp(params.trigger)}$`, "i");
        } else if (Array.isArray(params.trigger)) {
            this.trigger = new RegExp(`^(${params.trigger.map(escapeRegExp).join("|")})$`, "i");
        }

		this.constructor.manager.add(this.source, this);
	}

	static get manager() {
		if (!this._manager) {
			this._manager = new Manager();
		}

		return this._manager;
	}

	check(value) {
		return this.trigger.test(value);
	}

	async execute(context, bot) {
		if (!this.enabled && !context.state.user.isAdmin) {
			return context.reply('🔧 Эта команда временно недоступна.');
		}

		const update = context.update;
		const chat = update.message.chat;

		// prettier-ignore
		const checkChatType = () => {
            if (this.message_type) {
                if (this.message_type.includes("all") && chat.type !== "private" && chat.type !== "supergroup" && chat.type !== "group") {
                    return `📂 Эта команда доступна только в личных сообщениях или беседах.`;
                }

                if (this.message_type.includes("pm") && chat.type !== "private") {
                    return `ℹ️ Эта команда доступна только в личных сообщениях.`;
                }

                if (this.message_type.includes("chat") && (chat.type !== "supergroup" && chat.type !== "group")) {
                    return '🧨 Данная команда работает только в чате (группе).'
                }

                const chatId = this.message_type.find(item => typeof item === 'number');

                if (chatId && chat.id !== chatId) {
                    return;
                }
            }

            return null;
        };

		const errorMessage = checkChatType();

		if (errorMessage) {
			return context.reply(errorMessage);
		}

		return this.func(context, bot);
	}
}

export default TextCommand;
