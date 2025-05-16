import winston from 'winston';
import chalk from 'chalk';
import path from 'path';

const getTime = (timestamp) => {
	return new Date(timestamp).toLocaleTimeString('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
};

const getLevelColor = (level) => {
	return (
		{
			info: chalk.blue.bold,
			warn: chalk.yellow.bold,
			error: chalk.red.bold,
			success: chalk.green.bold,
		}[level] || chalk.white
	);
};

// prettier-ignore
const consoleFormat = winston.format.printf(({ level, message, timestamp }) => {
	const time = getTime(timestamp);

	return `${chalk.gray(time)} | ${getLevelColor(level)(`[${level.toUpperCase()}]`)} | ${chalk.cyan(message)}`;
});

// prettier-ignore
const fileFormat = winston.format.printf(({ level, message, timestamp }) => {
	const time = getTime(timestamp);

	return `${time} | [${level.toUpperCase()}] | ${message}`;
});

// prettier-ignore
const addFilename = winston.format((info) => {
	const relativePath = path.relative(process.cwd(), __filename).replace(/\\/g, '/');
	info.filename = `./${relativePath}`;

	return info;
});

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		addFilename(),
		consoleFormat
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp(),
				consoleFormat
			),
		}),
		new winston.transports.File({
			filename: 'logs/combined.log',
			format: winston.format.combine(
				winston.format.timestamp(),
				fileFormat
			),
		}),
	],
});

export { logger };
