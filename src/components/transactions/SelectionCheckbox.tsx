interface SelectionCheckboxProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

export default function SelectionCheckbox({ checked, onChange, disabled }: SelectionCheckboxProps) {
  return (
    <label
      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer"
      aria-disabled={disabled}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Selecionar lançamento"
      />
    </label>
  )
}
