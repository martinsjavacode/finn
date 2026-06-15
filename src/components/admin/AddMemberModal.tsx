import { useState, useRef, useCallback } from 'react'
import { searchUsers } from '../../services/admin'
import { isExistingMember } from '../../utils/adminFilters'
import Modal from '../ui/Modal'

interface AddMemberModalProps {
  existingMemberUserIds: string[]
  roles: { id: string; name: string }[]
  onSubmit: (userId: string, roleId: string) => void
  onClose: () => void
  loading: boolean
}

interface UserResult {
  id: string
  email: string
}

export default function AddMemberModal({
  existingMemberUserIds,
  roles,
  onSubmit,
  onClose,
  loading,
}: AddMemberModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const alreadyMember = selectedUser
    ? isExistingMember(selectedUser.id, existingMemberUserIds)
    : false

  const canSubmit = !!selectedUser && !alreadyMember && !loading

  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await searchUsers(value)
      setResults(data ?? [])
      setShowDropdown(true)
      setSearching(false)
    }, 300)
  }, [])

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user)
    setQuery(user.email)
    setShowDropdown(false)
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (selectedUser) {
      setSelectedUser(null)
    }
    if (!selectedUser) {
      debouncedSearch(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit && selectedUser) {
      onSubmit(selectedUser.id, roleId)
    }
  }

  return (
    <Modal
      title="Adicionar membro"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={loading ? 'Adicionando...' : 'Adicionar'}
      submitDisabled={!canSubmit}
    >
      {/* User search */}
      <div className="account-form-field">
        <label htmlFor="member-search">Usuário</label>
        <div className="add-member-search-wrapper">
          <input
            id="member-search"
            type="text"
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Buscar por email..."
            autoComplete="off"
            autoFocus
          />
          {showDropdown && results.length > 0 && (
            <ul className="add-member-dropdown" role="listbox">
              {results.map(user => (
                <li
                  key={user.id}
                  role="option"
                  aria-selected={selectedUser?.id === user.id}
                  className="add-member-dropdown-item"
                  onClick={() => handleSelectUser(user)}
                >
                  {user.email}
                </li>
              ))}
            </ul>
          )}
          {showDropdown && results.length === 0 && !searching && (
            <div className="add-member-dropdown add-member-no-results">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
        {alreadyMember && (
          <span className="account-form-error">
            Este usuário já é membro desta conta
          </span>
        )}
      </div>

      {/* Role selector */}
      <div className="account-form-field">
        <label htmlFor="member-role">Papel</label>
        <select
          id="member-role"
          value={roleId}
          onChange={e => setRoleId(e.target.value)}
          className="add-member-role-select"
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  )
}
