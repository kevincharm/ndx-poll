import * as AWS from 'aws-sdk'
import config from '../config'

const ses = new AWS.SES({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    region: 'eu-central-1',
})

export default ses
