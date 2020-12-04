import type { Reference } from './Reference'

export interface BaseTask {
  /**
   * The task's start date and time.
   */
  start_date: Date

  /**
   * The task's end date and time.
   */
  end_date: Date // FIXME depends on is_running

  /**
   * The project this task is associated with.
   */
  project: Reference

  /**
   * The task's title.
   */
  title: string

  /**
   * The task's notes.
   */
  notes: string
}

export interface Task extends Reference, BaseTask {
  /**
   * The task's total duration, in seconds.
   */
  duration: number

  /**
   * Whether the task is currently running.
   * Only one task can be running at any given time.
   */
  is_running: boolean
}

export interface ListLinks {
  first: string
  last: string
  prev: string | null
  next: string | null
}

export interface ListMeta {
  current_page: number
  from: number
  last_page: number
  path: string
  per_page: number
  to: number
  total: number
}

export interface TasksList {
  data: Task[]

  links: ListLinks

  meta: ListMeta
}

export interface TaskQuery {
  /**
   * Restricts the query to tasks whose start date is equal to or later than
   * this parameter.
   */
  start_date_min?: Date

  /**
   * Restricts the query to tasks whose start date is equal to or earlier
   * than this parameter.
   */
  start_date_max?: Date

  /**
   * Restricts the query to tasks associated with the given project.
   *
   * Array of Project id or Reference object
   */
  projects?: Array<string | Reference>

  /**
   * Restricts the query to tasks whose title and/or notes contain all words
   * in this parameter. The search is case-insensitive but diacritic-sensitive.
   */
  search_query?: string

  /**
   * If provided, returns only tasks that are either running or not running.
   */
  is_running?: boolean

  /**
   * If true, the properties of the task's project will be included
   * in the response.
   */
  include_project_data?: boolean

  /**
   * If true, the response will also contain tasks that belong to any child
   * projects of the ones provided in `projects[]`.
   */
  include_child_projects?: boolean
}

interface HasProjectRef {
  /**
   * The project this task is associated with. Can be a project reference in
   * the form `/projects/1`, a project title (e.g. `Project at root level`),
   * or an array with the project's entire title chain
   * (e.g. `["Project at root level", "Unproductive child project"]`).
   */
  project?: string | string[] | Reference
}

/**
 * The object that should be sent to create and start the Task.
 */
export type NewCompletedTask = Partial<Omit<BaseTask, 'project'>> &
  HasProjectRef & {
    start_date: BaseTask['start_date']
    end_date: BaseTask['end_date']
  } & ({ title: BaseTask['title'] } | { project: BaseTask['project'] })

/**
 * The object that should be sent to create completed Task.
 */
export type NewStartedTask = Partial<Omit<BaseTask, 'project'>> &
  HasProjectRef & {
    start_date: BaseTask['start_date']
  } & ({ title: BaseTask['title'] } | { project: BaseTask['project'] })

/**
 * The object that should be sent to update Task.
 */
export type TaskUpdatePatch = Partial<Omit<BaseTask, 'project'>> &
  HasProjectRef &
  ({ title: BaseTask['title'] } | { project: BaseTask['project'] })
