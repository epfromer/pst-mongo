import * as fs from 'fs'
import { PSTFile, PSTFolder, PSTMessage } from 'pst-extractor'
import { fsFolder } from './constants'
import { processEmail } from './processEmail'
import { Email } from './types'

// creates log string with times
function ms(numDocs: number, msStart: number, msEnd: number): string {
  const ms = msEnd - msStart
  const msPerDoc = ms / numDocs
  const sec = ms / 1000
  const min = sec / 60
  let s = ` ${numDocs} docs`
  s += `, ${ms} ms (~ ${Math.trunc(sec)} sec)`
  if (min > 1) {
    s += ` (~ ${Math.trunc(min)} min)`
  }
  s += `, ~ ${Math.trunc(msPerDoc)} ms per doc`
  return s
}

// Walk the PST folder tree recursively and process emails, storing in list.
function walkPSTFolder(emails: Email[], folder: PSTFolder): void {
  if (folder.hasSubfolders) {
    const childFolders: PSTFolder[] = folder.getSubFolders()
    for (const childFolder of childFolders) {
      walkPSTFolder(emails, childFolder)
    }
  }
  if (folder.contentCount > 0) {
    let email: PSTMessage = folder.getNextChild()
    while (email != null) {
      // while (email != null && i++ < maxNum) {
      processEmail(email, emails)
      email = folder.getNextChild()
    }
  }
}

// Processes a PST, storing emails in list.
function walkPST(filename: string): Email[] {
  const emails: Email[] = []
  const pstFile = new PSTFile(filename)
  walkPSTFolder(emails, pstFile.getRootFolder())
  return emails
}

// Walk file system folder, processing each PST in it
export async function walkFSfolder(
  insertEmails: (emails: Email[]) => void
): Promise<number> {
  let numEmails = 0

  console.log(`walking ${fsFolder}`)
  const files = fs.readdirSync(fsFolder)
  for (const file of files) {
    console.log(`processing ${file}\n`)
    const start = Date.now()
    const emails = walkPST(fsFolder + file)
    console.log(file + '  complete, ' + ms(emails.length, start, Date.now()))

    if (emails.length > 0) {
      // insert into db
      const start = Date.now()
      console.log(`inserting ${emails.length} documents`)
      await insertEmails(emails)
      console.log(file + '  complete, ' + ms(emails.length, start, Date.now()))
      numEmails += emails.length
    } else {
      console.log(file + ': complete, no emails')
    }
  }

  return numEmails
}