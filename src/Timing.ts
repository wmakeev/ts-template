import qs, { ParsedUrlQueryInput } from 'querystring'
import { TimingApiError, TimingError } from './errors'
import type { BaseProject, Project } from './Project'
import type { Reference } from './Reference'
import { dateToString, getReferenceStr, omitField, pathJoin } from './tools'
import type {
  NewCompletedTask,
  NewStartedTask,
  Task,
  TaskQuery,
  TasksList,
  TaskUpdatePatch
} from './Task'

export type FetchResponse = {
  status: number
  statusText: string
  text(): Promise<string>
  url: string
}

export type FetchApi = (
  url: string,
  init?: {
    body?: string
    headers?: Record<string, string>
    method?: string
  }
) => Promise<FetchResponse>

const TIMING_ENDPOINT = 'web.timingapp.com'
const TIMING_API_VERSION = 'v1'

export class Timing {
  private token: string
  private fetch: FetchApi

  constructor(options: { token?: string; fetch?: FetchApi }) {
    const { token } = options

    /* eslint @typescript-eslint/ban-ts-comment:0 */
    if (options.fetch) {
      this.fetch = options.fetch
      // @ts-expect-error
    } else if (typeof fetch !== 'undefined') {
      // @ts-expect-error
      this.fetch = fetch
    } else {
      throw new TimingError('fetch module not found')
    }

    if (token) {
      this.token = token
      // @ts-expect-error
    } else if (typeof TIMING_TOKEN !== 'undefined') {
      // @ts-expect-error
      this.token = TIMING_TOKEN
    } else {
      throw new TimingError('Timing token not specified.')
    }
  }

  protected async fetchApi<T>(
    method: string,
    requestPath: string,
    queryParams?: Record<
      string,
      string | number | boolean | string[] | undefined
    >,
    body?: Object
  ): Promise<T> {
    const urlQuery: ParsedUrlQueryInput = queryParams ?? {}

    const queryString = qs.encode(urlQuery)

    const url =
      `https://${pathJoin(
        TIMING_ENDPOINT,
        'api',
        TIMING_API_VERSION,
        requestPath
      )}` + (queryString ? `?${queryString}` : '')

    const resp = await this.fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const responseText = await resp.text()

    const data = responseText ? JSON.parse(responseText) : undefined

    if (resp.status < 200 || resp.status > 299) {
      throw new TimingApiError(data?.message ?? resp.statusText, resp)
    }

    return data as T
  }

  /**
   * [Return the complete project hierarchy](https://web.timingapp.com/docs/#return-the-complete-project-hierarchy).
   */
  async listProjectsHierarchy() {
    const resp = await this.fetchApi<{ data: Project[] }>(
      'GET',
      'projects/hierarchy'
    )

    return resp
  }

  /**
   * [Return a list containing all projects](https://web.timingapp.com/docs/#return-a-list-containing-all-projects)
   *
   * **Params:**
   *
   * - `title` - Filter for projects whose title contains all words in this parameter. The search is case-insensitive but diacritic-sensitive.
   * - `hide_archived` - If set to true, archived projects and their children will not be included in the result.
   */
  async listProjects(params?: {
    /**
     * Filter for projects whose title contains all words in this parameter.
     * The search is case-insensitive but diacritic-sensitive.
     */
    title?: string

    /**
     * If set to `true`, archived projects and their children will
     * not be included in the result.
     */
    hide_archived?: boolean
  }) {
    const resp = await this.fetchApi<{ data: Project[] }>(
      'GET',
      'projects',
      params
    )

    return resp
  }

  async getProject(reference: string | Reference) {
    const resp = await this.fetchApi<{
      data: Project
      links: { 'time-entries': string }
    }>('GET', getReferenceStr(reference))

    return resp.data
  }

  async createProject(project: Partial<BaseProject> & { title: string }) {
    const resp = await this.fetchApi<{
      data: Project
      links: { 'time-entries': string }
    }>('POST', 'projects', {}, project)

    return resp.data
  }

  /**
   * [Update the specified project](https://web.timingapp.com/docs/#update-the-specified-project)
   *
   * - Omitted fields will not be updated
   * - Changing a project's parent or children is currently not possible
   *
   * @param reference Project reference string `/projects/1` or object with Project reference `{ self: "/projects/1" }`
   * @param project Project object
   */
  async updateProject(
    reference: string | Reference,
    project: Omit<Partial<BaseProject>, 'parent'>
  ) {
    const res = await this.fetchApi<{
      data: Project
    }>('PATCH', getReferenceStr(reference), {}, project)

    return res.data
  }

  /**
   * Return a list of tasks.
   *
   * If no date range filter is provided via `start_date_min` and
   * `start_date_max`, this query returns all tasks between midnight (UTC)
   * 30 days ago and end of day (UTC) today.
   *
   * @param query Tasks query
   */
  async listTasks(query?: TaskQuery) {
    const projects = query?.projects?.map(p => {
      return typeof p === 'string' ? `/projects/${p}` : p.self
    })

    const queryTmp = omitField(query ?? {}, 'projects')

    const queryObj = {
      ...queryTmp,
      'start_date_min': dateToString(queryTmp.start_date_min),
      'start_date_max': dateToString(queryTmp.start_date_min),
      'projects[]': projects
    }

    const res = await this.fetchApi<TasksList>('GET', 'time-entries', queryObj)

    return res
  }

  /**
   * [Start a new task](https://web.timingapp.com/docs/#start-a-new-task)
   *
   * This also stops the currently running task if there is one.
   *
   * ℹ️ The title and project fields can not both be empty.
   *
   * `task.project` - The project this task is associated with. Can be a project reference in
   * the form `/projects/1`, a project title (e.g. `Project at root level`),
   * or an array with the project's entire title chain
   * (e.g. `["Project at root level", "Unproductive child project"]`).
   *
   * @param task Task params
   */
  async startNewTask(task: NewStartedTask) {
    let project: string | undefined

    if (typeof task.project === 'string') {
      project = task.project
    } else if (task.project instanceof Array) {
      project = JSON.stringify(task.project)
    } else {
      project = task.project?.self
    }

    const res = await this.fetchApi<{
      data: Task
      message: string
    }>('POST', 'time-entries/start', {
      ...task,
      project,
      start_date: dateToString(task.start_date),
      end_date: dateToString(task.end_date)
    })

    return res.data // TODO do I need to return a message as well?
  }

  /**
   * [Stop the currently running task](https://web.timingapp.com/docs/#stop-the-currently-running-task)
   *
   * Returns the stopped task
   */
  async stopTask() {
    const res = await this.fetchApi<{
      data: Task
      message: string
    }>('PUT', 'time-entries/stop')

    return res.data
  }

  /**
   * [Create a new task](https://web.timingapp.com/docs/#create-a-new-task)
   *
   * ℹ️ The title and project fields can not both be empty.
   *
   * `task.project` - The project this task is associated with. Can be a project reference in
   * the form `/projects/1`, a project title (e.g. `Project at root level`),
   * or an array with the project's entire title chain
   * (e.g. `["Project at root level", "Unproductive child project"]`).
   *
   * @param task Task object
   */
  async createTask(task: NewCompletedTask) {
    let project: string | undefined

    if (typeof task.project === 'string') {
      project = task.project
    } else if (task.project instanceof Array) {
      project = JSON.stringify(task.project)
    } else {
      project = task.project?.self
    }

    const res = await this.fetchApi<{
      data: Task
      message: string
    }>('POST', 'time-entries', {
      ...task,
      project,
      start_date: dateToString(task.start_date),
      end_date: dateToString(task.end_date)
    })

    return res.data
  }

  /**
   * [Display the specified task](https://web.timingapp.com/docs/#display-the-specified-task)
   *
   * @param reference Task reference
   */
  async getTask(reference: string | Reference) {
    const res = await this.fetchApi<{
      data: Task
    }>('GET', getReferenceStr(reference))

    return res.data
  }

  /**
   * [Update the specified task](https://web.timingapp.com/docs/#display-the-specified-task)
   *
   * - Omitted fields will not be updated
   * - Changing a project's parent or children is currently not possible
   *
   * @param reference Task reference string `/time-entries/1` or object with Project reference `{ self: "/time-entries/1" }`
   * @param task Task object
   */
  async updateTask(reference: string | Reference, task: TaskUpdatePatch) {
    const res = await this.fetchApi<{
      data: Task
    }>('PATCH', getReferenceStr(reference), {}, task)

    return res.data
  }

  /**
   * [Delete the specified project or task](https://web.timingapp.com/docs/#delete-the-specified-task)
   *
   * @param reference Project or Task reference string (`/time-entries/1`, `/project/1`) or object with Project or Task reference (`{ self: "/project/1" }`, `{ self: "/time-entries/1" })`
   */
  async delete(reference: string | Reference) {
    await this.fetchApi<void>('DELETE', getReferenceStr(reference))
  }
}
