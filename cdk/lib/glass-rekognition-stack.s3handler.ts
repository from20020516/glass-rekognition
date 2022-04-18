import { S3Handler } from 'aws-lambda'
import { Rekognition } from 'aws-sdk'

const rekognition = new Rekognition({ region: 'ap-northeast-1' })

export const handler: S3Handler = async (event) => {
  try {
    const eventName = event.Records[0].eventName
    const id = event.Records[0].s3.object.key
    if (eventName.startsWith('ObjectCreated')) {
      const results = await rekognition.indexFaces({
        CollectionId: process.env.COLLECTION_ID!,
        ExternalImageId: id,
        Image: {
          S3Object: {
            Bucket: event.Records[0].s3.bucket.name,
            Name: id,
          },
        },
      }).promise()
      console.log(JSON.stringify(results))
    } else {
      const listFaces = await rekognition.listFaces({
        CollectionId: process.env.COLLECTION_ID!,
      }).promise()
      const results = await rekognition.deleteFaces({
        CollectionId: process.env.COLLECTION_ID!,
        FaceIds: [
          listFaces.Faces?.find(face => face.ExternalImageId === id)?.FaceId!
        ]
      }).promise()
      console.log(JSON.stringify(results))
    }
  } catch (error) {
    console.error(JSON.stringify(error))
  }
}
