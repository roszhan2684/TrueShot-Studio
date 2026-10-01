import type { Metadata } from 'next'
import { NewPhotoshootWizard } from './new-photoshoot-wizard'

export const metadata: Metadata = { title: 'New Photoshoot' }

export default function NewPhotoshootPage() {
  return <NewPhotoshootWizard />
}
