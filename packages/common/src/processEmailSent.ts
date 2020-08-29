export const emailSent = new Map()

// Add to emails sent map
export function addToEmailSent(sent: Date, id: string): void {
  const day = sent.toISOString().slice(0, 10)
  if (emailSent.has(day)) {
    emailSent.get(day).push(id)
  } else {
    emailSent.set(day, [id])
  }
}

// Process list for email sent and store in db.
// export async function processEmailSent(): Promise<any> {
//   const arr: EmailSentREMOVE[] = []
//   emailSent.forEach((value, key) => arr.push({ sent: key, ids: value }))
//   console.log('processEmailSent: ' + arr.length + ' records')
//   await db.collection(emailSentCollection).insertMany(arr)
// }
