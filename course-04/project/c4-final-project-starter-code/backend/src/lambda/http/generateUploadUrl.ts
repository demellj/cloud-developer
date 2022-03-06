import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	 const userId = getUserId(event);
    const todoId = event.pathParameters.todoId
    
	 const preSignedURL = await createAttachmentPresignedUrl(userId, todoId);

    return {
		statusCode: 200,
		body: JSON.stringify({
			"uploadUrl": preSignedURL
		})
	 }
  }
)

handler
  .use(httpErrorHandler())
  .use(cors({
      credentials: true
   }))
