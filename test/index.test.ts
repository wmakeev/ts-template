import test from 'blue-tape'

import { Timing } from '../src'

test('Timing#listProjectsHierarchy', async t => {
  const timing = new Timing()

  const projects = await timing.listProjectsHierarchy()

  t.ok(projects.data.length, 'should load projects hierarchy')
})

test('Timing#listProjects', async t => {
  const timing = new Timing()

  const { data: projects1 } = await timing.listProjects()

  t.ok(projects1.length, 'should load projects')

  const { data: projects2 } = await timing.listProjects({
    title: 'life'
  })

  t.ok(projects2.length, 'should load projects by title filter')
  t.ok(projects1.length > projects2.length, 'should filter projects')

  const { data: projects3 } = await timing.listProjects({
    hide_archived: true
  })

  t.ok(projects3.length, 'should load non archived projects')
  t.ok(projects1.length > projects2.length, 'should filter projects')
})

test('Timing workflow', async t => {
  const timing = new Timing()

  // createProject
  const project1Title = 'foo1_' + Date.now()

  let project1 = await timing.createProject({
    title: project1Title
  })

  t.equal(
    project1.title,
    project1Title,
    `should create project with title ${project1Title}`
  )

  t.equal(
    project1.is_archived,
    false,
    `project ${project1.title} should't to be archived`
  )

  const project2Title = 'foo2_' + Date.now()

  const resp2 = await timing.createProject(
    {
      title: project2Title
    },
    true
  )

  t.equal(
    resp2.data.title,
    project2Title,
    `should create project ${project2Title}`
  )

  // updateProject

  project1 = await timing.updateProject(project1, {
    is_archived: true
  })

  t.equal(project1.is_archived, true, `should update project ${project1.title}`)

  // deleteProject

  const project1Ref = project1.self

  await timing.delete(project1Ref)

  try {
    ;(await timing.getProject(project1Ref)).self
    throw new Error(`should delete project ${project1Title}`)
  } catch (err) {
    t.equal(err.message, 'Not found.', `should delete project ${project1Title}`)
  }
})

test.only('Timing#(create|get|update|delete)Project', async t => {
  // createProject
})
