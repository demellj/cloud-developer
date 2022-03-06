import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid';
import * as createError from 'http-errors'

const logger = createLogger("todos");

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
	logger.info(`getTodosForUser("${userId}")`);

	return TodosAccess.listTodos(userId);
}

export async function createTodo(
	userId: string,
	newTodo: CreateTodoRequest
): Promise<TodoItem> {
	logger.info(`createTodo("${userId}")`, newTodo);

	let {name, dueDate} = newTodo;
	let todoId = uuid.v4();
	return TodosAccess.createTodo(userId, todoId, name, dueDate);
}

export async function updateTodo(
	userId: string,
	todoId: string,
	updatedValues: UpdateTodoRequest
): Promise<void> {
	logger.info(`updateTodo("${userId}", "${todoId}")`, updateTodo);

	await TodosAccess.updateTodo(userId, todoId, updatedValues);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
	logger.info(`deleteTodo("${userId}", "${todoId}")`);

	await Promise.all([
		TodosAccess.deleteTodo(userId, todoId),
		AttachmentUtils.deleteAttachment(userId, todoId)
	]);
}

export async function createAttachmentPresignedUrl(
	userId: string,
	todoId: string
): Promise<string> {
	logger.info(`createAttachmentPresignedUrl("${userId}", "${todoId}")`);

	const hasTodo = await TodosAccess.hasTodo(userId, todoId);

	if (!hasTodo)
		throw new createError.NotFound("Todo item not found");

	return AttachmentUtils.getUploadUrl(userId, todoId);
}

export async function updateAttachmentUrl(
	userId: string,
	todoId: string,
	url: string | null
): Promise<void> {
	logger.info(`updateAttachmentUrl("${userId}","${todoId}")`);

	await TodosAccess.updateTodoUrl(userId, todoId, url);
}

