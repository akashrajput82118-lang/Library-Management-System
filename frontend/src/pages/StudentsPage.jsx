import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/client'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import LoadingBlock, { ErrorBanner } from '../components/Loading'
import { useToast } from '../context/ToastContext'
import {
  EditIcon,
  PlusIcon,
  SearchIcon,
  StudentsIcon,
  TrashIcon
} from '../components/Icons'

const PAGE_SIZE = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emptyForm = {
  studentId: '',
  name: '',
  email: '',
  phone: '',
  department: ''
}

function validateStudentForm(form) {
  const studentId = Number(form.studentId)

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return 'Student ID must be a positive whole number.'
  }
  if (!form.name.trim()) return 'Student name is required.'
  if (!form.email.trim()) return 'Email is required.'
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    return 'Enter a valid email address, for example name@example.com.'
  }
  if (form.phone.trim().length > 15) {
    return 'Phone number cannot be longer than 15 characters.'
  }
  return ''
}

export default function StudentsPage() {
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

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/students/page', {
        params: {
          page,
          size: PAGE_SIZE,
          sortBy: 'studentId',
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
    loadStudents()
  }, [loadStudents])

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

  const openEdit = (student) => {
    setForm({
      studentId: String(student.studentId),
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      department: student.department || ''
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

    const validationError = validateStudentForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = {
      studentId: Number(form.studentId),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      department: form.department.trim() || null
    }

    try {
      setSaving(true)
      if (modalMode === 'add') {
        await api.post('/students', payload)
        showToast('Student added successfully.')
      } else {
        await api.put(`/students/${form.studentId}`, payload)
        showToast('Student updated successfully.')
      }
      setModalMode(null)
      await loadStudents()
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
      await api.delete(`/students/${deleteTarget.studentId}`)
      showToast('Student deleted.')
      setDeleteTarget(null)
      if (pageData.content.length === 1 && page > 0) {
        setPage((current) => current - 1)
      } else {
        await loadStudents()
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
          <span className="eyebrow">Borrowers</span>
          <h1>Students</h1>
          <p className="page-subtitle">
            Keep contact details current so every issue record points to the
            right person.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <PlusIcon size={18} />
          Add student
        </button>
      </header>

      <div className="toolbar">
        <label className="search-input">
          <SearchIcon size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search students"
          />
        </label>
        <span className="toolbar-count">
          {pageData.totalElements} student
          {pageData.totalElements === 1 ? '' : 's'}
        </span>
      </div>

      <ErrorBanner message={error} onRetry={loadStudents} />

      <section className="panel table-panel">
        {loading && pageData.content.length === 0 ? (
          <LoadingBlock message="Loading students…" />
        ) : pageData.content.length === 0 ? (
          <EmptyState
            icon={<StudentsIcon size={28} />}
            title={query ? 'No students match your search' : 'No students yet'}
            message={
              query
                ? 'Try a different name or email address.'
                : 'Add your first student to start issuing books.'
            }
            action={
              !query ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAdd}
                >
                  <PlusIcon size={18} /> Add student
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
                    <th>Student</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.content.map((student) => (
                    <tr key={student.studentId}>
                      <td className="mono">#{student.studentId}</td>
                      <td>
                        <span className="cell-title">{student.name}</span>
                        <span className="cell-sub">{student.email}</span>
                      </td>
                      <td>{student.phone || <span className="muted">—</span>}</td>
                      <td>
                        {student.department ? (
                          <span className="badge badge-soft">
                            {student.department}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => openEdit(student)}
                            title="Edit student"
                            aria-label={`Edit ${student.name}`}
                          >
                            <EditIcon size={18} />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button-danger"
                            onClick={() => setDeleteTarget(student)}
                            title="Delete student"
                            aria-label={`Delete ${student.name}`}
                          >
                            <TrashIcon size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              onPageChange={setPage}
              itemLabel="students"
            />
          </>
        )}
      </section>

      {modalMode && (
        <Modal
          title={
            modalMode === 'add'
              ? 'Add a student'
              : `Edit student #${form.studentId}`
          }
          subtitle="Student IDs and email addresses must be unique."
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
                <span>Student ID</span>
                <input
                  type="number"
                  name="studentId"
                  min="1"
                  step="1"
                  value={form.studentId}
                  onChange={updateField}
                  disabled={modalMode === 'edit'}
                  placeholder="e.g. 104"
                />
                {modalMode === 'edit' && (
                  <small>The primary key cannot be changed.</small>
                )}
              </label>

              <label className="field">
                <span>Department</span>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={updateField}
                  maxLength={250}
                  placeholder="e.g. CSE"
                />
              </label>

              <label className="field field-span-2">
                <span>Full name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  maxLength={250}
                  placeholder="Student name"
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  maxLength={250}
                  placeholder="name@example.com"
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  maxLength={15}
                  placeholder="10-digit number"
                />
              </label>
            </div>

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
                    ? 'Add student'
                    : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this student?"
          message={`${deleteTarget.name} will be removed. Students with issue history cannot be deleted.`}
          confirmLabel="Delete student"
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
