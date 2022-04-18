import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_apigateway,
  aws_iam,
  aws_lambda_nodejs,
  aws_rekognition,
  aws_s3_notifications,
  aws_s3,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class GlassRekognitionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucket = new aws_s3.Bucket(this, 'Bucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const collection = new aws_rekognition.CfnCollection(this, 'Collection', {
      collectionId: id,
    })
    const rekognitionPolicy = new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      resources: [collection.attrArn],
      actions: ['*'],
    })

    const handler = new aws_lambda_nodejs.NodejsFunction(this, 'handler', {
      environment: {
        COLLECTION_ID: collection.collectionId
      }
    })
    handler.addToRolePolicy(rekognitionPolicy)
    handler.addToRolePolicy(new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      actions: ['rekognition:RecognizeCelebrities'],
      resources: ['*']
    }))

    /** @todo add authorization */
    new aws_apigateway.LambdaRestApi(this, 'API', { handler })

    const s3Handler = new aws_lambda_nodejs.NodejsFunction(this, 's3handler', {
      environment: {
        COLLECTION_ID: collection.collectionId
      },
    })
    s3Handler.addToRolePolicy(rekognitionPolicy)
    bucket.grantReadWrite(s3Handler)

    bucket.addEventNotification(aws_s3.EventType.OBJECT_CREATED, new aws_s3_notifications.LambdaDestination(s3Handler))
    bucket.addEventNotification(aws_s3.EventType.OBJECT_REMOVED_DELETE, new aws_s3_notifications.LambdaDestination(s3Handler))
  }
}
