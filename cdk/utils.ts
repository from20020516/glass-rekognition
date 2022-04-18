import axios from 'axios'
import { Rekognition } from 'aws-sdk'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
config({ path: '../.env' })

const rekognition = new Rekognition({ region: 'ap-northeast-1' });

(async ([cmd, ...args]) => {
  try {
    switch (cmd) {
      case 'scan':
        const filePath = args[0]
        const scanResult = await axios.post(process.env.API_ENDPOINT!, readFileSync(filePath, { encoding: 'base64' }))
        console.log(JSON.stringify(scanResult.data, null, 2))
        break
      case 'deleteAll':
        const listFaces = await rekognition.listFaces({
          CollectionId: process.env.COLLECTION_ID!,
        }).promise()
        const deleteResults = await rekognition.deleteFaces({
          CollectionId: process.env.COLLECTION_ID!,
          FaceIds: listFaces.Faces!.map(face => face.FaceId!)
        }).promise()
        console.log(JSON.stringify(deleteResults))
        break
      default:
        console.log(cmd, args)
    }
  } catch (error) {
    console.error(error)
  }
})(process.argv.slice(2))
