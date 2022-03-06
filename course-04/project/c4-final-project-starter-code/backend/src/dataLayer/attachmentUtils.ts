import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger("AttachmentUtils");

const S3_MEDIA_BUCKET = process.env.ATTACHMENT_S3_BUCKET;
const SIGNED_URL_EXPIRATION = parseInt(process.env.SIGNED_URL_EXPIRATION);

// const S3 = new AWS.S3({
const S3 = new XAWS.S3({
	signatureVersion: 'v4'
});

export class AttachmentUtils {
	public static async getUploadUrl(userId: string, todoId: string): Promise<string> {
		logger.info(`getUploadUrl("${userId}", "${todoId}", ${JSON.stringify({
			Bucket: S3_MEDIA_BUCKET,
			Key: toImageKey(userId, todoId),
			Expires: SIGNED_URL_EXPIRATION,
		})})`);

		return S3.getSignedUrlPromise('putObject', {
			Bucket: S3_MEDIA_BUCKET,
			Key: toImageKey(userId, todoId),
			Expires: SIGNED_URL_EXPIRATION,
			Metadata: {
				"userID": userId
			}
		});
	}

	public static toPublicUrl(userId: string, todoId: string): string {
		return `https://${S3_MEDIA_BUCKET}.s3.amazonaws.com/${toImageKey(userId, todoId)}`;
	}

	public static async deleteAttachment(userId: string, todoId: string): Promise<void> {
		logger.info(`deleteAttachment("${userId}", "${todoId}")`);

		await S3.deleteObject({
			Bucket: S3_MEDIA_BUCKET,
			Key: toImageKey(userId, todoId)
		}).promise();
	}
}

function toImageKey(_userId: string, todoId: string): string {
	return [todoId].join("-");
}
