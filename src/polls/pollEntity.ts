import { engine, Transform, TextShape, Font, MeshCollider, Material, PointerEvents, PointerEventType, InputAction, Schemas, type Entity, MeshRenderer } from "@dcl/sdk/ecs"
import { Vector3, Color4, Color3 } from "@dcl/sdk/math"
import { syncEntity } from "@dcl/sdk/network"
import { getPlayer } from '@dcl/sdk/src/players'

// In world interactable poll


type Vote = {
  userId: string
  option: string
}

export const PollState = engine.defineComponent('pollState', {
  question: Schemas.String,
  options: Schemas.Array(Schemas.String),
  votes: Schemas.Array(Schemas.Map({
    userId: Schemas.String,
    option: Schemas.String
  }))
})

export function createPollEntity(question: string, options: string[]): Entity {
  const pollEntity = engine.addEntity()
  Transform.create(pollEntity, {
    position: Vector3.create(18.85 * Math.random(), 0.5 * options.length, 20.49 * Math.random()),
    scale: Vector3.create(3, 3, 3)
  })
  TextShape.create(pollEntity, {
    text: question,
    textColor: { r: 1, g: 0, b: 0, a: 1 },
    fontSize: 1,
    font: Font.F_SANS_SERIF
  })
  MeshCollider.setPlane(pollEntity)
  MeshRenderer.setPlane(pollEntity)
  Material.setPbrMaterial(pollEntity, {
    albedoColor: Color4.fromColor3(Color3.Blue(), 0.3)
  })

  // Set up the poll state with initial data
  PollState.create(pollEntity, { question, options, votes: [] })

  PointerEvents.create(pollEntity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_PRIMARY,
        }
      }
    ]
  })

  syncEntity(pollEntity, [PollState.componentId, PointerEvents.componentId, Transform.componentId, MeshCollider.componentId])

  return pollEntity
}

export function onChangePollState(pollState: any, entity: Entity): void {
  if (pollState === null) return

  const currentUserId = getPlayer()?.userId;
  if(currentUserId === undefined) return;

  const userVote = pollState.votes.find((vote: Vote) => vote.userId === currentUserId)?.option;

  const optionLines = pollState.options.map((opt: string) => {
    const count = pollState.votes.filter((vote: Vote) => vote.option === opt).length
    const total = pollState.votes.length === 0 ? 1 : pollState.votes.length
    const percent = Math.round((count / total) * 100)

    const indicator = opt === userVote ? '👉 ' : ''
    return `${indicator}${opt}: ${percent}% (${count})`
  })

  TextShape.getMutable(entity).text = `${pollState.question}\n${optionLines.join('\n')}`
}
