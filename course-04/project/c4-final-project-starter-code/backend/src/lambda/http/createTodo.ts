import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	 const userId = getUserId(event);
    const newTodo: CreateTodoRequest = JSON.parse(event.body)

	 const result = await createTodo(userId, newTodo);

    return {
		statusCode: 201,
		body: JSON.stringify({
			item: result
		})
	 };
  }
);

handler
	.use(httpErrorHandler())
	.use(cors({
	   credentials: true
	 }))
