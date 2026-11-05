import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/client'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import LoadingBlock, { ErrorBanner } from '../components/Loading'
import { useToast } from '../context/ToastContext'
import {
  BooksIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon
} from '../components/Icons'

const PAGE_SIZE = 8

const emptyForm = {
  bookId: '',
  title: '',
  author: '',
  category: '',
  totalCopies: '1',
  availableCopies: '1'
}

function validateBookForm(form) {
  const bookId = Number(form.bookId)
  const totalCopies = Number(form.totalCopies)
  const availableCopies = Number(form.availableCopies)

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return 'Book ID must be a positive whole number.'
  }
  if (!form.title.trim()) return 'Title is required.'
  if (!form.author.trim()) return 'Author is required.'
  if (form.totalCopies === '' || !Number.isInteger(totalCopies) || totalCopies < 0) {
    return 'Total copies must be zero or a positive whole number.'
  }
  if (
    form.availableCopies === '' ||
    !Number.isInteger(availableCopies) ||
    availableCopies < 0
  ) {
    return 'Available copies must be zero or a positive whole number.'
  }
  if (availableCopies > totalCopies) {
    return 'Available copies cannot be greater than total copies.'
  }
  return ''
}

export default function BooksPage() {
  const [pageData, setPageData] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(0)

  const [modalMode, setModalMode] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/books/page', {
        params: {
          page,
          size: PAGE_SIZE,
          sortBy: 'bookId',
          direction: 'asc',
          ...(debouncedQuery.trim() ? { q: debouncedQuery.trim() } : {})
        }
      })
      const data = response.data
      setPageData(data)

      if (data.content.length === 0 && page > 0 && data.totalElements > 0) {
        setPage((current) => Math.max(0, current - 1))
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
      setPage(0)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const openAdd = () => {
    setForm(emptyForm)
    setFormError('')
    setModalMode('add')
  }

  const openEdit = (book) => {
    setForm({
      bookId: String(book.bookId),
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      totalCopies: String(book.totalCopies ?? 0),
      availableCopies: String(book.availableCopies ?? 0)
    })
    setFormError('')
    setModalMode('edit')
  }

  const closeModal = () => {
    if (saving) return
    setModalMode(null)
    setFormError('')
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const validationError = validateBookForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = {
      bookId: Number(form.bookId),
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim() || null,
      totalCopies: Number(form.totalCopies),
      availableCopies: Number(form.availableCopies)
    }

    try {
      setSaving(true)
      if (modalMode === 'add') {
        await api.post('/books', payload)
        showToast('Book added successfully.')
      } else {
        await api.put(`/books/${form.bookId}`, payload)
        showToast('Book updated successfully.')
      }
      setModalMode(null)
      await loadBooks()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.delete(`/books/${deleteTarget.bookId}`)
      showToast('Book deleted.')
      setDeleteTarget(null)
      if (pageData.content.length === 1 && page > 0) {
        setPage((current) => current - 1)
      } else {
        await loadBooks()
      }
    } catch (requestError) {
      showToast(getErrorMessage(requestError), 'error')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h1>Books</h1>
          <p className="page-subtitle">
            Search the collection, update copies, and keep the catalogue clean.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <PlusIcon size={18} />
          Add book
        </button>
      </header>

      <div className="toolbar">
        <label className="search-input">
          <SearchIcon size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or author…"
            aria-label="Search books"
          />
        </label>
        <span className="toolbar-count">
          {pageData.totalElements} book
          {pageData.totalElements === 1 ? '' : 's'}
        </span>
      </div>

      <ErrorBanner message={error} onRetry={loadBooks} />

      <section className="panel table-panel">
        {loading && pageData.content.length === 0 ? (
          <LoadingBlock message="Loading books…" />
        ) : pageData.content.length === 0 ? (
          <EmptyState
            icon={<BooksIcon size={28} />}
            title={query ? 'No books match your search' : 'No books yet'}
            message={
              query
                ? 'Try a different title or author name.'
                : 'Add your first book to start building the catalogue.'
            }
            action={
              !query ? (
                <button type="button" className="btn btn-primary" onClick={openAdd}>
                  <PlusIcon size={18} /> Add book
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Copies</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.content.map((book) => {
                    const percent =
                      book.totalCopies > 0
                        ? Math.round(
                            (book.availableCopies / book.totalCopies) * 100
                          )
                        : 0
                    return (
                      <tr key={book.bookId}>
                        <td className="mono">#{book.bookId}</td>
                        <td>
                          <span className="cell-title">{book.title}</span>
                          <span className="cell-sub">by {book.author}</span>
                        </td>
                        <td>
                          {book.category ? (
                            <span className="badge badge-soft">
                              {book.category}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="copies-cell">
                            <span>
                              <strong>{book.availableCopies}</strong>
                              <span className="muted"> / {book.totalCopies}</span>
                            </span>
                            <span
                              className={`mini-bar ${percent === 0 ? 'mini-bar-empty' : ''}`}
                              aria-hidden="true"
                            >
                              <span style={{ width: `${percent}%` }} />
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => openEdit(book)}
                              title="Edit book"
                              aria-label={`Edit ${book.title}`}
                            >
                              <EditIcon size={18} />
                            </button>
                            <button
                              type="button"
                              className="icon-button icon-button-danger"
                              onClick={() => setDeleteTarget(book)}
                              title="Delete book"
                              aria-label={`Delete ${book.title}`}
                            >
                              <TrashIcon size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              onPageChange={setPage}
              itemLabel="books"
            />
          </>
        )}
      </section>

      {modalMode && (
        <Modal
          title={modalMode === 'add' ? 'Add a book' : `Edit book #${form.bookId}`}
          subtitle={
            modalMode === 'add'
              ? 'The ID must be unique in the books table.'
              : 'Copy counts must stay consistent with active issues.'
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}

            <div className="form-grid">
              <label className="field">
                <span>Book ID</span>
                <input
                  type="number"
                  name="bookId"
                  min="1"
                  step="1"
                  value={form.bookId}
                  onChange={updateField}
                  disabled={modalMode === 'edit'}
                  placeholder="e.g. 5"
                />
                {modalMode === 'edit' && (
                  <small>The primary key cannot be changed.</small>
                )}
              </label>

              <label className="field">
                <span>Category</span>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  maxLength={250}
                  placeholder="e.g. Programming"
                />
              </label>

              <label className="field field-span-2">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  maxLength={250}
                  placeholder="Book title"
                />
              </label>

              <label className="field field-span-2">
                <span>Author</span>
                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={updateField}
                  maxLength={250}
                  placeholder="Author name"
                />
              </label>

              <label className="field">
                <span>Total copies</span>
                <input
                  type="number"
                  name="totalCopies"
                  min="0"
                  step="1"
                  value={form.totalCopies}
                  onChange={updateField}
                />
              </label>

              <label className="field">
                <span>Available copies</span>
                <input
                  type="number"
                  name="availableCopies"
                  min="0"
                  step="1"
                  value={form.availableCopies}
                  onChange={updateField}
                />
              </label>
            </div>

            <p className="form-note">
              Available copies can never exceed total copies. If copies are
              currently issued, the backend also protects those counts.
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <span className="spinner spinner-light" />}
                {saving
                  ? 'Saving…'
                  : modalMode === 'add'
                    ? 'Add book'
                    : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this book?"
          message={`"${deleteTarget.title}" will be removed from the catalogue. Books with issue records cannot be deleted.`}
          confirmLabel="Delete book"
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
