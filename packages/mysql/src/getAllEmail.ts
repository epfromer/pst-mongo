import {
  dbName,
  defaultLimit,
  emailCollection,
  HTTPQuery,
} from '@klonzo/common'
import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import mysql from 'mysql2/promise'
dotenv.config()

const createWhereClause = (httpQuery: HTTPQuery) => {
  // console.log(httpQuery)

  let { allText, from, to, subject, body } = httpQuery
  if (allText) allText = allText.toLowerCase()
  if (from) from = from.toLowerCase()
  if (to) to = to.toLowerCase()
  if (subject) subject = subject.toLowerCase()
  if (body) body = body.toLowerCase()
  const { sent, timeSpan } = httpQuery

  let query = ''

  if (sent) {
    const start = new Date(sent)
    const end = new Date(start.getTime())
    end.setDate(end.getDate() + 1)
    // is there a time span?
    if (timeSpan && timeSpan > 0) {
      start.setDate(start.getDate() - +timeSpan)
      end.setDate(end.getDate() + +timeSpan)
    }
    query +=
      `(email_sent >= '${new Date(start).toISOString().slice(0, 10)}' and ` +
      `email_sent <= '${new Date(end).toISOString().slice(0, 10)}')`
  }

  if (allText) {
    // any text field?
    query +=
      (query ? ' and ' : '') +
      `(` +
      `email_from_lc like '%${allText}%' or ` +
      `email_from_custodian_lc like '%${allText}%' or ` +
      `email_to_lc like '%${allText}%' or ` +
      `email_to_custodians_lc like '%${allText}%' or ` +
      `email_cc_lc like '%${allText}%' or ` +
      `email_bcc_lc like '%${allText}%' or ` +
      `email_subject_lc like '%${allText}%' or ` +
      `email_body_lc like '%${allText}%'` +
      `)`
  } else {
    // Else, we have specific field searching.
    if (from) {
      query +=
        (query ? ' and ' : '') +
        `(` +
        `email_from_lc like '%${from}%' or ` +
        `email_from_custodian_lc like '%${from}%'` +
        `)`
    }
    if (to) {
      query +=
        (query ? ' and ' : '') +
        `(` +
        `email_to_lc like '%${to}%' or ` +
        `email_to_custodians_lc like '%${to}%' or ` +
        `email_cc_lc like '%${to}%' or ` +
        `email_bcc_lc like '%${to}%'` +
        `)`
    }
    if (subject) {
      query +=
        (query ? ' and ' : '') +
        `(` +
        `email_subject_lc like '%${subject}%'` +
        `)`
    }
    if (body) {
      query +=
        (query ? ' and ' : '') + `(` + `email_body_lc like '%${body}%'` + `)`
    }
  }

  // console.log(query)
  return query
}

const sort = (httpQuery: HTTPQuery) => {
  const { sort } = httpQuery
  if (!sort || sort === 'sent') return 'email_sent'
  return 'email_' + sort + '_sort'
}

// HTTP GET /email/
export async function getAllEmail(req: Request, res: Response): Promise<void> {
  try {
    let qTotal = `select count(*) as total from ${emailCollection}`
    let q = `select * from ${emailCollection}`

    const whereClause = createWhereClause(req.query)
    if (whereClause) {
      qTotal += ' where ' + whereClause
      q += ' where ' + whereClause
    }

    q += ` order by ${sort(req.query)} ${
      req.query.order === '1' ? 'asc' : 'desc'
    } limit ${req.query.limit ? +req.query.limit : defaultLimit} offset ${
      req.query.skip ? +req.query.skip : 0
    } `

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: dbName,
    })
    const [rows] = await connection.execute(q)
    const [resultTotal] = await connection.execute(qTotal)

    res.json({
      total: +resultTotal[0].total,
      emails: rows.map((email) => ({
        id: email.email_id,
        sent: email.email_sent,
        sentShort: new Date(email.email_sent).toISOString().slice(0, 10),
        from: email.email_from,
        fromCustodian: email.email_from_custodian,
        to: email.email_to,
        toCustodians: email.email_to_custodians
          ? email.email_to_custodians.split(',')
          : [],
        cc: email.email_cc,
        bcc: email.email_bcc,
        subject: email.email_subject,
        body: email.email_body,
      })),
    })
  } catch (err) {
    console.error(err.stack)
    res.status(500).send(err.msg)
  }
}