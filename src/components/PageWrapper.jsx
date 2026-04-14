// PageWrapper.jsx — Consistente paginaopmaak met titel, omschrijving en acties
export default function PageWrapper({ title, description, actions, children }) {
  return (
    <div className="space-y-5 max-w-7xl">
      {/* Paginaheader */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Pagina-inhoud */}
      {children}
    </div>
  )
}
