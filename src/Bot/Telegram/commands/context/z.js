import TextCommand from '../../TextCommand.js';

new TextCommand({
	trigger: '/z',
	message_type: ['pm'],
	func: async (context, bot) => {
		return context.scene.enter('chat');
	},
	source: 'bot',
});
