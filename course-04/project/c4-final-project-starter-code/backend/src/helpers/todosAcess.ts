import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

const TODOS_TABLE = process.env.TODOS_TABLE;
const TODOS_CREATE_AT_INDEX = process.env.TODOS_CREATE_AT_INDEX;

// const docClient = new AWS.DynamoDB.DocumentClient();
const docClient = new XAWS.DynamoDB.DocumentClient();

export class TodosAccess {
	public static async listTodos(
		userId: string
	): Promise<TodoItem[]> {
		logger.info(`listTodos("${userId}"}`);

		let result = await docClient.query({
			TableName: TODOS_TABLE,
			IndexName: TODOS_CREATE_AT_INDEX,
			KeyConditionExpression: 'userId = :userId',
			ExpressionAttributeValues: {
			  ':userId': userId
			},
			ScanIndexForward: false // reverse the sort order
		}).promise();

		logger.info("query todos resp", result);

		return result.Items as TodoItem[];
	}

	public static async createTodo(
		userId: string,
		todoId: string,
		name: string,
		dueDate: string
	): Promise<TodoItem> {
		const newTodo = {
		  userId,
		  todoId,
		  createdAt: (new Date()).toISOString(),
		  name,
		  dueDate,
		  done: false,
		} as TodoItem;

		logger.info(`createTodo("${userId}","${todoId}")`, newTodo);

		await docClient.put({
			TableName: TODOS_TABLE,
			Item: newTodo
		}).promise();

		return newTodo;
	}

	public static async hasTodo(
		userId: string,
		todoId: string
	): Promise<boolean> {

		let result = await docClient.get({
			TableName: TODOS_TABLE,
			Key: { userId, todoId, }
		}).promise();

		return !!result.Item;
	}

	public static async updateTodo(
		userId: string,
		todoId: string,
		updatedValues: TodoUpdate,
	): Promise<TodoUpdate> {
		logger.info(`updateTodo("${userId}","${todoId}")`, updatedValues);

		let {name, dueDate, done} = updatedValues;

		let result = await docClient.update({
			TableName: TODOS_TABLE,
			Key: { userId, todoId },
			UpdateExpression: "SET #todo_name=:name, dueDate=:dueDate, done=:done",
			ExpressionAttributeValues: {
				":name": name,
				":dueDate": dueDate,
				":done": done,
			},
			ExpressionAttributeNames: {
				"#todo_name": "name",
			},
			ReturnValues: "ALL_NEW"
		}).promise();

		return result.Attributes as TodoUpdate;
	}

	public static async deleteTodo(
		userId: string,
		todoId: string
	): Promise<TodoItem> {
		logger.info(`deleteTodo("${userId}","${todoId}"}`);

		let result = await docClient.delete({
		  TableName: TODOS_TABLE,
		  Key: { userId, todoId },
		  ReturnValues: "ALL_OLD"
		}).promise();

		return result.Attributes as TodoItem;
	}

   public static async updateTodoUrl(
		userId: string,
		todoId: string,
		url: string | null,
	): Promise<TodoItem> {
		logger.info(`updateTodo("${userId}","${todoId}")`,{
			url: url,
		});

		let result: DocumentClient.UpdateItemOutput;
		if (url == null) {
			result = await docClient.update({
				TableName: TODOS_TABLE,
				Key: { userId, todoId },
				UpdateExpression: "REMOVE attachmentUrl",
				ReturnValues: "ALL_NEW"
			}).promise();
		} else {
			result = await docClient.update({
				TableName: TODOS_TABLE,
				Key: { userId, todoId },
				UpdateExpression: "SET attachmentUrl=:url",
				ExpressionAttributeValues: {
					":url": url,
				},
				ReturnValues: "ALL_NEW"
			}).promise();
		}

		return result.Attributes as TodoItem;
	}
}

