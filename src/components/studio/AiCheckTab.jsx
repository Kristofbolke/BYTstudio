// AiCheckTab.jsx — AI-suggestiecheck tab voor Studio
// Wrapper rond de volledige AICheck component (zelfde logica als ProjectDetail)
import AICheck from '../AICheck'

export default function AiCheckTab({ project, huisstijl }) {
  if (!project) return null

  const features = Object.entries(project.features_json ?? {})
    .filter(([, v]) => v?.aangevinkt === true)
    .map(([k]) => k)

  const klantnaam = project.klanten?.bedrijfsnaam || project.klanten?.naam || null

  return (
    <AICheck
      projectId={project.id}
      projectNaam={project.naam}
      klantnaam={klantnaam}
      sector={huisstijl?.sector || 'Algemeen'}
      features={features}
      huisstijl={huisstijl}
    />
  )
}
