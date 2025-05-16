import TextCommand from '../../TextCommand.js';
import { format } from '@gramio/format';

// prettier-ignore
new TextCommand({
    trigger: '/start',
    message_type: ['pm'],
    func: async (context, bot) => {
        return context.replyWithHTML(format`
            💤 <b>Чат-бот "Калькулятор сна"</b> — твой личный помощник по здоровому сну.\n
            Просто напиши, <b>во сколько ты хочешь проснуться</b>, а бот подскажет <b>лучшие варианты, когда лечь спать</b>, чтобы проснуться в конце цикла сна — <i>бодрым и полным энергии</i>.\n
            Он учитывает <b>фазы сна</b> и помогает выбрать <i>оптимальное время засыпания</i>.\n
            <i>Например: 7:00</i>.
        `)}
    ,
    source: 'bot',
});
