import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda'
import { Rekognition } from 'aws-sdk'

const rekognition = new Rekognition({ region: 'ap-northeast-1' })

export const eventHandler = async (event: APIGatewayProxyEvent) => {
  switch (event.path) {
    case '/':
      return await rekognition.searchFacesByImage({
        CollectionId: process.env.COLLECTION_ID!,
        Image: {
          Bytes: Buffer.from(event.body!, 'base64')
        }
      }).promise()
    case '/celeb':
      return await rekognition.recognizeCelebrities({
        Image: {
          Bytes: Buffer.from(event.body!, 'base64')
        }
      }).promise()
    default:
      return event
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const results = await eventHandler(event)
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  }
}
