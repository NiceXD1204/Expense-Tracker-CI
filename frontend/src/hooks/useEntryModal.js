import { useState } from 'react'

// Shared open/close + add-vs-edit state for the Add/Edit expense and income
// modals, so every page that uses them doesn't have to re-implement the same
// three handlers.
export default function useEntryModal() {
  const [open, setOpen] = useState(false)
  const [entry, setEntry] = useState(null)

  const openAdd = () => {
    setEntry(null)
    setOpen(true)
  }

  const openEdit = (item) => {
    setEntry(item)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEntry(null)
  }

  return { open, entry, openAdd, openEdit, close }
}
