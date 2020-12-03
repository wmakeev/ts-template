import type { Reference } from './Reference'

export interface BaseProject {
  /**
   * The project's title.
   */
  title: string

  /**
   * The project's color, in hexadecimal format (#RRGGBB).
   *
   * Example: `#FF0000`
   */
  color: string

  /**
   * The project's productivity rating, between -1 (very unproductive) and 1 (very productive).
   *
   * Example: `1`
   */
  productivity_score: number

  /**
   * Whether the project has been archived. Defaults to false.
   *
   * Example: `false`
   */
  is_archived: boolean

  /**
   * A reference to the enclosing project.
   */
  parent: string | null
}

export interface Project extends BaseProject, Reference {
  /**
   * An array containing the title of the project and all its ancestors.
   *
   * Example: `["Parent", "Child"]`
   */
  title_chain: string[]

  /**
   * The project's children.
   */
  children: Reference[]
}
