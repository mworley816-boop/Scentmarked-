import { publicTasteLabel, type PublicTasteProfile } from '@/lib/public-taste-label'

type Props = {
  profile?: PublicTasteProfile | null
  label?: string | null
  visible?: boolean
}

export default function TasteBadge({ profile, label, visible = true }: Props) {
  if (!visible) return null
  const resolved = label?.trim() || publicTasteLabel(profile)
  if (!resolved) return null
  return <small className="taste-badge" title="Based on this member's saved Scent Profile">{resolved}</small>
}
