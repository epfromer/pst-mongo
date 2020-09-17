import { Client } from '@elastic/elasticsearch'
import { dbName, wordCloudCollection } from '@klonzo/common'
import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
dotenv.config()

// HTTP GET /wordcloud
export async function getWordCloud(req: Request, res: Response): Promise<void> {
  try {
    const client = new Client({
      node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`,
    })

    const { body } = await client.search({
      index: dbName + wordCloudCollection,
      q: '*',
    })
    res.json(body.hits.hits[0]._source.wordCloudCollection)
  } catch (err) {
    console.error(err.stack)
    res.status(500).send(err.msg)
  }
}