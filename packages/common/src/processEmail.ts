import { PSTMessage } from 'pst-extractor'
import { v4 as uuidv4 } from 'uuid'
import { onlyHot } from './constants'
import { aliasMap } from './custodians'
import { hash, hashMap } from './hash'
import {
  addCustodiansInteraction,
  incReceiverTotal,
  incSenderTotal,
} from './processCustodians'
import { incEmailSentByDay } from './processEmailSent'
import { addToWordCloud } from './processWordCloud'
import { hasTerms } from './terms'
import { Email } from './types'

// filter out funky stuff that isn't hot
const isValidEmail = (email): boolean | null =>
  email.messageClass === 'IPM.Note' &&
  email.clientSubmitTime !== null &&
  email.clientSubmitTime > new Date(1999, 0, 1) &&
  email.clientSubmitTime < new Date(2002, 3, 1) &&
  (email.senderName.trim() !== '' || email.senderEmailAddress.trim() !== '')

// check for custodians
const getCustodians = (s, foundCustodians) => {
  let potentialCustodians = s.toLowerCase().trim().split(';')
  potentialCustodians = potentialCustodians.map((c) => c.trim())
  potentialCustodians = potentialCustodians.filter((c) => c !== '')

  potentialCustodians.forEach((custodian) => {
    if (aliasMap.has(custodian)) {
      foundCustodians.add(aliasMap.get(custodian))
    }
  })

  return foundCustodians
}

// helps with display of super long email addresses
const breakUpAddress = (addr) =>
  addr.split('@').join(' @').split('+').join(' +')

// Processes individual email and stores in list.
export function processEmail(email: PSTMessage, emails: Email[]): void {
  // dedupe
  const h = hash(email.body)
  if (hashMap.has(h)) return

  if (!isValidEmail(email)) return

  // get custodians, if any
  const fromCustodiansSet = new Set()
  getCustodians(email.senderName, fromCustodiansSet)
  getCustodians(email.senderEmailAddress, fromCustodiansSet)
  const fromCustodians = [...Array.from(fromCustodiansSet)]
  const fromCustodian = fromCustodians.length
    ? (fromCustodians[0] as string)
    : ''

  const toCustodiansSet = new Set()
  getCustodians(email.displayTo, toCustodiansSet)
  getCustodians(email.displayCC, toCustodiansSet)
  getCustodians(email.displayBCC, toCustodiansSet)
  const toCustodians = [...Array.from(toCustodiansSet)] as string[]

  // load only hot emails?
  const hot = hasTerms(email) || fromCustodian || toCustodians.length
  if (!hot && onlyHot) return

  const emailId = uuidv4()

  if (fromCustodian && toCustodians.length) {
    addCustodiansInteraction(fromCustodian, toCustodians)
  }
  if (fromCustodian) incSenderTotal(fromCustodian)
  if (toCustodians.length) toCustodians.forEach((c) => incReceiverTotal(c))

  incEmailSentByDay(email.clientSubmitTime)

  addToWordCloud(email, fromCustodian, toCustodians.join(' '))

  // add to list to be inserted later
  emails.push({
    id: emailId,
    sent: email.clientSubmitTime,
    from: breakUpAddress(email.senderName),
    fromCustodian: fromCustodian,
    to: breakUpAddress(email.displayTo),
    toCustodians: toCustodians as string[],
    cc: email.displayCC,
    bcc: email.displayBCC,
    subject: email.subject,
    body: email.body,
  })

  // add to dedupe map
  hashMap.set(h, email.body)
}
