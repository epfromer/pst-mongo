import { custodianCollection } from '@klonzo/common'
import { Request, Response } from 'express'
import { db } from './index'

export async function setCustodian(req: Request, res: Response): Promise<void> {
  try {
    // should have some validation, but assume ok for now
    const doc = await db
      .collection(custodianCollection)
      .findOneAndUpdate({ id: req.params.id }, { $set: req.body })
    res.status(200).send(doc)
  } catch (err) {
    console.error(err.stack)
    res.status(500).send(err.msg)
  }
}
