import { publicTasteLabel, type PublicTasteProfile } from '@/lib/public-taste-label'

export default function TasteBadge({ profile }: { profile: PublicTasteProfile | null | undefined }) {
  const label = publicTasteLabel(profile)
  if (!label) return null
  return <small className="taste-badge" title="Based on this member's saved Scent Profile">{label}</small>
}
