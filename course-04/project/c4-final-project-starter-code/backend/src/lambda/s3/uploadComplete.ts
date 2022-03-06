import { S3Handler, S3Event } from 'aws-lambda';
import 'source-map-support/register'

import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const S3_MEDIA_BUCKET = process.env.ATTACHMENT_S3_BUCKET;

const XAWS = AWSXRay.captureAWS(AWS)

// const S3 = new AWS.S3({
const S3 = new XAWS.S3({
	signatureVersion: 'v4'
});

import { createLogger } from '../../utils/logger';
import { updateAttachmentUrl } from '../../helpers/todos'
import { AttachmentUtils } from '../../helpers/attachmentUtils';


const logger = createLogger("S3Handler");

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
	logger.info(`Detected ${event.Records.length} new S3 objects`);

	for (const record of event.Records) {
		const todoID = record.s3.object.key;

		let result = await S3.headObject({
			Bucket: S3_MEDIA_BUCKET,
			Key: todoID,
		}).promise();

		logger.info(`Found metadata`, result.Metadata);

		let userID = result.Metadata["userid"];
		if (userID) {
			await updateAttachmentUrl(userID, todoID, 
				AttachmentUtils.toPublicUrl(userID, todoID));
		}
	}
};
