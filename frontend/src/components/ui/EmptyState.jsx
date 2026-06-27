export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-ink-800/40 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-line bg-ink-800 text-content-dim">
          <Icon size={22} />
        </span>
      )}
      <h3 className="font-display text-base font-semibold text-content">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-content-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
