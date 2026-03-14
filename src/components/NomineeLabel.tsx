/**
 * NomineeLabel — Renders a nominee with proper typographic hierarchy.
 *
 * Person-based categories (acting, directing):
 *   Jessie Buckley
 *   Hamnet                    (italic, secondary)
 *
 * Craft person-based (cinematography, editing, costume, casting, score):
 *   Frankenstein              (italic, primary)
 *   Dan Laustsen              (secondary)
 *
 * Song categories:
 *   "Dear Me"                 (quoted, primary)
 *   Diane Warren: Relentless  (italic, secondary)
 *
 * International feature:
 *   The Secret Agent          (italic, primary)
 *   Brazil                    (secondary)
 *
 * Film-only categories:
 *   Sinners                   (italic)
 */

interface NomineeLabelProps {
  label: string
  tags: string[]
  isSelected?: boolean
}

type NomineeType = 'person-film' | 'film-person' | 'song' | 'international' | 'film-only'

function detectType(tags: string[]): NomineeType {
  if (tags.includes('song')) return 'song'
  if (tags.includes('international')) return 'international'
  if (tags.includes('acting') || tags.includes('directing')) return 'person-film'
  // Craft categories that include an artist name after the film
  if (tags.includes('cinematography') || tags.includes('editing') ||
      tags.includes('costume') || tags.includes('casting') ||
      tags.includes('score')) return 'film-person'
  return 'film-only'
}

function parseLabel(label: string, type: NomineeType): { primary: string; secondary?: string; primaryItalic: boolean; secondaryItalic: boolean } {
  const commaIdx = label.indexOf(',')

  switch (type) {
    case 'person-film': {
      // "Jessie Buckley, Hamnet" → primary: Jessie Buckley, secondary: Hamnet (italic)
      if (commaIdx === -1) return { primary: label, primaryItalic: true, secondaryItalic: false }
      return {
        primary: label.slice(0, commaIdx).trim(),
        secondary: label.slice(commaIdx + 1).trim(),
        primaryItalic: false,
        secondaryItalic: true,
      }
    }

    case 'film-person': {
      // "Frankenstein, Dan Laustsen" → primary: Frankenstein (italic), secondary: Dan Laustsen
      if (commaIdx === -1) return { primary: label, primaryItalic: true, secondaryItalic: false }
      return {
        primary: label.slice(0, commaIdx).trim(),
        secondary: label.slice(commaIdx + 1).trim(),
        primaryItalic: true,
        secondaryItalic: false,
      }
    }

    case 'song': {
      // '"Dear Me," Diane Warren: Relentless' → primary: "Dear Me", secondary: Diane Warren: Relentless
      // Find the closing quote to split
      const match = label.match(/^"([^"]+)",?\s*(.+)$/)
      if (match) {
        return {
          primary: `\u201c${match[1]}\u201d`,
          secondary: match[2].trim(),
          primaryItalic: false,
          secondaryItalic: true,
        }
      }
      return { primary: label, primaryItalic: false, secondaryItalic: false }
    }

    case 'international': {
      // "The Secret Agent (Brazil)" → primary: The Secret Agent (italic), secondary: Brazil
      const parenMatch = label.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
      if (parenMatch) {
        return {
          primary: parenMatch[1].trim(),
          secondary: parenMatch[2].trim(),
          primaryItalic: true,
          secondaryItalic: false,
        }
      }
      return { primary: label, primaryItalic: true, secondaryItalic: false }
    }

    case 'film-only':
    default:
      return { primary: label, primaryItalic: true, secondaryItalic: false }
  }
}

export default function NomineeLabel({ label, tags, isSelected }: NomineeLabelProps) {
  const type = detectType(tags)
  const { primary, secondary, primaryItalic, secondaryItalic } = parseLabel(label, type)

  const primaryColor = isSelected ? 'text-gold-light' : 'text-ivory'
  const secondaryColor = isSelected ? 'text-gold-dim' : 'text-ivory-dim'

  return (
    <span className="flex flex-col leading-snug gap-0.5">
      <span className={`text-sm font-medium ${primaryColor} ${primaryItalic ? 'italic' : ''}`}>
        {primary}
      </span>
      {secondary && (
        <span className={`text-xs ${secondaryColor} ${secondaryItalic ? 'italic' : ''}`}>
          {secondary}
        </span>
      )}
    </span>
  )
}
