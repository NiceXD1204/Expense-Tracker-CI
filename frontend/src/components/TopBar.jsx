import ThemeToggle from './ThemeToggle'

// Sits above every page's own content so the theme toggle is always
// reachable, regardless of what each page's local header contains.
export default function TopBar() {
  return (
    <div className="mb-4 flex items-center justify-end">
      <ThemeToggle />
    </div>
  )
}
